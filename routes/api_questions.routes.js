const express = require("express");
const router = express.Router();
const {
  getAQuestionJSON,
  deleteAQuestionJSON,
  addAQuestionJSON,
  voteQuestionJSON,
  getAllUsersQuestionsJSON,
  updateQuestionJSON,
  getFilteredQuestionsJSON,
  getUserFilteredQuestionJSON,
  getAllQuestionsJSON,
} = require("../handlers/api_questions.handlers");

const { requireAuthJWT } = require("../handlers/api_users.handlers");

//get all questions
router.get("/all", getAllQuestionsJSON);

//get filtered questions
router.get("/filter", getFilteredQuestionsJSON);

//to filter user's questions
router.get("/user/filter", requireAuthJWT, getUserFilteredQuestionJSON);

//to see specific question
router.get("/:id", getAQuestionJSON);

//to delete a question
router.delete("/:id", requireAuthJWT, deleteAQuestionJSON);

//to ask a question
router.post("/add", requireAuthJWT, addAQuestionJSON);

//to vote a question
router.put("/vote/:id", requireAuthJWT, voteQuestionJSON);

//to see all user's questions
router.get("/user/:id", requireAuthJWT, getAllUsersQuestionsJSON);

//to edit question
router.put("/:id", requireAuthJWT, updateQuestionJSON);

module.exports = router;
