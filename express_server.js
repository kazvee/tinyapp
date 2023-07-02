//==============================
//        DEPENDENCIES
//==============================

const express = require('express');
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const app = express();
app.use(methodOverride('_method'));
const PORT = 8080;
const bcrypt = require('bcryptjs');

//===========================
//        FUNCTIONS
//===========================

const { getUserByEmail, generateRandomString, urlsForUser } = require('./helpers');

//=========================
//        OBJECTS
//=========================

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

// TEST DATA
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

// Styling for error message pages
const htmlBodyStart = '<html><body>';
const textStyle = `<p style='font-family: Verdana, sans-serif; font-size: 16px'>`;
const loginLink = `<a href='/login'>HERE</a>`;
const registerLink = `<a href='/register'>HERE</a>`;
const htmlBodyEnd = `</body></html>\n`;

//============================
//        MIDDLEWARE
//============================

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['gudetama'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//========================
//        ROUTES
//========================

//============================
//        GET ROUTES
//============================

//===================================
//        GET ROOT PATH '/'
//===================================

/**
 * Handle t the root route of the application.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
app.get('/', (req, res) => {

  if (!req.session.userId) {
    return res.redirect('/login');
  }

  return res.redirect('/urls');
});

//===============================
//        GET /URLS/NEW
//===============================

/**
 * Render the "Create New URL" page, allowing a user to create a new short URL.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @returns {void}
 */
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.session.userId]
  };

  if (!req.session.userId) {
    return res.redirect('/login');
  }

  res.render('urls_new', templateVars);
});

//===============================
//        GET /URLS/:ID
//===============================

