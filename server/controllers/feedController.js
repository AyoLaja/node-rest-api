const { validationResult } = require("express-validator");
const fs = require("fs");

const Post = require("../models/postModel");

exports.getPosts = (request, response, next) => {
  const currentPage = request.query.page || 1;
  const perPage = 2;
  let totalItems;

  Post.find()
    .countDocuments()
    .then((count) => {
      totalItems = count;
      return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
    })
    .then((results) => {
      response.status(200).json({
        message: "Posts successfully fetched",
        posts: results,
        totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;

      next(err);
    });
};

exports.createPost = (request, response, next) => {
  const errors = validationResult(request);

  // Check if there are errors
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    throw error;
  }

  if (!request.file) {
    const error = new Error("No image provided");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = request.file.path;
  const title = request.body.title;
  const content = request.body.content;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: { name: "Ayomide" },
  });

  // Save post to db
  post
    .save()
    .then((result) => {
      // console.log(result);
      response.status(201).json({
        message: "Post created successfully",
        post: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      // Cannot throw error here because we are inside an async function
      // Call next() to go to the next express error handling middleware
      next(err);
    });
};

exports.getPost = (request, response, next) => {
  const postId = request.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      response.status(200).json({ message: "Post fetched", post });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;

      next(err);
    });
};

exports.updatePost = (request, response, next) => {
  const postId = request.params.postId;
  const errors = validationResult(request);

  // Check if there are errors
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");
    error.statusCode = 422;
    throw error;
  }

  const title = request.body.title;
  const content = request.body.content;
  let imageUrl = request.body.image;

  if (request.file) imageUrl = request.file;

  if (!imageUrl) {
    const error = new Error("No file chosen");
    error.statusCode = 422;
    throw error;
  }

  // Update in the db
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      response.status(200).json({ message: "Post updated", post: result });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.deletePost = (response, request, next) => {
  // console.log(request.params);
  const postId = request.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      // Check if user is logged in
      clearImage(post.imageUrl);

      return Post.findByIdAndRemove(postId);
    })
    .then((result) => {
      // console.log(result);
      response.status(200).json({ message: "Post deleted" });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);

  // Delete file by passing file path to it
  fs.unlink(filePath, (err) => console.log(err));
};
