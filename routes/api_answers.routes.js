const express = require("express");
const router = express.Router();
const { requireAuthJWT } = require("../handlers/api_users.handlers");

const {
  voteAnswerJSON,
  addAnswerJSON,
  getAnAnswerJSON,
  updateAnswerJSON,
  deleteAnAnswerJSON,
  getAllUsersAnswersJSON,
  getAnswersByQuestionIdJSON,
} = require("../handlers/api_answers.handlers");

//to vote answer
router.put("/vote/:id", requireAuthJWT, voteAnswerJSON);

//to add answer
router.post("/add", requireAuthJWT, addAnswerJSON);

//to get answer
router.get("/:id", getAnAnswerJSON);

//to get answer
router.get("/question/:id", getAnswersByQuestionIdJSON);

//to update answer
router.put("/:id", requireAuthJWT, updateAnswerJSON);

//to delete answer
router.delete("/:id", requireAuthJWT, deleteAnAnswerJSON);

//view all user's answer
router.get("/user/:id", requireAuthJWT, getAllUsersAnswersJSON);

module.exports = router;
