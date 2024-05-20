// imports
const mongoose = require("mongoose");
const GeoJSON = require("mongoose-geojson-schema");

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//  schema: regulation                                // data for a regulation
//  {
//    feature : {
//      properties: {
//        category: enum (String),                    // type of regulation; No Parking, Disabled, etc.
//        details: String,                            // additional information for the regulation
//        active_days: [Boolean],                     // days in which the regulation is active
//                                                    // format: Sunday = [0], ..., Saturday = [6]
//        active_hours: [                             // hours of activity; range
//          start: Date,                              // ISO 8601 Format
//          end: Date],                               // Ex: "2022-11-12T20:06+00:00"
//                                                    // if matching then it lasts all day
//        permit: Number,                             // permit number related to access
//        expiration_date: Date,                      // used if temporary; ex: construction
//        priority: Number,                           // range between 1-5 by least -> most important
//                                                    // [1-2]: standard; [3-4]: holiday; [5]: emergency
//                                                    // useful in case of special holiday supersession
//        is_prohibiting: Boolean,                    // is regulation allowing or disallowing parking
//        sign_image_link: String                     // string to point to the image of the sign
//      },
//      geometry: {
//        type: GeometryCollection,
//        geometries: [                               // array storing GeoJSON data
//          {
//            Point,
//            coordinates: [float lat, float long]    // lat, long of the regulation; 2dsphere indexed
//          }, {
//            LineString,
//            coordinates: [
//                                                    // represent where the regulation effects
//              [float start_lat, float start_long],  // first pair is the start point of aoe
//              ...,
//              [float end_lat, float end_long]       // final pairs represent the end of aoe
//            ]
//          }
//        ]
//      }
//    }
//  }
//  *OPTIONS TO ENABLE*
//                                                    // make sure to enable timestamps at creation for
//                                                    // access to createdAt and updatedAt
//////////////////////////////////////////////////////////////////////////////////////////////////////////
const regulationSchema = new mongoose.Schema(
  {
    feature: {
      properties: {
       category: {
          type: String,
          enum: ["No Parking", "Disabled", "Permit Only", "Metered"],
          required: true,
        },
        details: {
          type: String,
          default: null,
        },
        active_days: {
          type: [Boolean],
          required: true,
          validate: [
            active_days_limiter,
            "{PATH} does not meet array size of 7 (days of the week)",
          ],
        },
        active_hours: {
          type: [Date],
          required: true,
          validate: [
            active_hours_limiter,
            "{PATH} does not meet array size of 2 (start and end)",
          ],
        },
        permit: {
          type: Number,
          required: true,
          default: 0,
        },
        expiration_date: {
          type: Date,
          default: null,
        },
        priority: {
          type: Number,
          required: true,
          default: 1,
        },
        is_prohibiting: {
          type: Boolean,
          required: true,
          default: true,
        },
        sign_image_link: {
          type: String,
          required: true,
          default: "Add link to sign image"
        }
      },
      geometry: {
        type: mongoose.Schema.Types.GeometryCollection,
        required: true,
      },
    },
  },
  { timestamps: { createdAt: true } }
);

// validate if 7 bools for
// active_days were passed in
function active_days_limiter(val) {
  return val.length == 7;
}

// validate we only have a
// start and end time pair
function active_hours_limiter(val) {
  return val.length === 2;
}

// make model available
module.exports = mongoose.model("Regulations", regulationSchema);
