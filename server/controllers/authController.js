const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

exports.signup = async (response, request, next) => {
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

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const result = await user.save();
    response
      .status(201)
      .json({ message: "User created successfully", userId: result._id });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.login = async (response, request, next) => {
  const email = request.body.email;
  const password = request.body.password;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    const equalPasswords = await bcrypt.compare(password, user.password);

    if (!equalPasswords) {
      const error = new Error("Wrong pasword");
      error.statusCode = 401;
      throw error;
    }

    // Generate new token
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "somesupersecretsecret",
      { expiresIn: "1h" }
    );

    response.status(200).json({
      token,
      userId: user._id.toString(),
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.getUserStatus = async (request, response, next) => {
  try {
    const user = await User.findById(request.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    response.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.updateUserStatus = async (request, response, next) => {
  const newStatus = request.body.status;

  try {
    const user = await User.findById(request.userId);

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    user.status = newStatus;
    await user.save();
    response.status(200).json({ message: "User updated succesfully" });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
