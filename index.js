const { getAllQuestions, getUserById } = require("./lib/database");
const answerRoutes = require("./routes/answers.routes");
const userRoutes = require("./routes/users.routes");
const questionRoutes = require("./routes/questions.routes");
const express = require("express");
const session = require("express-session");
const { loginUserJSON } = require("./handlers/api_users.handlers");
const cors = require("cors");
const app = express();
const port = 3100;

const apiQuestionsRoutes = require("./routes/api_questions.routes");
const apiUsersRoutes = require("./routes/api_users.routes");
const apiAnswersRoutes = require("./routes/api_answers.routes");

app.use(express.urlencoded({ extended: true })); // This parses form data
app.use(express.json()); // This parses JSON data
app.use(cors());
app.options("*", cors()); // Add this line
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: "googaga",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

app.use("/api/questions", apiQuestionsRoutes);
app.use("/api/users", apiUsersRoutes);
app.use("/api/answers", apiAnswersRoutes);

app.use("/answers", answerRoutes);

app.use("/users", userRoutes);

app.use("/questions", questionRoutes);

app.post("/api/login", loginUserJSON);

app.get("/", async (req, res) => {
  const questions = await getAllQuestions();
  questions.sort((a, b) => new Date(b.created) - new Date(a.created));
  let user = null;

  if (req.session.user) {
    user = await getUserById(req.session.user.id);
  }

  res.render("main", {
    user,
    navbar: "navbar",
    sidebar: "sidebar",
    questions,
    currentUserId: req.session.user ? req.session.user.id : null,
    page_name: "home",
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
