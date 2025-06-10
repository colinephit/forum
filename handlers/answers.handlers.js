const {
  getUserById,
  getQuestionById,
  toggleAnswerVote,
  insertAnswer,
  getAnswerById,
  editAnswer,
  deleteAnswer,
  getAllUserAnswers,
} = require("../lib/database");

//to vote answer
const voteAnswer = async (req, res) => {
  const user = req.session.user;

  const userId = user.id;
  const answerId = req.params.id;
  const { voteType } = req.body; // "upvote" or "downvote"

  try {
    const questionId = await toggleAnswerVote(answerId, userId, voteType);
    res.redirect(`/questions/${questionId}`); // Redirect back to the question page
  } catch (error) {
    console.error("Error processing vote:", error);
    res.status(500).send("An error occurred while voting.");
  }
};

//to post answer to database
const addAnswer = async (req, res) => {
  const userId = req.session.user.id;
  const questionId = req.params.id;

  const answer = {
    userId,
    questionId,
    body: req.body.body,
  };

  try {
    await insertAnswer(answer);
    res.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.error("Error adding answer:", error);
    res.status(500).send("Failed to add answer");
  }
};

//to edit answer
const updateAnswer = async (req, res) => {
  const answerId = req.params.id;
  const answerpoop = await getAnswerById(answerId);
  const questionId = answerpoop ? answerpoop.questionId : null;

  const userId = req.session.user.id;
  const answer = {
    answerId,
    userId,
    body: req.body.body,
  };

  try {
    await editAnswer(answer);
    res.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.error("Error editing answer:", error);
  }
};

//to delete answer
const deleteAnAnswer = async (req, res) => {
  const answerId = req.params.id;
  const answerpoop = await getAnswerById(answerId);
  const questionId = answerpoop ? answerpoop.questionId : null;

  try {
    await deleteAnswer(answerId);
    res.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.error("Error deleting answer:", error);
  }
};

// to redirect to edit answer
const renderEditAnswerPage = async (req, res) => {
  const answerId = req.params.id;
  const answer = await getAnswerById(answerId);
  const user = await getUserById(req.session.user.id);
  res.render("answer", {
    user,
    ...answer,
    answerId,
    navbar: "navbar",
    sidebar: "sidebar",
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "myanswers",
  });
};

// to redirect to post an answer page
const renderAnswerPage = async (req, res) => {
  const questionId = req.params.id;
  const question = await getQuestionById(questionId);
  const user = await getUserById(req.session.user.id);
  res.render("answer", {
    question,
    questionId,
    user,
    navbar: "navbar",
    sidebar: "sidebar",
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "",
  });
};

//view all user's answer
const renderMyAnswersPage = async (req, res) => {
  // const userId = req.params.id;
  // const user = await getUserById(req.session.user.id);
  // const answers = await getAllUserAnswers(userId);
  res.render("myanswers", {
    // user,
    navbar: "navbar",
    sidebar: "sidebar",
    // answers,
    // currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "myanswers",
  });
};

module.exports = {
  addAnswer,
  updateAnswer,
  deleteAnAnswer,
  voteAnswer,
  renderAnswerPage,
  renderMyAnswersPage,
  renderEditAnswerPage,
};
