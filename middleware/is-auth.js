const jwt = require("jsonwebtoken");

module.exports = (request, response, next) => {
  const authHeader = request.get("Authorization");
  if (!authHeader) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  const token = request.get("Authorization").split(" ")[1];
  let decondedToken;

  try {
    // jwt.verify will decode and verify the token
    // jwt.decode will only decode the token
    decondedToken = jwt.verify(token, "somesupersecretsecret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  if (!decondedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  request.userId = decondedToken.userId;
  next();
};
