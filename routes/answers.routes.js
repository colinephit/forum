const {
  addAnswer,
  updateAnswer,
  deleteAnAnswer,
  voteAnswer,
  renderAnswerPage,
  renderMyAnswersPage,
  renderEditAnswerPage,
} = require("../handlers/answers.handlers");

const express = require("express");
const requireAuth = require("../middlewares/requireAuth.js");
const router = express.Router();

//to vote answer
router.post("/vote/:id", requireAuth, voteAnswer);

//to post answer to database
router.post("/add/:id/", requireAuth, addAnswer);

//to edit answer
router.post("/:id/edit", requireAuth, updateAnswer);

//to delete answer
router.post("/:id/delete", requireAuth, deleteAnAnswer);

// to redirect to edit answer
router.get("/:id/edit", requireAuth, renderEditAnswerPage);

// to redirect to post an answer page
router.get("/add/:id", requireAuth, renderAnswerPage);

//view all user's answer
router.get("/user/:id", renderMyAnswersPage);

module.exports = router;
