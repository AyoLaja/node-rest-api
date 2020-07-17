const express = require("express");
const router = express.Router();
// const cors = require("cors");
const { check } = require("express-validator");

const feedController = require("../controllers/feedController");
const isAuth = require("../middleware/is-auth");

// GET /feed/posts
router.get("/posts", isAuth, feedController.getPosts);

// POST /feed/post
router.post(
  "/post",
  [
    check("title").trim().isLength({
      min: 5,
    }),
    check("content").trim().isLength({
      min: 5,
    }),
  ],
  feedController.createPost
);

// GET /post/:postId
router.get("/post/:postId", feedController.getPost);

// PUT /post/:postId - TO update posts
router.put(
  "/post/:postId",
  [
    check("title").trim().isLength({
      min: 5,
    }),
    check("content").trim().isLength({
      min: 5,
    }),
  ],
  // cors(),
  feedController.updatePost
);

// DELETE /post/:postId
router.delete("/post/:postId", feedController.deletePost);

module.exports = router;
