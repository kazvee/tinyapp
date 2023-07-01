//================
//  DEPENDENCIES
//================

// Import express library
const express = require('express');
// Import method-override package
const methodOverride = require('method-override');
// Import cookie-session
const cookieSession = require('cookie-session');
// Define app as an instance of express
const app = express();
// override with POST having ?_method=DELETE
app.use(methodOverride('_method'));
// Define base URL with port number on which the server will listen as http://localhost:8080
const PORT = 8080;
// Import bcryptjs to hash user passwords
const bcrypt = require('bcryptjs');

//=============
//  FUNCTIONS
//=============
// Import helper functions
const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

//===========
//  OBJECTS
//===========

// Object containing shortened URLs
// Key is 'id' and value is an object that has its own Keys
const urlDatabase = {
  b6UTxQ: {
    longURL: 'https://www.tsn.ca',
    userID: 'aJ48lW',
    visits: {},
    totalVisits: 0,
    uniqueVisits: 0,
    createdDate: 0,
  },
  i3BoGr: {
    longURL: 'https://www.google.ca',
    userID: 'aJ48lW',
    visits: {},
    totalVisits: 0,
    uniqueVisits: 0,
    createdDate: 0,
  }
};

// TEST DATA ONLY - Object to store & access user data
const users = {
  userRandomID: {
    id: 'user1RandomID',
    email: 'user@example.com',
    password: 'yellow-snake-bird',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'washing-machine-soap',
  },
};

// Helper objects to add text styling for Login and Register error message pages
const htmlBodyStart = '<html><body>';
const textStyle = `<p style='font-family: Verdana, sans-serif; font-size: 16px'>`;
const loginLink = `<a href='/login'>HERE</a>`;
const registerLink = `<a href='/register'>HERE</a>`;
const htmlBodyEnd = `</body></html>\n`;

//==============
//  MIDDLEWARE
//==============

// Configure app to use ejs as the templating engine to render pages dynamically
app.set('view engine', 'ejs');
// Parse request body data from Buffer into human-readable string and makes the values accessible
app.use(express.urlencoded({ extended: true }));
// Configure app to use encrypted cookies
app.use(cookieSession({
  name: 'session',
  keys: ['gudetama'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//==========
//  ROUTES
//==========

//==============
//  GET ROUTES
//==============

//=================
//  ROOT PATH '/'
//=================
app.get('/', (req, res) => {
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Redirect user to login
    return res.redirect('/login');
  }
  // Redirect user to /urls
  return res.redirect('/urls');
});

//=============
//  /URLS/NEW
//=============
app.get('/urls/new', (req, res) => {
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'userId' cookie value
    // and pass the entire 'user' object to templates via templateVars
    user: users[req.session.userId]
  };
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Redirect user to login
    return res.redirect('/login');
  }
  // Find the urls_new template and send it to the browser
  res.render('urls_new', templateVars);
});

//=============
//  /URLS/:ID
//=============
// Note that ':id' is a route parameter
app.get('/urls/:id', (req, res) => {
  // Check if requested Short URL ID exists in the database
  if (!urlDatabase[req.params.id]) {
    // If not, send error message to user
    return res.status(404).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    The Short URL ID provided (${req.params.id}) does not exist.<br><br>
    Please try again.
    ${htmlBodyEnd}`);
  }
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Advise user that they must be logged in to view /urls/:id
    return res.status(401).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      Must be logged in to view this page.<br><br>
      Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
      ${htmlBodyEnd}`);
  }
  // If logged in user does not own the URL 'id'
  if (!urlsForUser(req.session.userId, urlDatabase)[req.params.id]) {
    // Advise user they are not permitted to access it
    return res.status(403).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      You do not have permission to access this URL.<br><br>
      Please click <a href='/urls'>HERE</a> to access your owned URLs.
      ${htmlBodyEnd}`);
  }
  // Get the URL object from the urlDatabase
  const url = urlDatabase[req.params.id];
  // Get the total number of visits for the URL
  const totalVisits = url.totalVisits;
  // Get the total number of unique visits for the URL
  const uniqueVisits = url.uniqueVisits;
  // Get the createdDate for the URL
  const createdDate = url.createdDate;
  // Object to pass data for a single URL to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'userId' cookie value
    // and pass the entire 'user' object to templates via templateVars
    user: users[req.session.userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    urls: urlsForUser(req.session.userId, urlDatabase),
    totalVisits,
    uniqueVisits,
    visitorID: req.session.visitorID,
    createdDate
  };
  // Pass data for a single URL to the template
  res.render('urls_show', templateVars);
});

//==========
//  /U/:ID
//==========
// Note that ':id' is a route parameter
app.get('/u/:id', (req, res) => {
  // Check if requested Short URL ID exists in the database
  if (!urlDatabase[req.params.id]) {
    // If not, send error message to user
    return res.status(404).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    The Short URL ID provided (${req.params.id}) does not exist.<br><br>
    Please try again.
    ${htmlBodyEnd}`);
  }
  // TRACK VISIT STATS
  // Get URL object from the urlDatabase
  const url = urlDatabase[req.params.id];
  // Create a timestamp of the current time
  const timestamp = new Date().toISOString();
  // Count the existing url session views OR (||) set it to 0 if there are none yet
  let totalVisits = req.session.views || 0;
  // Add 1 to totalVisits
  totalVisits += 1;
  // Update the session data with the modified totalVisits total
  req.session.views = totalVisits;
  // Check if the visitorID exists in the session and if not, generate a new visitorID
  const visitorID = req.session.visitorID || generateRandomString();
  // If visitorID does not exist then store it in the session data
  if (!req.session.visitorID) {
    req.session.visitorID = visitorID;
  }
  // Count the existing uniqueVisits or set to 0 if there are none
  let uniqueVisits = urlDatabase[req.params.id];
  if (!uniqueVisits) {
    uniqueVisits = 0;
  }
  // Check if the visitorID has already been recorded for this Short URL
  if (!url.visits[visitorID]) {
    // If not, add their visitorID and timestamp to the visits object for unique views
    url.visits[visitorID] = { timestamp: timestamp.toLocaleLowerCase() };
    // Add 1 to the uniqueVisits total
    url.uniqueVisits += 1;
  }
  // Add 1 to the totalVisits total
  urlDatabase[req.params.id].totalVisits += 1;
  // Get longURL value associated with Short URL 'id' in the urlDatabase object
  const longURL = urlDatabase[req.params.id].longURL;
  // Redirect user to the actual website (longURL) associated to the Short URL ID
  res.redirect(longURL);
});

