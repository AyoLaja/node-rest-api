const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const app = express();

const feedRoutes = require("./routes/feedRoutes");
const authRoutes = require("./routes/authRoutes");

// Configuring where files get stored on multer
const fileStorage = multer.diskStorage({
  destination: (request, file, callback) => {
    callback(null, "images");
  },
  filename: (request, file, callback) => {
    callback(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (request, file, callback) => {
  if (
    (file.mimeType =
      "image/png" ||
      file.mimeType === "image/jpg" ||
      file.mimeType === "image/jpeg")
  ) {
    callback(null, true);
  }
};

// app.use(cors());
// Parses incoming JSON data. Type: application/json
// app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Register multer
app.use(multer({ storage: fileStorage, fileFilter }).single("image"));
// Serving static images folder
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((request, response, next) => {
  // Set Access-Control-Allow-Origin to all the URLs permitted to access the server
  response.setHeader("Access-Control-Allow-Origin", "*");
  // Allow origins to use certain methods
  response.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  // Allow headers the client may set in it's request eg extra auth info
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  next();
});

app.use(function (req, res, next) {
  req.body = {};
  next();
});

// Forward incomng requests to feed routes
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

// Error handling middleware
// Will execute anytime an error is forwarded with next()
app.use((error, request, response, next) => {
  // console.log(error, request, response, next);
  const status = error.statusCode || 500;
  const message = error.message;
  const errorData = error.data;

  response.status(status).json({ message, data: errorData });
});

const mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

mongoose
  .connect(
    "mongodb+srv://ayo_laja:c0mpwuMDft5vOqkB@cluster0-wlgys.mongodb.net/messages?retryWrites=true&w=majority",
    mongooseConfig
  )
  .then(() => {
    app.listen(8080);
    console.log("listening at 8080");
  })
  .catch((err) => {
    console.log(err);
  });
