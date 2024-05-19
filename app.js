const http = require("http"); // import http functionality
const port = 3001; // hold the port in a variable
const fs = require("fs"); // import filestream
const fetch = require("cross-fetch");

// create a new server
const server = http.createServer(function (req, res) {
  res.writeHead(200, { "Content-Type": "text/html" }); // set header and content-type
  fs.readFile("index.html", function (error, data) {
    // read in associated html file
    if (error) {
      // check for errors
      res.writeHead(404); // set header if error exists
      res.write("Error: File Not Found"); // write out that error occurred
    } else {
      res.write(data); // write out html file on success
    }

    res.end(); // finalize the response
  });
});

// enable the server to listen to specific port
server.listen(port, function (error) {
  if (error) {
    // check of errors
    console.log("Something went wrong", error); // log that error occurred, including the error
  } else {
    console.log("Web Server is listening on port " + port); // log successful connection
  }
});
