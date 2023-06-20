// Import express library
const express = require("express");

// Define app as an instance of express
const app = express();

// Define base URL as http://localhost:8080
const PORT = 8080;

// Configure app to use ejs as the templating engine
app.set("view engine", "ejs");

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

// Route for /urls/new endpoint
app.get("/urls/new", (req, res) => {

  // Find the urls_new template and send it to the browser
  res.render("urls_new");
});

// Route for /urls/:id endpoint (note that :id is a route parameter)
app.get("/urls/:id", (req, res) => {

  // Object to pass data for a single URL to the template
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };

  // Pass data for a single URL to the template
  res.render("urls_show", templateVars);
});

// Route for /urls.json endpoint
app.get("/urls.json", (req, res) => {

  // Send urlDatabase object as a JSON response to the client
  res.json(urlDatabase);
});

// Route for /urls endpoint
app.get("/urls", (req, res) => {

  // Object to pass data to the template
  const templateVars = { urls: urlDatabase };

  // Pass URL data to the template
  res.render("urls_index", templateVars);
});

// Route for /hello endpoint
app.get("/hello", (req, res) => {

  // Send response with HTML content to client
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// Start express server and listen on specified port
app.listen(PORT, () => {

  // Confirm port number in console message
  console.log(`App listening on port ${PORT}! 😀`);
});