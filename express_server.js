//================
//  DEPENDENCIES
//================

// Import express library
const express = require('express');
// Import cookie-parser
const cookieParser = require('cookie-parser');
// Define app as an instance of express
const app = express();
// Define base URL with port number on which the server will listen as http://localhost:8080
const PORT = 8080;

//===========
//  OBJECTS
//===========

// Object containing shortened URLs
// where key is 'id' and value is an object that has its own keys of 'longURL' and 'userID'
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
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

// Helper objects to add text styling for login & register error message pages
const htmlBodyStart = '<html><body>';
const textStyle = `<p style='font-family: Verdana, sans-serif; font-size: 16px'>`;
const loginLink = `<a href='/login'>HERE</a>`;
const registerLink = `<a href='/register'>HERE</a>`;
const htmlBodyEnd = `</body></html>\n`;

//=============
//  FUNCTIONS
//=============

// Helper function to generate new Short URL ID from a string of 6 random alphanumeric characters (a-z, A-Z, and 0-9)
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

// Helper function to validate users, checks if email address exists in the 'users' object, taking in 'email' as a parameter
const getUserByEmail = (email) => {
  // Loop through the users object
  for (const userKey in users) {
    const user = users[userKey];
    // If email address already exists in the users object, return the entire 'user' object
    if (email === user.email) {
      return user;
    }
  }
  // If email not found in the users object
  return null;
};

// Helper function to return the URLs belonging to the current user
// Takes in 'id' as a parameter and returns URLs where 'userID' is equal to the 'id' of the currently logged-in user
const urlsForUser = (id) => {
  // Object to store URLs belonging to the current user
  const currentUserURLs = {};
  // Loop through the urlDatabase object
  for (const shortUrlID in urlDatabase) {
    // Check for Short URL IDs that have the current user's 'userID'
    if (urlDatabase[shortUrlID].userID === id) {
      // Assign them to the current user's list of Short URL IDs
      currentUserURLs[shortUrlID] = urlDatabase[shortUrlID];
    }
  }
  return currentUserURLs;
};

//==============
//  MIDDLEWARE
//==============

// Configure app to use ejs as the templating engine to render pages dynamically
app.set('view engine', 'ejs');
// Parse request body data from Buffer into human-readable string and makes the values accessible
app.use(express.urlencoded({ extended: true }));
// Parse cookie requests into human-readable details and makes the values accessible
app.use(cookieParser());

//==========
//  ROUTES
//==========

//==============
//  GET ROUTES
//==============

// Route handler for root path '/'
app.get('/', (req, res) => {
  // Send response to client
  res.send('Hello!');
});

// Route for /urls/new endpoint
app.get('/urls/new', (req, res) => {
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'user_id' cookie value
    // & pass the entire object to templates via templateVars
    user: users[req.cookies['user_id']]
  };
  // If user is not logged in with cookie
  if (!req.cookies.user_id) {
    // Redirect user to login
    return res.redirect(`/login`);
  }
  // Find the urls_new template and send it to the browser
  res.render('urls_new', templateVars);
});

// Route for /urls/:id endpoint (note that :id is a route parameter)
app.get('/urls/:id', (req, res) => {
  // If user is not logged in with cookie
  if (!req.cookies.user_id) {
    // Advise user that they must be logged-in to view /urls/:id
    return res.status(401).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      Must be logged in to view this page.<br><br>
      Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
      ${htmlBodyEnd}`);
  }
  // If logged-in user does not own the URL 'id'
  if (!urlsForUser(req.cookies.user_id)[req.params.id]) {
    // Advise user they are not permitted to access it
    return res.status(403).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      You do not have permission to access this URL.<br><br>
      Please click <a href='/urls'>HERE</a> to access your owned URLs.
      ${htmlBodyEnd}`);
  }
  // Object to pass data for a single URL to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'user_id' cookie value
    // & pass the entire object to templates via templateVars
    user: users[req.cookies['user_id']],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  // Pass data for a single URL to the template
  res.render('urls_show', templateVars);
});

// Route for /u/:id endpoint (note that :id is a route parameter)
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

// Route for /urls endpoint
app.get('/urls', (req, res) => {
  // If user is not logged in with cookie
  if (!req.cookies.user_id) {
    // Advise user that they must be logged-in to view /urls
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
    // Lookup specific 'user' object in 'users' object using 'user_id' cookie value
    // & pass the entire object to templates via templateVars
    user: users[req.cookies['user_id']],
    // Lookup the URLs belonging to this user, and pass them to the templates
    urls: urlsForUser(req.cookies.user_id),
  };
  // Pass URL data to the template
  res.render('urls_index', templateVars);
});

// Route for /register endpoint for new user signup
app.get('/register', (req, res) => {
  // Object to pass data to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'user_id' cookie value
    // & pass the entire object to templates via templateVars
    user: users[req.cookies['user_id']]
  };
  // If user is already logged in with cookie
  if (req.cookies.user_id) {
    // Redirect them to /urls
    return res.redirect(`/urls`);
  }
  // Find the register.ejs template and send it to the browser
  res.render('register', templateVars);
});

// Route for /login endpoint for existing user signin
app.get('/login', (req, res) => {
  // Object to pass data to the template
  const templateVars = {
    // Lookup specific 'user' object in 'users' object using 'user_id' cookie value
    // & pass the entire object to templates via templateVars
    user: users[req.cookies['user_id']]
  };
  // If user is already logged in with cookie
  if (req.cookies.user_id) {
    // Redirect them to /urls
    return res.redirect(`/urls`);
  }
  // Find the login.ejs template and send it to the browser
  res.render('login', templateVars);
});

//===============
//  POST ROUTES
//===============

// Route for /urls endpoint to receive new URL form submission
app.post('/urls', (req, res) => {
  // If user is not logged in with cookie
  if (!req.cookies.user_id) {
    // Advise user that they must be logged-in to create new Short URL
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
    userID: req.cookies.user_id
  };
  // Redirect user to /urls/:id
  res.redirect(`/urls/${id}`);
});

// Route for /urls/:id/delete to handle short URL ID deletion
app.post(`/urls/:id/delete`, (req, res) => {
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
  // If logged-in user does not own the URL 'id'
  if (!urlsForUser(req.cookies.user_id)[id]) {
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
  res.redirect(`/urls`);
});

// Route for /urls/:id to handle editing of Short URL ID details
app.post(`/urls/:id`, (req, res) => {
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
  // If logged-in user does not own the URL 'id'
  if (!urlsForUser(req.cookies.user_id)[id]) {
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

// Route to handle user login
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
  const user = getUserByEmail(email);
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
  // Handle error if 'user' object exists BUT entered password does not match existing password value
  if (user && password !== user.password) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Login failed. Please doublecheck the credentials provided.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }
  // If 'user' exists AND entered password is a match
  // set cookie named 'user_id' to the value for the 'id' of the user
  res.cookie('user_id', user.id);
  // Redirect user to /urls
  res.redirect('/urls');
});

// Route to handle user logout
app.post('/logout', (req, res) => {
  // Clear the 'user_id' cookie
  res.clearCookie('user_id');
  // Redirect user to /urls
  res.redirect('/login');
});

// Route to handle new user registration
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
  if (getUserByEmail(email)) {
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
  // Add the new user object & data to the global 'users' object
  users[userID] = {
    id: userID,
    email,
    password
  };
  // Set cookie named 'user_id' to the value for the newly-generated User ID
  res.cookie('user_id', userID);
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