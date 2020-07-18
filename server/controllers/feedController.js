const { validationResult } = require("express-validator");
const fs = require("fs");

const Post = require("../models/postModel");
const User = require("../models/userModel");

exports.getPosts = async (request, response, next) => {
  const currentPage = request.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.populate("creator").find().countDocuments();
    const posts = Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    response.status(200).json({
      message: "Posts successfully fetched",
      posts: posts,
      totalItems,
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.createPost = async (request, response, next) => {
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
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: request.userId,
  });

  // Save post to db
  try {
    await post.save();
    const user = await User.findById(request.userId);
    user.posts.push(post);
    await user.save();

    response.status(201).json({
      message: "Post created successfully",
      post: post,
      creator: { _id: creator._id, name: creator.name },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;

    // Cannot throw error here because we are inside an async function
    // Call next() to go to the next express error handling middleware
    next(err);
  }
};

exports.getPost = async (request, response, next) => {
  const postId = request.params.postId;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    response.status(200).json({ message: "Post fetched", post });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.updatePost = async (request, response, next) => {
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

  try {
    const post = await Post.findById(postId);

    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    // Check to see if user is authorized to update the post
    if (post.creator.toString() === request.userId) {
      const error = new Error("Not suthorized");
      error.statusCode = 403;
      throw error;
    }

    // Checks if the existing image is the same as the incoming edited post image
    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    const result = await post.save();

    response.status(200).json({ message: "Post updated", post: result });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.deletePost = async (response, request, next) => {
  // console.log(request.params);
  const postId = request.params.postId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    // Check to see if user is authorized to update the post
    if (post.creator.toString() === request.userId) {
      const error = new Error("Not suthorized");
      error.statusCode = 403;
      throw error;
    }

    // Check if user is logged in
    clearImage(post.imageUrl);

    await Post.findByIdAndRemove(postId);
    const user = await User.findById(request.userId);
    await user.pull(postId);
    await user.save();

    response.status(200).json({ message: "Post deleted" });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);

  // Delete file by passing file path to it
  fs.unlink(filePath, (err) => console.log(err));
};
