const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const User = require("../models/userModel");
const authController = require("../controllers/authController");

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter valid email")
      .custom((value, { request }) => {
        //Should return true if validation succeeds
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exists");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 6 }),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

module.exports = router;
