const { assert } = require('chai');
const getUserByEmail = require('../helpers.js');

const testUsers = {
  "testUser1": {
    id: "testUser1",
    email: "user1@example.com",
    password: "blue-bunny-feathers"
  },
  "testUser2": {
    id: "testUser2",
    email: "user2@example.com",
    password: "mango-smoothie"
  }
};

describe('# getUserByEmail', () => {

  it('returns a user ID when provided with an email address that exists in the users database', () => {
    const user = getUserByEmail("user1@example.com", testUsers);
    const expectedUserID = "testUser1";
    assert.equal(user.id, expectedUserID);
  });

  it('returns `undefined` when provided with a non-existent email address', () => {
    const user = getUserByEmail("user3@example.com", testUsers);
    assert.equal(user, undefined);
  });

  it('returns a user object when provided with an email address that exists in the users database', () => {
    const userObject = getUserByEmail("user2@example.com", testUsers);
    const expectedUserObject = { id: "testUser2", email: "user2@example.com", password: "mango-smoothie" };
    assert.deepEqual(userObject, expectedUserObject);
  });

});