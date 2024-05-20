// imports
const express = require("express"); // import express
const router = express.Router({ mergeParams: true }); // extract the router portion
const Regulations = require("../models/regulation"); // import model
const Streets = require("../models/street"); // import model

///////////
// ROUTES
///////////
// CREATE
router.post("/", async (req, res) => {
  try {
    // find the Street we are adding to
    let currStreet = await Streets.findById(req.params.streetId);

    // check we actually have a usable Street
    if (currStreet) {
      // temp variables
      let newRegulation,
        iterator = 0,
        num_regs = req.body.features.length,
        avg_lat = currStreet.feature.geometry.coordinates[0],
        avg_lng = currStreet.feature.geometry.coordinates[1],
        regArray = currStreet.feature.properties.regulations;

      // loop through passed in features
      while (iterator < num_regs) {
        // create new regulation
        newRegulation = new Regulations({
          feature: req.body.features[iterator],
        });

        // add up our lat, lng
        avg_lat += newRegulation.feature.geometry.geometries[0].coordinates[0];
        avg_lng += newRegulation.feature.geometry.geometries[0].coordinates[1];

        // append to our regulations
        regArray.push(newRegulation);

        // iterate
        iterator++;
      }

      // calculate our new average
      avg_lat = avg_lat / (num_regs + 1);
      avg_lng = avg_lng / (num_regs + 1);

      // update our street
      currStreet.feature.properties.regulations = regArray;
      currStreet.feature.geometry = {
        type: "Point",
        coordinates: [avg_lat, avg_lng],
      };

      // attempt to save
      await currStreet.save();
    }
  } catch (err) {
    // send status 400 for bad data passed in
    res.status(400).json({ message: err.message });
  }

  // send status 201 for successful creation
  res.status(201).json({ message: "New regulation(s) added" });
});

// GET ALL
router.get("/", async (req, res) => {
  try {
    // find the Street
    let currStreet = await Streets.findById(req.params.streetId);

    // check if the street exist
    if (currStreet) {
      // capture the regulations
      const regulations = currStreet.feature.properties.regulations;

      // send models to user
      res.json(regulations);
    }
  } catch {
    // send status 500 for server side error
    res.status(500).json({ message: err.message });
  }
});

// GET ONE
router.get("/:regId", async (req, res) => {
  try {
    // capture the street we want to search
    let currStreet = await Streets.findById(req.params.streetId);

    // check if the set exist
    if (currStreet) {
      // capture the regulation
      let regulation = currStreet.feature.properties.regulations.find(
        (element) => element._id == req.params.regId
      );

      // return json to the user
      if (regulation) res.json(regulation);
    }
  } catch (err) {
    // send status 500 for server side error
    res.status(500).json({ message: err.message });
  }
});

// UPDATE
router.patch("/:regId", async (req, res) => {
  // check the passed in data and update accordingly
  if (req.body) {
    try {
      // capture the street we want to search
      let currStreet = await Streets.findById(req.params.streetId);

      // check if the set exist
      if (currStreet) {
        // capture the regulation
        let regulation = currStreet.feature.properties.regulations.find(
          (element) => element._id == req.params.regId
        );

        // check regulation validity
        if (regulation) {
          // capture the index
          let index = currStreet.feature.properties.regulations.findIndex(
            (element) => element._id == req.params.regId
          );

          // update the regulation
          regulation.feature.properties = req.body.properties;
          regulation.feature.geometry = req.body.geometry;

          // update the regulation within the street
          currStreet.feature.properties.regulations[index] = regulation;

          // temp variables
          let iterator = 0,
            num_regs = currStreet.feature.properties.regulations.length,
            avg_lat = 0,
            avg_lng = 0;

          // loop for average recalculation
          while (iterator < num_regs) {
            // add up our lat, lng
            avg_lat +=
              currStreet.feature.properties.regulations[iterator].feature.geometry
                .geometries[0].coordinates[0];
            avg_lng +=
              currStreet.feature.properties.regulations[iterator].feature.geometry
                .geometries[0].coordinates[1];

            // iterate
            iterator++;
          }

          // calculate our averages
          avg_lat = avg_lat / num_regs;
          avg_lng = avg_lng / num_regs;

          // update our street geometry
          currStreet.feature.geometry = {
            type: "Point",
            coordinates: [avg_lat, avg_lng],
          };

          // attempt to save to db
          const updatedStreet = await currStreet.save();

          // return the regulation to the user
          res.json(updatedStreet);
        }
      }
    } catch (err) {
      // send status 400 for bad data passed in
      res.status(400).json({ message: err.message });
    }
  }
});

// CURRENTLY DISALLOWED BY CORS SETTINGS
// DELETE
router.delete("/:regId", async (req, res) => {
  // check the passed in data and update accordingly
  if (req.body) {
    try {
      // capture the street we want to search
      let currStreet = await Streets.findById(req.params.streetId);

      // check if street exist
      if (currStreet) {
        // temp variables
        let iterator = 0,
          num_regs = currStreet.feature.properties.regulations.length,
          avg_lat = 0,
          avg_lng = 0,
          regArray = [];

        // find the regulation to remove
        while (iterator < num_regs) {
          // check if ids match, skip if so
          if (
            currStreet.feature.properties.regulations[iterator]._id
              .toString()
              .localeCompare(req.params.regId) != 0
          ) {
            // push into our new regulations array
            regArray.push(currStreet.feature.properties.regulations[iterator]);

            // update our averages
            avg_lat +=
              regArray[regArray.length - 1].feature.geometry.geometries[0]
                .coordinates[0];
            avg_lng +=
              regArray[regArray.length - 1].feature.geometry.geometries[0]
                .coordinates[1];
          }

          // iterate
          iterator++;
        }

        // calculate our averages
        avg_lat = avg_lat / regArray.length;
        avg_lng = avg_lng / regArray.length;

        // update our street
        currStreet.feature.properties.regulations = regArray;
        currStreet.feature.geometry = {
          type: "Point",
          coordinates: [avg_lat, avg_lng],
        };

        // attempt to save
        const updatedStreet = await currStreet.save();

        // return the regulation to the user
        res.json(updatedStreet);
      }
    } catch (err) {
      // send status 400 for bad data passed in
      res.status(400).json({ message: err.message });
    }
  }
});

// make available outside of file
module.exports = router;
