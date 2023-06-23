// Import express library
const express = require("express");

// Import cookie-parser
const cookieParser = require('cookie-parser');

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

// Generate a string of 6 random alphanumeric characters (a-z, A-Z, and 0-9)
const generateRandomString = () => {
  let result = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let length = characters.length;
  // Loop through the characters string to generate a length of 6
  for (let i = 0; i < 6; i++) {
    // Select a random character from the characters string
    result += characters.charAt(Math.floor(Math.random() * length));
  }
  return result;
};

// Middleware to parse the request body data from a Buffer into human-readable string
app.use(express.urlencoded({ extended: true }));

// Middleware to parse cookie requests into human-readable details
app.use(cookieParser());

// Route handler for root path '/'
app.get("/", (req, res) => {

  // Send response to client
  res.send("Hello!");
});

// Route for /urls/new endpoint
app.get("/urls/new", (req, res) => {
  const templateVars = {
    // Pass in the username (using the cookie value) to the url_index template
    username: req.cookies["username"],
  };

  // Find the urls_new template and send it to the browser
  res.render("urls_new", templateVars);
});

// Route for /urls/:id endpoint (note that :id is a route parameter)
app.get("/urls/:id", (req, res) => {

  // Object to pass data for a single URL to the template
  const templateVars = {
    // Pass in the username (using the cookie value) to the url_index template
    username: req.cookies["username"],
    id: req.params.id,
    longURL: urlDatabase[req.params.id]
  };

  // Pass data for a single URL to the template
  res.render("urls_show", templateVars);
});

// Route for /u/:id endpoint (note that :id is a route parameter)
app.get("/u/:id", (req, res) => {

  // Get the longURL value associated with the Short URL (id) in the urlDatabase object
  const longURL = urlDatabase[req.params.id];

  // Redirect user to the longURL website
  res.redirect(longURL);
});

// Route for /urls.json endpoint
app.get("/urls.json", (req, res) => {

  // Send urlDatabase object as a JSON response to the client
  res.json(urlDatabase);
});

// Route for /urls endpoint
app.get("/urls", (req, res) => {

  // Object to pass data to the template
  const templateVars = {
    // Pass in the username (using the cookie value) to the url_index template
    username: req.cookies["username"],
    urls: urlDatabase
  };

  // Pass URL data to the template
  res.render("urls_index", templateVars);
});

// Route for /hello endpoint
app.get("/hello", (req, res) => {

  // Send response with HTML content to client
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// POST route for /urls endpoint to receive new URL form submission
app.post("/urls", (req, res) => {

  // Set longURL to be the POST request body
  const longURL = req.body.longURL;

  // Use generateRandomString function to generate short URL ID
  const id = generateRandomString();

  // Assign longURL as the value of the newly-generated Short URL ID key in the urlDatabase object
  urlDatabase[id] = longURL;

  // Redirect user to /urls/:id
  res.redirect(`/urls/${id}`);
});

// POST route for /urls/:id/delete to handle short URL ID deletion
app.post(`/urls/:id/delete`, (req, res) => {

  // Set Short URL ID to be the POST request body
  const id = req.params.id;

  // Delete the specified Short URL ID
  delete urlDatabase[id];

  // Redirect user to /urls
  res.redirect(`/urls`);
});

// POST route for /urls/:id to handle editing of Short URL ID details
app.post(`/urls/:id`, (req, res) => {

  // Get the id from the route parameter
  const id = req.params.id;

  // Assign longURL value to be the editURL value received from the POST request body
  const longURL = req.body.newURL;

  // Update the longUrl value in the database with the new value
  urlDatabase[id] = longURL;

  // Redirect user to /urls
  res.redirect(`/urls`);
});

// POST route for /login
app.post('/login', (req, res) => {

  // Get the username from the request body
  const username = req.body.username;

  // Set a cookie named username to the value for username submitted in the request body
  res.cookie('username', username);

  // Redirect user to /urls
  res.redirect('/urls');
});

// Start express server and listen on specified port
app.listen(PORT, () => {

  // Confirm port number in console message
  console.log(`App listening on port ${PORT}! 😀`);
});