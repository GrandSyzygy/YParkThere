const mongoose = require("mongoose");
const GeoJSON = require("mongoose-geojson-schema");

//////////////////////////////////////////////////////////////////////////////////////////////
//  schema: street                             // struct to store a set of regulations
//  {                                          // of a street; one-to-many relationship
//    feature: {
//      properties: {
//        city: String,                        // city where the regulation is located
//        state: enum (String),                // state where the regulation is located
//        zipcode: number,                     // zipcode where the regulation is located
//        regulations: [regulation],           // embedded regulations for respective half
//      },
//      geometry: {                            // averaged regulations coords; 2dsphere indexed
//        type: Point,                         // GeoJSON Point object
//        coordinates: [float lat, float lng]  // lat, lng data of street
//      }
//    }
//    *OPTIONS*
//                                             // timestamps enabled for createdAt
//                                             // and updatedAt
//  }
//////////////////////////////////////////////////////////////////////////////////////////////
const streetSchema = new mongoose.Schema(
  {
    feature: {
      properties: {
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          enum: [
            "Alabama",
            "Alaska",
            "Arizona",
            "Arkansas",
            "California",
            "Colorado",
            "Connecticut",
            "Delaware",
            "District of Columbia",
            "Florida",
            "Georgia",
            "Hawaii",
            "Idaho",
            "Illinois",
            "Indiana",
            "Iowa",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Maine",
            "Maryland",
            "Massachusetts",
            "Michigan",
            "Minnesota",
            "Mississippi",
            "Missouri",
            "Montana",
            "Nebraska",
            "Nevada",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "New York",
            "North Carolina",
            "North Dakota",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Vermont",
            "Virginia",
            "Washington",
            "West Virginia",
            "Wisconsin",
            "Wyoming",
          ],
          required: true,
        },
        zipcode: {
          type: Number,
          required: true,
        },
        regulations: {
          type: [],
          required: true,
          validate: [
            regulations_minimum,
            "{PATH} needs at least one regulation",
          ],
        },
      },
      geometry: {
        type: mongoose.Schema.Types.Point,
        index: "2dsphere",
        required: true,
      },
    },
  },
  { timestamps: { createdAt: true } }
);

// validate we have at least
// one regulation tracked
function regulations_minimum(val) {
  return val.length != 0;
}

// make model available
module.exports = mongoose.model("Streets", streetSchema);
