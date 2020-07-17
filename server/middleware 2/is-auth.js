const jwt = require("jsonwebtoken");

module.exports = (request, response, next) => {
  const token = request.get("Authorization").split(" ")[1];
  let decodedToken;

  try {
    // jwt.verify will decode and verify the token
    // jwt.decode will only decode the token
    decodedToken = jwt.verify(token, "somesupersecretsecret");
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }

  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }

  request.userId = decodedToken.userId;
  next();
};
