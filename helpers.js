//=================================
//        USER VALIDATION
//=================================

/**
 * Retrieve a user object from the given 'database' based on the provided email address.
 *
 * @param {string} email - The email address to search for in the database.
 * @param {Object} database - The database object containing user information (including email address).
 * @returns {Object|null} The user object if found, or null if the email address is not in the database.
 */
const getUserByEmail = (email, database) => {

  for (const userKey in database) {
    const user = database[userKey];

    if (email === user.email) {
      return user;
    }
  }

  return null;
};

//===========================================
//        GENERATE NEW SHORT URL ID
//===========================================

/**
 * Generate a random string of alphanumeric characters.
 *
 * @returns {string} A string of 6 random alphanumeric characters (a-z, A-Z, and 0-9).
 */
const generateRandomString = () => {
  let result = '';
  let characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let length = characters.length;

  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * length));
  }

  return result;
};

//================================
//        SHOW USER URLs
//================================

/**
 * Retrieve URLs belonging to the user with the provided ID from the given URL database.
 *
 * @param {string} id - The ID of the user whose URLs are to be retrieved.
 * @param {Object} urlDatabase - The database of URLs with associated user IDs.
 * @returns {Object} An object containing URLs associated with the provided user ID.
 */
const urlsForUser = (id, urlDatabase) => {
  const currentUserURLs = {};
  for (const shortUrlID in urlDatabase) {
    if (urlDatabase[shortUrlID].userID === id) {
      currentUserURLs[shortUrlID] = urlDatabase[shortUrlID];
    }
  }
  return currentUserURLs;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser };