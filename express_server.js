// Import express library
const express = require("express");

// Define app as an instance of express
const app = express();

// Define base URL as http://localhost:8080
const PORT = 8080;

// Object containing shortened URLs
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Route handler for root path '/'
app.get("/", (req, res) => {

  // Send response to client
  res.send("Hello!");
});

// Start express server and listen on specified port
app.listen(PORT, () => {

  // Confirm port number in console message
  console.log(`App listening on port ${PORT}! 😀`);
});