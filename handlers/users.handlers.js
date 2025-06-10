const {
  insertUser,
  getUserById,
  updateUser,
  getUserByUsernameAndPassword,
  getUserByEmailndPassword,
} = require("../lib/database");

//to render login page
const renderLoginPage = (req, res) => {
  res.render("login", { navbar: "navbar", page_name: "login" });
};

//to logout
const logoutUser = (req, res) => {
  req.session.user = null;
  res.redirect("/users/login");
};

//to register as new user
const renderRegisterPage = (req, res) => {
  res.render("register", { navbar: "navbar", page_name: "login" });
};

//to create new user in database
const addUser = async (req, res) => {
  const { username, displayname, password, email } = req.body;

  const user = { username, displayname, password, email };

  console.log("password", user.password);

  try {
    await insertUser(user);
    req.session.user = { id: user._id, displayname: user.displayname };
    res.redirect(`/users/${user._id}/profile`); // Redirect back to profile page
  } catch (error) {
    res.render("register", {
      error: error,
      navbar: "navbar",
      page_name: "login",
    });
  }
};

//to sign in
const loginUser = async (req, res) => {
  const formData = req.body;
  const user = await getUserByEmailndPassword(
    formData.email,
    formData.password
  );
  if (user) {
    req.session.user = { id: user._id, displayname: user.displayname };
    res.redirect("/");
  } else {
    res.redirect("/users/login");
  }
};

//to see user's profile
const renderProfilePage = async (req, res) => {
  const userId = req.params.id;
  const user = await getUserById(userId);
  const currentUserId = req.session.user.id;
  const currentuser = await getUserById(currentUserId);

  const isOwnProfile =
    req.session.user && req.session.user.id.toString() === userId;

  res.render("profile", {
    navbar: "navbar",
    sidebar: "sidebar",
    currentuser,
    user,
    isOwnProfile,
    page_name: isOwnProfile ? "profile" : "",
  });
};

//to render update user profile page
const renderEditProfilePage = async (req, res) => {
  const user = await getUserById(req.session.user.id);
  res.render("editProfile", {
    navbar: "navbar",
    sidebar: "sidebar",
    user,
    page_name: "profile",
  });
};

//to update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { displayname, bio } = req.body;

    let profilePic = null;
    if (req.file) {
      profilePic = req.file.buffer.toString("base64"); // Convert image to Base64
    }

    await updateUser(userId, { displayname, bio, profilePic });

    res.redirect(`/users/${userId}/profile`); // Redirect back to profile page
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating profile.");
  }
};

module.exports = {
  renderLoginPage,
  loginUser,
  logoutUser,
  renderProfilePage,
  renderRegisterPage,
  addUser,
  updateUserProfile,
  renderEditProfilePage,
};
