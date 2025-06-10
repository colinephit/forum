const {
  renderAskQuestionPage,
  renderEditQuestionPage,
  addQuestion,
  getAllUsersQuestions,
  getAQuestion,
  voteQuestion,
  deleteAQuestion,
  updateQuestion,
  renderFilteredQuestionPage,
  renderUserFilteredQuestionPage,
} = require("../handlers/questions.handlers");

const express = require("express");
const requireAuth = require("../middlewares/requireAuth.js");
const router = express.Router();

// render page with filtered and sorted questions
router.get("/filter", renderFilteredQuestionPage);

//to redirect to ask a question page
router.get("/ask", requireAuth, renderAskQuestionPage);

//to see specific question
router.get("/:id", getAQuestion);

//to see all user's questions
router.get("/user/:id/", getAllUsersQuestions);

//to post question to database
router.post("/add", requireAuth, addQuestion);

//to vote question
router.post("/vote/:id", requireAuth, voteQuestion);

//to filter user's questions
router.get("/user/:id/filter", requireAuth, renderUserFilteredQuestionPage);

//to redirect to edit question
router.get("/:id/edit", renderEditQuestionPage);

//to edit question
router.post("/:id/edit", requireAuth, updateQuestion);

//to delete question
router.post("/:id/delete", requireAuth, deleteAQuestion);

module.exports = router;
