const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");

const storage = multer.memoryStorage(); // Stores file in memory as buffer
const upload = multer({ storage: storage });

const {
  loginUserJSON,
  getAUserJSON,
  addUserJSON,
  updateUserProfileJSON,
} = require("../handlers/api_users.handlers");

//to sign in
router.post("/signin", loginUserJSON);

//to get user
router.get("/:id", getAUserJSON);

//to add user
router.post("/new", addUserJSON);

//to update user profile
router.put("/:id", upload.single("profilePic"), updateUserProfileJSON);

module.exports = router;
