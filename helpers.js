// Helper function to validate users
// Checks if email address exists in the 'database' object, taking in 'email and 'database' as parameters
const getUserByEmail = (email, database) => {
  // Loop through the database object
  for (const userKey in database) {
    const user = database[userKey];
    // If email address already exists in the database, return the entire 'user' object
    if (email === user.email) {
      return user;
    }
  }
  // If email not found in the database
  return null;
};

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

// Helper function to return the URLs belonging to the current user
// Takes in 'id' as a parameter and returns URLs where 'userID' is equal to the 'id' of the user currently logged in
const urlsForUser = (id, urlDatabase) => {
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

module.exports = { getUserByEmail, generateRandomString, urlsForUser };