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

module.exports = getUserByEmail;