const {
  insertUser,
  getUserById,
  updateUser,
  getUserByUsernameAndPassword,
  getUserByEmailndPassword,
} = require("../lib/database");

const jwt = require("jsonwebtoken");

const JWT_SECRET = "GOOGOO";

//to sign in
const loginUserJSON = async (req, res) => {
  const formData = req.body;
  const user = await getUserByEmailndPassword(
    formData.email,
    formData.password
  );
  if (user) {
    const userDetails = { userId: user._id.toString() };
    const accessToken = jwt.sign(userDetails, JWT_SECRET, { expiresIn: "12h" });
    res.json({ userDetails, accessToken });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

//to get user
const getAUserJSON = async (req, res) => {
  // const authHeader = req.headers.authorization;
  // if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //   return res
  //     .status(401)
  //     .json({ message: "Unauthorized. No token provided." });
  // }

  // const token = authHeader.split(" ")[1];
  // const decoded = jwt.verify(token, JWT_SECRET);

  const userId = req.params.id;
  const user = await getUserById(userId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

//to create new user in database
const addUserJSON = async (req, res) => {
  const { username, displayname, password, email } = req.body;

  try {
    const user = await insertUser({ username, displayname, password, email });

    const userDetails = { userId: user._id.toString() };

    const accessToken = jwt.sign(userDetails, JWT_SECRET, { expiresIn: "12h" });

    return res.status(201).json({ userDetails, accessToken });
  } catch (error) {
    console.error("Registration Error:", error.message); // Log error for debugging
    return res.status(400).json({ message: error.message });
  }
};

//to update user profile
const updateUserProfileJSON = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.userId;
    const { displayname, bio } = req.body;

    let profilePic = null;
    if (req.file) {
      profilePic = req.file.buffer.toString("base64"); // Convert image to Base64
    }

    await updateUser(userId, { displayname, bio, profilePic });

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile." });
  }
};

function requireAuthJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
        next();
      } else {
        res.sendStatus(401);
        return;
      }
    });
  } else {
    res.sendStatus(401);
  }
}

module.exports = {
  loginUserJSON,
  getAUserJSON,
  addUserJSON,
  updateUserProfileJSON,
  requireAuthJWT,
};
