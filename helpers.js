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



module.exports = { getUserByEmail, generateRandomString };