// Route for /urls.json endpoint, to help with route testing
app.get('/urls.json', (req, res) => {
  // Send urlDatabase object as a JSON response to the client
  res.json(urlDatabase);
});

//=========
//  /URLS
//=========
app.get('/urls', (req, res) => {
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Advise user that they must be logged in to view /urls
    return res.status(401).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Must be logged in to view URLs.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }
  // Object to pass data to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'userId' cookie value
    // and pass the entire 'user' object to templates via templateVars
    user: users[req.session.userId],
    // Lookup the URLs belonging to this user, and pass them to the templates
    urls: urlsForUser(req.session.userId, urlDatabase),
  };
  // Pass URL data to the template
  res.render('urls_index', templateVars);
});

//=============
//  /REGISTER
//=============
// Handle new user signup
app.get('/register', (req, res) => {
  // Object to pass data to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'userId' cookie value
    // and pass the entire 'user' object to templates via templateVars
    user: users[req.session.userId]
  };
  // If user is already logged in with cookie
  if (req.session.userId) {
    // Redirect them to /urls
    return res.redirect('/urls');
  }
  // Find the register.ejs template and send it to the browser
  res.render('register', templateVars);
});

//=============
//  /LOGIN
//=============
// Handle existing user sign-in
app.get('/login', (req, res) => {
  // Object to pass data to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'userId' cookie value
    // and pass the entire 'user' object to templates via templateVars
    user: users[req.session.userId]
  };
  // If user is already logged in with cookie
  if (req.session.userId) {
    // Redirect them to /urls
    return res.redirect('/urls');
  }
  // Find the login.ejs template and send it to the browser
  res.render('login', templateVars);
});

//===============
//  POST ROUTES
//===============

//=========
//  /URLS
//=========
// Handle new URL form submission
app.post('/urls', (req, res) => {
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Advise user that they must be logged in to create new Short URL
    return res.status(401).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Must be logged in to create a new short URL.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }
  // Set longURL to be the POST request body
  const longURL = req.body.longURL;
  // Use generateRandomString function to generate short URL ID
  const id = generateRandomString();
  // Store 'longURL' and 'userID' in the object associated with the 'id' key within the urlDatabase object
  urlDatabase[id] = {
    longURL,
    userID: req.session.userId,
    visits: {},
    totalVisits: 0,
    uniqueVisits: 0,
    createdDate: new Date().toISOString()
  };
  // Redirect user to /urls/:id
  res.redirect(`/urls/${id}`);
});

