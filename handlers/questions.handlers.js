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
  getUserFilteredQuestions,
} = require("../lib/database");

//to render ask a question page
const renderAskQuestionPage = async (req, res) => {
  const user = await getUserById(req.session.user.id);
  res.render("ask", {
    user,
    navbar: "navbar",
    sidebar: "sidebar",
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "",
  });
};

//to post question to database
const addQuestion = async (req, res) => {
  const userId = req.session.user.id;

  const question = {
    userId,
    title: req.body.title,
    body: req.body.body,
    tags: req.body.tags,
  };

  try {
    await insertQuestion(question);
    res.redirect("/");
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).send("Failed to add question");
  }
};

//to vote question
const voteQuestion = async (req, res) => {
  const user = req.session.user;
  const userId = user.id;
  const questionId = req.params.id;
  const { voteType } = req.body; // "upvote" or "downvote"

  try {
    await toggleQuestionVote(questionId, userId, voteType);
    res.redirect(`/questions/${questionId}`); // Redirect back to the question page
  } catch (error) {
    console.error("Error processing vote:", error);
    res.status(500).send("An error occurred while voting.");
  }
};

//to see specific question
const getAQuestion = async (req, res) => {
  const questionId = req.params.id;
  const question = await getQuestionById(questionId);
  const answers = await getAnswersByQuestionId(questionId);
  const currentUserId = req.session.user ? req.session.user.id : null;

  let user = null;
  if (req.session.user) {
    user = await getUserById(req.session.user.id);
  }
  const myAnswers = currentUserId
    ? answers.filter(
        (answer) => answer.userId && answer.userId.toString() === currentUserId
      )
    : [];

  const otherAnswers = answers.filter(
    (answer) =>
      !answer.userId ||
      !currentUserId ||
      answer.userId.toString() !== currentUserId
  );
  res.render("question", {
    user,
    navbar: "navbar",
    sidebar: "sidebar",
    question,
    currentUserId,
    answers: otherAnswers,
    myAnswers,
    page_name: "",
  });
};

//to see all user's questions
const getAllUsersQuestions = async (req, res) => {
  const userId = req.params.id;
  // const user = await getUserById(req.session.user.id);
  // const questions = await getAllUserQuestions(userId);
  res.render("myquestions", {
    // user,
    navbar: "navbar",
    sidebar: "sidebar",
    // questions,
    // currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "myquestions",
  });
};

//to redirect to edit question
const renderEditQuestionPage = async (req, res) => {
  const questionId = req.params.id;
  const question = await getQuestionById(questionId);
  const user = await getUserById(req.session.user.id);
  res.render("ask", {
    navbar: "navbar",
    sidebar: "sidebar",
    ...question,
    questionId,
    user,
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "myquestions",
  });
};

//to edit question
const updateQuestion = async (req, res) => {
  const questionId = req.params.id;
  const userId = req.session.user.id;
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
    await editQuestion(question);
    res.redirect(`/questions/${questionId}`);
  } catch (error) {
    console.error("Error editing question:", error);
  }
};

//to delete question
const deleteAQuestion = async (req, res) => {
  const questionId = req.params.id;
  const userId = req.session.user.id;

  try {
    await deleteQuestion(questionId);
    res.redirect(`/questions/user/${userId}`);
  } catch (error) {
    console.error("Error deleting question:", error);
  }
};

const renderFilteredQuestionPage = async (req, res) => {
  const { sort, tag, query } = req.query; // Include `query` from request

  let user = null;

  if (req.session.user) {
    user = await getUserById(req.session.user.id);
  }

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

  res.render("main", {
    user,
    navbar: "navbar",
    sidebar: "sidebar",
    questions,
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "home",
    query,
    tag,
    sort,
  });
};

const renderUserFilteredQuestionPage = async (req, res) => {
  const { sort, tag, query } = req.query; // Include `query` from request

  let user = null;

  if (req.session.user) {
    user = await getUserById(req.session.user.id);
  }

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
    user._id,
    filterCriteria,
    sortCriteria
  );

  res.render("myquestions", {
    user,
    navbar: "navbar",
    sidebar: "sidebar",
    questions,
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "myquestions",
    query,
    tag,
    sort,
  });
};

module.exports = {
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
};
