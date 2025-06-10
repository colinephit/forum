const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");

const storage = multer.memoryStorage(); // Stores file in memory as buffer
const upload = multer({ storage: storage });

const {
  renderLoginPage,
  renderProfilePage,
  renderRegisterPage,
  addUser,
  loginUser,
  logoutUser,
  updateUserProfile,
  renderEditProfilePage,
} = require("../handlers/users.handlers");

//to render login page
router.get("/login", renderLoginPage);

//to logout
router.get("/logout", logoutUser);

//to register as new user
router.get("/register", renderRegisterPage);

//to create new user in database
router.post("/new", addUser);

//to sign in
router.post("/signin", loginUser);

//to see user's profile
router.get("/:id/profile", renderProfilePage);

//to render update user page
router.get("/editProfile", renderEditProfilePage);

//to update user profile
router.post("/:id/update", upload.single("profilePic"), updateUserProfile);

module.exports = router;
