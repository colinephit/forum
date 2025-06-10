const {
  getUserById,
  getAllUserQuestions,
  insertQuestion,
  getQuestionById,
  getAnswersByQuestionId,
  toggleQuestionVote,
  editQuestion,
  deleteQuestion,
  getFilteredQuestions,
  getAllQuestions,
  getUserFilteredQuestions,
} = require("../lib/database");

const jwt = require("jsonwebtoken");

const JWT_SECRET = "GOOGOO";

//get a question
const getAQuestionJSON = async (req, res) => {
  const questionId = req.params.id;
  const question = await getQuestionById(questionId);
  if (question) {
    res.json(question);
  } else {
    res.status(404).json({ message: "Question not found" });
  }
};

//to delete question
const deleteAQuestionJSON = async (req, res) => {
  const questionId = req.params.id;

  if (!(await getQuestionById(questionId))) {
    res.status(404).json({ message: "Question not found" });
    return;
  }

  await deleteQuestion(questionId);
  res.sendStatus(204);
};

//to ask a question
const addAQuestionJSON = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  const userId = decoded.userId;

  const questionData = {
    userId,
    title: req.body.title,
    body: req.body.body,
    tags: req.body.tags,
  };

  const question = await insertQuestion(questionData);
  res.status(201).json(question);
};

//to vote question
const voteQuestionJSON = async (req, res) => {
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
    const questionId = req.params.id;
    const { voteType } = req.body;
    const question = await getQuestionById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const hasVoted = await toggleQuestionVote(questionId, userId, voteType);

    if (hasVoted) {
      // Ensure votes array exists
      if (!Array.isArray(question.votes)) {
        question.votes = [];
      }

      // Add vote
      question.votes.push({ userId, type: voteType });

      return res.status(200).json(question);
    } else {
      return res.status(409).json({ message: "Failed to vote" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

//to see all user's questions
const getAllUsersQuestionsJSON = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  const userId = decoded.userId;
  const questions = await getAllUserQuestions(userId);
  res.status(201).json(questions);
};

//to edit question
const updateQuestionJSON = async (req, res) => {
  const questionId = req.params.id;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  const userId = decoded.userId;
  const tags = req.body.tags
    ? req.body.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "")
    : [];
  const question = {
    questionId,
    userId,
    title: req.body.title,
    body: req.body.body,
    tags: tags,
  };

  try {
    const updated = await editQuestion(question);
    res.sendStatus(204);
  } catch (error) {
    res.status(404).json({ message: "Error editing question" });
  }
};

//get filtered questions
const getFilteredQuestionsJSON = async (req, res) => {
  const { sort, tag, query } = req.query; // Include `query` from request

  let filterCriteria = {};

  // If searching for a specific keyword in title or body
  if (query) {
    filterCriteria.$or = [
      { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
      { body: { $regex: query, $options: "i" } }, // Case-insensitive search in body
    ];
  }

  // If filtering by tags
  if (tag) {
    const tagArray = tag.split(",").map((t) => t.trim());
    filterCriteria.tags = tagArray; // Match any of the provided tags
  }

  // If filtering by unanswered questions
  if (sort === "unanswered") {
    filterCriteria.answerCount = { $eq: 0 };
  }

  // Sorting criteria
  let sortCriteria = {};
  if (sort === "recent") {
    sortCriteria = { created: -1 }; // Sort by most recent
  }

  // Fetch questions based on filter criteria
  const questions = await getFilteredQuestions(filterCriteria, sortCriteria);

  if (questions) {
    res.json(questions);
  } else {
    res.status(404).json({ message: "Questions not found" });
  }
};

const getUserFilteredQuestionJSON = async (req, res) => {
  const { sort, tag, query } = req.query; // Include `query` from request

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, JWT_SECRET);

  const userId = decoded.userId;

  let filterCriteria = {};

  // If searching for a specific keyword in title or body
  if (query) {
    filterCriteria.$or = [
      { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
      { body: { $regex: query, $options: "i" } }, // Case-insensitive search in body
    ];
  }

  // If filtering by tags
  if (tag) {
    const tagArray = tag.split(",").map((t) => t.trim());
    filterCriteria.tags = tagArray; // Match any of the provided tags
  }

  // If filtering by unanswered questions
  if (sort === "unanswered") {
    filterCriteria.answerCount = { $eq: 0 };
  }

  // Sorting criteria
  let sortCriteria = {};
  if (sort === "recent") {
    sortCriteria = { created: -1 }; // Sort by most recent
  }

  // Fetch questions based on filter criteria
  const questions = await getUserFilteredQuestions(
    userId,
    filterCriteria,
    sortCriteria
  );

  if (questions) {
    res.json(questions);
  } else {
    res.status(404).json({ message: "Questions not found" });
  }
};

const getAllQuestionsJSON = async (req, res) => {
  const questions = await getAllQuestions();
  res.status(201).json(questions);
};

module.exports = {
  getAQuestionJSON,
  deleteAQuestionJSON,
  addAQuestionJSON,
  voteQuestionJSON,
  getAllUsersQuestionsJSON,
  updateQuestionJSON,
  getFilteredQuestionsJSON,
  getUserFilteredQuestionJSON,
  getAllQuestionsJSON,
};
