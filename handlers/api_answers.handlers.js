const {
  getUserById,
  getQuestionById,
  toggleAnswerVote,
  insertAnswer,
  getAnswerById,
  editAnswer,
  deleteAnswer,
  getAllUserAnswers,
  getAnswersByQuestionId,
} = require("../lib/database");

const jwt = require("jsonwebtoken");

const JWT_SECRET = "GOOGOO";

//to vote answer
const voteAnswerJSON = async (req, res) => {
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

    const answerId = req.params.id;
    const { voteType } = req.body; // "upvote" or "downvote"

    const answer = await getAnswerById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    const hasVoted = await toggleAnswerVote(answerId, userId, voteType);

    if (hasVoted) {
      // Ensure votes array exists
      if (!Array.isArray(answer.votes)) {
        answer.votes = [];
      }

      // Add vote
      answer.votes.push({ userId, type: voteType });

      return res.status(200).json(answer);
    } else {
      return res.status(409).json({ message: "Failed to vote" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//to post answer to database
const addAnswerJSON = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  const userId = decoded.userId;
  const questionId = req.body.questionId;

  console.log(questionId);

  const answerData = {
    userId,
    questionId,
    body: req.body.body,
  };

  try {
    const answer = await insertAnswer(answerData);
    res.status(201).json(answer);
  } catch (error) {
    console.error("Error adding answer:", error);
    res.status(500).send("Failed to add answer");
  }
};

//get an answer
const getAnAnswerJSON = async (req, res) => {
  const answerId = req.params.id;
  const answer = await getAnswerById(answerId);
  if (answer) {
    res.json(answer);
  } else {
    res.status(404).json({ message: "Answer not found" });
  }
};

//to edit answer
const updateAnswerJSON = async (req, res) => {
  const answerId = req.params.id;
  const answerpoop = await getAnswerById(answerId);
  const questionId = answerpoop ? answerpoop.questionId : null;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  const userId = decoded.userId;
  const answer = {
    answerId,
    userId,
    body: req.body.body,
  };

  try {
    const updated = await editAnswer(answer);
    res.sendStatus(204);
  } catch (error) {
    res.status(404).json({ message: "Error editing answer" });
  }
};

//to delete answer
const deleteAnAnswerJSON = async (req, res) => {
  const answerId = req.params.id;
  const answerpoop = await getAnswerById(answerId);
  const questionId = answerpoop ? answerpoop.questionId : null;

  await deleteAnswer(answerId);
  res.sendStatus(204);
};

//to see all user's answers
const getAllUsersAnswersJSON = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  const userId = decoded.userId;
  const answers = await getAllUserAnswers(userId);
  res.status(201).json(answers);
};

const getAnswersByQuestionIdJSON = async (req, res) => {
  const questionId = req.params.id;
  const answers = await getAnswersByQuestionId(questionId);
  res.status(201).json(answers);
};

module.exports = {
  voteAnswerJSON,
  addAnswerJSON,
  getAnAnswerJSON,
  updateAnswerJSON,
  deleteAnAnswerJSON,
  getAllUsersAnswersJSON,
  getAnswersByQuestionIdJSON,
};