//==========
//  /LOGIN
//==========
// Handle existing user sign-in
app.post('/login', (req, res) => {
  // Get email address from request body
  const email = req.body.email;
  // Get password from request body
  const password = req.body.password;
  // Handle error if user enters empty strings for email and/or password
  if (!email || !password) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Login failed. Please doublecheck the credentials provided.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }
  // Lookup the specific 'user' object in the 'users' object using the entered email address
  const user = getUserByEmail(email, users);
  // Handle error if 'user' object does not exist
  if (!user) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    No account found with the email address provided.<br><br>
    Please click ${registerLink} to register! 🙂
    ${htmlBodyEnd}`);
  }
  // Handle error if 'user' object exists BUT entered password does not match existing hashed password value
  if (user && !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Login failed. Please doublecheck the credentials provided.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }
  // If 'user' exists AND entered password is a match, set cookie named 'userId' to the value for the 'id' of the user
  req.session.userId = user.id;
  // Redirect user to /urls
  res.redirect('/urls');
});

//===========
//  /LOGOUT
//===========
// Handle user sign-out
app.post('/logout', (req, res) => {
  // Clear the 'userId' cookie
  req.session = null;
  // Redirect user to /urls
  res.redirect('/login');
});

//=============
//  /REGISTER
//=============
// Handle new user sign-up
app.post('/register', (req, res) => {
  // Get new user email address from request body
  const email = req.body.email;
  // Get new user password from request body
  const password = req.body.password;
  // Handle error if user enters empty strings for email and/or password
  if (!email || !password) {
    return res.status(400).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Please enter a valid email address and a secure password.<br><br>
    Click ${registerLink} to try again! 🙂
    ${htmlBodyEnd}`);
  }
  // Handle error if user enters an email address that already exists in the 'users' object
  if (getUserByEmail(email, users)) {
    return res.status(400).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    An account already exists for the email address provided.<br><br>
    Please click ${loginLink} to login! 🙂
    ${htmlBodyEnd}`);
  }
  // Use generateRandomString function to generate random User ID
  const userID = generateRandomString();
  // Securely hash the password
  const hashedPassword = bcrypt.hashSync(password, 10);
  // Add the new user object & data to the global 'users' object
  users[userID] = {
    id: userID,
    email,
    password: hashedPassword
  };
  // Set cookie named 'userId' to the value for the newly-generated User ID
  req.session.userId = userID;
  // Redirect user to /urls
  res.redirect('/urls');
});

//==============
//  PUT ROUTES
//==============

//==============
//  /URLS/:ID
//==============
// Handle Short URL ID editing
app.put('/urls/:id', (req, res) => {
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Advise user that they must be logged in to edit a Short URL
    return res.status(401).send(`
          ${htmlBodyStart}
          ${textStyle}
          Response Status Code: ${res.statusCode}<br><br>
          Must be logged in to edit a short URL.<br><br>
          Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
          ${htmlBodyEnd}`);
  }
  // Get the Short URL ID from the route parameter
  const id = req.params.id;
  // Check if requested Short URL ID exists in the database
  if (!urlDatabase[id]) {
    // If not, send error message to user
    return res.status(404).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      The Short URL ID provided (${req.params.id}) does not exist.<br><br>
      Please try again.
      ${htmlBodyEnd}`);
  }
  // If logged in user does not own the URL 'id'
  if (!urlsForUser(req.session.userId, urlDatabase)[id]) {
    // Advise user they are not permitted to edit it
    return res.status(403).send(`
          ${htmlBodyStart}
          ${textStyle}
          Response Status Code: ${res.statusCode}<br><br>
          You do not have permission to edit this URL.<br><br>
          Please click <a href='/urls'>HERE</a> to access your owned URLs.
          ${htmlBodyEnd}`);
  }
  // Assign longURL value to be the editURL value received from the POST request body
  const longURL = req.body.newURL;
  // Update the longUrl value in the database with the newly-provided longURL value
  urlDatabase[id].longURL = longURL;
  // Redirect user to /urls
  res.redirect('/urls');
});

//=================
//  DELETE ROUTES
//=================

//====================
//  /URLS/:ID
//====================
// Handle Short URL ID deletion
app.delete('/urls/:id', (req, res) => {
  // If user is not logged in with cookie
  if (!req.session.userId) {
    // Advise user that they must be logged in to delete a Short URL
    return res.status(401).send(`
        ${htmlBodyStart}
        ${textStyle}
        Response Status Code: ${res.statusCode}<br><br>
        Must be logged in to delete a short URL.<br><br>
        Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
        ${htmlBodyEnd}`);
  }
  // Get the Short URL ID from the route parameter
  const id = req.params.id;
  // Check if requested Short URL ID exists in the database
  if (!urlDatabase[id]) {
    // If not, send error message to user
    return res.status(404).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      The Short URL ID provided (${req.params.id}) does not exist.<br><br>
      Please try again.
      ${htmlBodyEnd}`);
  }
  // If logged in user does not own the URL 'id'
  if (!urlsForUser(req.session.userId, urlDatabase)[id]) {
    // Advise user they are not permitted to delete it
    return res.status(403).send(`
        ${htmlBodyStart}
        ${textStyle}
        Response Status Code: ${res.statusCode}<br><br>
        You do not have permission to delete this URL.<br><br>
        Please click <a href='/urls'>HERE</a> to access your owned URLs.
        ${htmlBodyEnd}`);
  }
  // Delete the specified Short URL ID
  delete urlDatabase[id];
  // Redirect user to /urls
  res.redirect('/urls');
});

//================
// END OF ROUTES
//================

// Start express server and listen on specified port
app.listen(PORT, () => {
  // Confirm port number in console message
  console.log(`App listening on port ${PORT}! 😀`);
});