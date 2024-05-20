// imports
const express = require("express"); // import express
const router = express.Router(); // extract the router portion
const Regulations = require("../models/regulation"); // import model
const Streets = require("../models/street"); // import model

///////////
// ROUTES
///////////
// CREATE
// create a new street
router.post("/", async (req, res) => {
  // capture all of the constructed streets
  let streetArray = constructStreet(req.body.features);

  // attempt to new Set to DB
  try {
    // temp variables
    let iterator = 0;
    let newStreet;

    // loop through the street array
    while (iterator < streetArray.length) {
      // create a new street
      newStreet = new Streets(streetArray[iterator]);

      // attempt to save the street
      newStreet.save();

      // iterate
      iterator++;
    }

    // send status 201 for successful creation
    res.status(201).json({ message: "New Street added with all regulations" });
  } catch (err) {
    // send status 400 for bad data passed in
    res.status(400).json({ message: err.message });
  }
});

////////
// GET
////////
/*
// ALL
router.get("/", async (req, res) => {
  try {
    // find all sets within db
    const sets = await Streets.find();

    // return sets to the user
    res.json(sets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
*/

// GET ONE STREET
router.get("/:streetId", getStreet, (req, res) => {
  // send the json of the requested street
  res.json(res.street);
});

/*
// GET ONE REGULATION FROM A STREET
router.get("/:streetId/:regId", getStreet, (req, res) => {
  // check if we found the street
  if (res.street) {
    // capture the regulation
    let regulation = res.street.feature.properties.regulations.find(
      (element) => element._id == req.params.regId
    );

    // check regulation validity
    if (regulation)
      // send regulation to user
      res.json(regulation);

    // send status 500 for server side error
    res.status(500).json({ message: "Regulation not found" });
  }
});
*/

// GET NEAR
router.get("/", async (req, res) => {
  // capture passed in arguments
  // convert from string to float
  const passedLng = parseFloat(req.query.lng);
  const passedLat = parseFloat(req.query.lat);

  try {
    // attempt to aggregate the nearest documents
    // based on passed in lat, long
    const nearby = await Streets.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [passedLng, passedLat],
          },
          distanceField: "dist.calculated",
          maxDistance: 1000,
        },
      },
      { $limit: 5 },
    ]);

    // return the documents to the user
    res.json(nearby);
  } catch (err) {
    // send status 500 for server side error
    res.status(500).json({ message: err.message });
  }
});

//////////
// PATCH
//////////
// patch the entire street
router.patch("/:streetId", getStreet, async (req, res) => {
  // check passed in data and update accordingly
  if (req.body != null) {
    // construct the street
    let builtStreet = constructStreet(req.body.features)[0];

    // update our street
    res.street.feature.properties = builtStreet.feature.properties;
    res.street.feature.geometry = builtStreet.feature.geometry;

    try {
      // attempt to save updated Set to DB and
      // capture updatedStreet
      const updatedStreet = await res.street.save();

      // send updatedStreet to user
      res.json(updatedStreet);
    } catch (err) {
      // send status 400 for bad data passed in
      res.status(400).json({ message: err.message });
    }
  }
});

///////////
// DELETE
///////////
router.delete("/:streetId", getStreet, async (req, res) => {
  try {
    // attempt to remove the requested street
    await res.street.remove();

    // report to the user
    res.json({ message: "Street deleted" });
  } catch (err) {
    // send status 500 for server side error
    res.status(500).json({ message: err.message });
  }
});

///////////////
// MIDDLEWARE
///////////////
// name: getStreet
// desc: return a single street from the db
async function getStreet(req, res, next) {
  // temp variable
  let street;

  try {
    // attempt to find a set
    street = await Streets.findById(req.params.streetId);

    // check if we have a valid street
    if (street == null) {
      // send status 404 for street not found
      return res.status(404).json({ message: "Cannot find Street" });
    }
  } catch (err) {
    // send status 500 for server side error
    return res.status(500).json({ message: err.message });
  }

  // allow access to res.street within routes
  res.street = street;

  // move on to the next part of the pipeline
  next();
}

// name: constructStreet
// desc: create a Street based on passed in regulations
function constructStreet(featureSet) {
  // temp variables
  let newRegulation,
    newStreet,
    iterator = 0,
    num_features = featureSet.length,
    avg_lat = 0,
    avg_lng = 0,
    regArray = [],
    streetArray = [];

  // loop through features
  while (iterator < num_features) {
    switch (featureSet[iterator].geometry.type) {
      case "GeometryCollection": // regulation
        {
          // set our temp to current regulation in loop
          newRegulation = new Regulations({
            // set passed it feature data
            feature: featureSet[iterator],
          });

          // append to our averages
          avg_lat +=
            newRegulation.feature.geometry.geometries[0].coordinates[0];
          avg_lng +=
            newRegulation.feature.geometry.geometries[0].coordinates[1];

          // append regulation to street
          regArray.push(newRegulation);
        }
        break;

      case "Point": // street
        {
          // calculate averages
          avg_lat = avg_lat / regArray.length;
          avg_lng = avg_lng / regArray.length;

          // set up a street object
          newStreet = {
            feature: {
              properties: {
                city: featureSet[iterator].properties.city,
                state: featureSet[iterator].properties.state,
                zipcode: featureSet[iterator].properties.zipcode,
                regulations: regArray,
              },
              geometry: {
                type: "Point",
                coordinates: [avg_lat, avg_lng],
              },
            },
          };

          // push the street into the street array
          streetArray.push(newStreet);

          // reset variables
          regArray = [];
          avg_lat = 0;
          avg_lng = 0;
        }
        break;
    }

    // iterate
    iterator++;
  }

  // return the street array
  return streetArray;
}

// make available outside of file
module.exports = router;