/**
 * Handle GET request for a specific URL by ID.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/urls/:id', (req, res) => {

  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    The Short URL ID provided (${req.params.id}) does not exist.<br><br>
    Please try again.
    ${htmlBodyEnd}`);
  }

  if (!req.session.userId) {
    return res.status(401).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      Must be logged in to view this page.<br><br>
      Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
      ${htmlBodyEnd}`);
  }

  if (!urlsForUser(req.session.userId, urlDatabase)[req.params.id]) {
    return res.status(403).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      You do not have permission to access this URL.<br><br>
      Please click <a href='/urls'>HERE</a> to access your owned URLs.
      ${htmlBodyEnd}`);
  }

  const url = urlDatabase[req.params.id];
  const totalVisits = url.totalVisits;
  const uniqueVisits = url.uniqueVisits;
  const createdDate = url.createdDate;

  const templateVars = {
    user: users[req.session.userId],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    urls: urlsForUser(req.session.userId, urlDatabase),
    totalVisits,
    uniqueVisits,
    visitorID: req.session.visitorID,
    createdDate
  };

  res.render('urls_show', templateVars);
});

//============================
//        GET /U/:ID
//============================

/**
 * Handle GET request for redirecting to the long URL associated with a Short URL ID.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/u/:id', (req, res) => {

  if (!urlDatabase[req.params.id]) {
    return res.status(404).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    The Short URL ID provided (${req.params.id}) does not exist.<br><br>
    Please try again.
    ${htmlBodyEnd}`);
  }

  //-------------------------------
  //    TRACK VISITS TO /U/:IDs
  //-------------------------------

  const url = urlDatabase[req.params.id];
  const timestamp = new Date().toISOString();

  let totalVisits = req.session.views || 0;
  totalVisits += 1;
  req.session.views = totalVisits;

  const visitorID = req.session.visitorID || generateRandomString();
  if (!req.session.visitorID) {
    req.session.visitorID = visitorID;
  }

  let uniqueVisits = urlDatabase[req.params.id];
  if (!uniqueVisits) {
    uniqueVisits = 0;
  }

  if (!url.visits[visitorID]) {
    url.visits[visitorID] = { timestamp: timestamp.toLocaleLowerCase() };
    url.uniqueVisits += 1;
  }

  urlDatabase[req.params.id].totalVisits += 1;

  const longURL = urlDatabase[req.params.id].longURL;

  res.redirect(longURL);
});

//===========================
//        GET /URLS
//===========================

/**
 * Handle GET request to display the list of URLs for the logged-in user.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/urls', (req, res) => {

  if (!req.session.userId) {
    return res.status(401).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Must be logged in to view URLs.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }

  const templateVars = {
    user: users[req.session.userId],
    urls: urlsForUser(req.session.userId, urlDatabase),
  };

  res.render('urls_index', templateVars);
});

//===============================
//        GET /REGISTER
//===============================

/**
 * Handle GET request for user registration page.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.session.userId]
  };

  if (req.session.userId) {
    return res.redirect('/urls');
  }

  res.render('register', templateVars);
});

//============================
//        GET /LOGIN
//============================

/**
 * Handle GET request for user login page.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.session.userId]
  };

  if (req.session.userId) {
    return res.redirect('/urls');
  }

  res.render('login', templateVars);
});

//=============================
//        POST ROUTES
//=============================

//============================
//        POST /URLS
//============================

/**
 * Handle POST request for creating a new Short URL.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/urls', (req, res) => {

  if (!req.session.userId) {
    return res.status(401).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Must be logged in to create a new short URL.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }

  const longURL = req.body.longURL;
  const id = generateRandomString();

  urlDatabase[id] = {
    longURL,
    userID: req.session.userId,
    visits: {},
    totalVisits: 0,
    uniqueVisits: 0,
    createdDate: new Date().toISOString()
  };

  res.redirect(`/urls/${id}`);
});

//=============================
//        POST /LOGIN
//=============================

/**
 * Handle POST request for existing user sign-in.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Login failed. Please doublecheck the credentials provided.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    No account found with the email address provided.<br><br>
    Please click ${registerLink} to register! 🙂
    ${htmlBodyEnd}`);
  }

  if (user && !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Login failed. Please doublecheck the credentials provided.<br><br>
    Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
    ${htmlBodyEnd}`);
  }

  req.session.userId = user.id;

  res.redirect('/urls');
});

//==============================
//        POST /LOGOUT
//==============================

/**
 * Handle POST request for user sign-out.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

//================================
//        POST /REGISTER
//================================

/**
 * Handle POST request for new user sign-up.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    Please enter a valid email address and a secure password.<br><br>
    Click ${registerLink} to try again! 🙂
    ${htmlBodyEnd}`);
  }

  if (getUserByEmail(email, users)) {
    return res.status(400).send(`
    ${htmlBodyStart}
    ${textStyle}
    Response Status Code: ${res.statusCode}<br><br>
    An account already exists for the email address provided.<br><br>
    Please click ${loginLink} to login! 🙂
    ${htmlBodyEnd}`);
  }

  const userID = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[userID] = {
    id: userID,
    email,
    password: hashedPassword
  };

  req.session.userId = userID;

  res.redirect('/urls');
});

//============================
//        PUT ROUTES
//============================

//===============================
//        PUT /URLS/:ID
//===============================

/**
 * Handle PUT request for editing a Short URL by its ID.
 *
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 */
app.put('/urls/:id', (req, res) => {

  if (!req.session.userId) {
    return res.status(401).send(`
          ${htmlBodyStart}
          ${textStyle}
          Response Status Code: ${res.statusCode}<br><br>
          Must be logged in to edit a short URL.<br><br>
          Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
          ${htmlBodyEnd}`);
  }

  const id = req.params.id;

  if (!urlDatabase[id]) {
    return res.status(404).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      The Short URL ID provided (${req.params.id}) does not exist.<br><br>
      Please try again.
      ${htmlBodyEnd}`);
  }

  if (!urlsForUser(req.session.userId, urlDatabase)[id]) {
    return res.status(403).send(`
          ${htmlBodyStart}
          ${textStyle}
          Response Status Code: ${res.statusCode}<br><br>
          You do not have permission to edit this URL.<br><br>
          Please click <a href='/urls'>HERE</a> to access your owned URLs.
          ${htmlBodyEnd}`);
  }

  const longURL = req.body.newURL;
  urlDatabase[id].longURL = longURL;

  res.redirect('/urls');
});

//===============================
//        DELETE ROUTES
//===============================

//==================================
//        DELETE /URLS/:ID
//==================================

/**
 * Handle the deletion of a Short URL by its ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
app.delete('/urls/:id', (req, res) => {

  if (!req.session.userId) {
    return res.status(401).send(`
        ${htmlBodyStart}
        ${textStyle}
        Response Status Code: ${res.statusCode}<br><br>
        Must be logged in to delete a short URL.<br><br>
        Please click ${loginLink} to login, or ${registerLink} to register for a new account! 🙂
        ${htmlBodyEnd}`);
  }

  const id = req.params.id;

  if (!urlDatabase[id]) {
    return res.status(404).send(`
      ${htmlBodyStart}
      ${textStyle}
      Response Status Code: ${res.statusCode}<br><br>
      The Short URL ID provided (${req.params.id}) does not exist.<br><br>
      Please try again.
      ${htmlBodyEnd}`);
  }

  if (!urlsForUser(req.session.userId, urlDatabase)[id]) {
    return res.status(403).send(`
        ${htmlBodyStart}
        ${textStyle}
        Response Status Code: ${res.statusCode}<br><br>
        You do not have permission to delete this URL.<br><br>
        Please click <a href='/urls'>HERE</a> to access your owned URLs.
        ${htmlBodyEnd}`);
  }

  delete urlDatabase[id];

  res.redirect('/urls');
});

//===============================
//        END OF ROUTES
//===============================

app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT}! 😀`);
});