const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

exports.signup = (response, request, next) => {
  console.log("sign up started");
  const errors = validationResult(request);
  console.log(errors.isEmpty());

  // console.log(request.body);
  if (!errors.isEmpty()) {
    const error = new Error("Validation error");
    error.statusCode = 422;

    // Keep errors retirved by validation package
    error.data = errors.array();
    throw error;
  }

  // console.log(request);
  if (request.body) {
    console.log(request.body);
  }
  const email = request.body.email;
  const name = request.body.name;
  const password = request.body.password;
  console.log(name, email, password);
  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
      });

      return user.save();
    })
    .then((result) => {
      response
        .status(201)
        .json({ message: "User created successfully", userId: result._id });
    })
    .catch((err) => {
      console.log(err);
      if (!err.statusCode) err.statusCode = 500;

      next(err);
    });
};

exports.login = (response, request, next) => {
  const email = request.body.email;
  const password = request.body.password;
  let loadedUser;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 401;
        throw error;
      }

      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Wrong pasword");
        error.statusCode = 401;
        throw error;
      }

      // Generate new token
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "somesupersecretsecret",
        { expiresIn: "1h" }
      );

      response.status(200).josn({
        token,
        userId: loadedUser._id.toString(),
      });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;

      next(err);
    });
};
// "mongodb+srv://ayo_laja:c0mpwuMDft5vOqkB@cluster0-wlgys.mongodb.net/messages?retryWrites=true&w=majority"
