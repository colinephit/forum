const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
let client = null;
let collectionUsers = null;
let collectionQuestions = null;
const uri =
  "mongodb+srv://colinephitoyo:MWNtHl8d2663jqOl@cluster0.bm1e2.mongodb.net/forum?retryWrites=true&w=majority&appName=Cluster0";

async function initDBIfNecessary() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db("forum");
    collectionUsers = db.collection("users");
    collectionQuestions = db.collection("questions");
    collectionAnswers = db.collection("answers");
    console.log("Connected to MongoDB Atlas");
  }
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
  }
}

async function insertUser(user) {
  await initDBIfNecessary();

  // Check if email already exists
  const existingUser = await collectionUsers.findOne({ email: user.email });
  if (existingUser) {
    console.log("Existing User Found:", existingUser); // Debugging line
    throw new Error("Account with this email already exists. Please login.");
  }

  // Check if username already exists
  const existingUsername = await collectionUsers.findOne({
    username: user.username,
  });
  if (existingUsername) {
    console.log("Existing Username Found:", existingUsername); // Debugging line
    throw new Error("Username already exists. Please choose another.");
  }

  // Hash password
  const saltRounds = 10;
  user.password = await bcrypt.hash(user.password, saltRounds);
  user.created = new Date();

  // Try inserting the user
  try {
    const result = await collectionUsers.insertOne(user);
    user._id = result.insertedId.toString();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Username or Email already exists.");
    }
    throw error;
  }
}

async function getAllUsers() {
  await initDBIfNecessary();
  return collectionUsers.find().toArray();
}

async function getUserById(userId) {
  await initDBIfNecessary();
  try {
    return collectionUsers.findOne({
      _id: ObjectId.createFromHexString(userId),
    });
  } catch (error) {
    return null;
  }
}

async function getUserByUsernameAndPassword(username, password) {
  await initDBIfNecessary();
  const user = await collectionUsers.findOne({ username: username });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return user;
    }
  }
  return null;
}

async function getUserByEmailndPassword(email, password) {
  await initDBIfNecessary();
  const user = await collectionUsers.findOne({ email: email });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return user;
    }
  }
  return null;
}

async function updateUser(userId, user) {
  await initDBIfNecessary();
  const { displayname, bio, profilePic } = user;

  const updateFields = { displayname, bio };
  if (profilePic) {
    updateFields.profilePicture = profilePic; // Only update if a new image is provided
  }

  await collectionUsers.updateOne(
    { _id: ObjectId.createFromHexString(userId) },
    { $set: updateFields }
  );
  return user;
}

async function getAllQuestions() {
  await initDBIfNecessary();
  const questions = await collectionQuestions
    .aggregate([
      {
        $lookup: {
          from: "users", // The users collection name
          localField: "userId", // Field in questions collection
          foreignField: "_id", // Field in users collection
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $addFields: {
          votes: { $ifNull: ["$votes", []] }, // Ensure votes is always an array
          upvotes: {
            $size: {
              $filter: {
                input: { $ifNull: ["$votes", []] }, // Ensure votes is an array
                as: "vote",
                cond: { $eq: ["$$vote.type", "upvote"] },
              },
            },
          },
          downvotes: {
            $size: {
              $filter: {
                input: { $ifNull: ["$votes", []] }, // Ensure votes is an array
                as: "vote",
                cond: { $eq: ["$$vote.type", "downvote"] },
              },
            },
          },
        },
      },
      {
        $project: {
          title: 1,
          body: 1,
          tags: 1,
          created: 1,
          upvotes: 1,
          downvotes: 1,
          votecount: { $subtract: ["$upvotes", "$downvotes"] }, // Upvotes - Downvotes
          "userDetails.displayname": 1,
          "userDetails.profilePicture": 1,
          "userDetails._id": 1,
          votes: 1,
        },
      },
    ])
    .toArray();

  questions.forEach((question) => {
    question.formattedCreated = new Date(question.created).toLocaleString(
      "en-GB",
      {
        weekday: "short", // Show short day name
        year: "numeric",
        month: "short", // Show short month name
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  });

  return questions; // Return the list of questions
}

async function getAllUserQuestions(userId) {
  await initDBIfNecessary();
  try {
    const questions = await collectionQuestions
      .aggregate([
        {
          $match: { userId: ObjectId.createFromHexString(userId) }, // Match questions by userId
        },
        {
          $lookup: {
            from: "users", // The users collection name
            localField: "userId", // Field in questions collection
            foreignField: "_id", // Field in users collection
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails", // Convert array to object
        },
        {
          $addFields: {
            upvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "upvote"] },
                },
              },
            },
            downvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "downvote"] },
                },
              },
            },
          },
        },
        {
          $project: {
            title: 1,
            body: 1,
            tags: 1,
            votes: 1,
            created: 1,
            upvotes: 1,
            downvotes: 1,
            votecount: { $subtract: ["$upvotes", "$downvotes"] }, // Upvotes - Downvotes
            "userDetails.displayname": 1,
            "userDetails.profilePicture": 1,
            "userDetails._id": 1,
          },
        },
      ])
      .toArray();

    questions.forEach((question) => {
      question.formattedCreated = new Date(question.created).toLocaleString(
        "en-GB",
        {
          weekday: "short", // Show short day name
          year: "numeric",
          month: "short", // Show short month name
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
    });
    return questions;
  } catch (error) {
    console.error("Error fetching user questions:", error);
    return [];
  }
}

async function insertQuestion(question) {
  await initDBIfNecessary();
  try {
    const newQuestion = {
      userId: new ObjectId(question.userId), // Convert userId to ObjectId
      title: question.title,
      body: question.body,
      tags: question.tags.split(",").map((tag) => tag.trim()), // Split and trim tags
      votes: [],
      created: new Date(),
    };

    const result = await collectionQuestions.insertOne(newQuestion);
    newQuestion._id = result.insertedId.toString();
    return newQuestion;
  } catch (error) {
    console.error("Error adding question:", error);
    throw error; // Re-throw to handle it in the route
  }
}

async function getQuestionById(questionId) {
  await initDBIfNecessary();
  try {
    const question = await collectionQuestions
      .aggregate([
        {
          $match: {
            _id: ObjectId.createFromHexString(questionId),
          },
        },
        {
          $lookup: {
            from: "users", // The users collection name
            localField: "userId", // Field in questions collection
            foreignField: "_id", // Field in users collection
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails", // Convert array to object
        },
        {
          $addFields: {
            upvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "upvote"] },
                },
              },
            },
            downvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "downvote"] },
                },
              },
            },
          },
        },
        {
          $project: {
            title: 1,
            body: 1,
            tags: 1,
            votes: 1,
            created: 1,
            upvotes: 1,
            downvotes: 1,
            "userDetails.displayname": 1,
            "userDetails.profilePicture": 1,
            "userDetails._id": 1,
            votecount: { $subtract: ["$upvotes", "$downvotes"] },
          },
        },
      ])
      .toArray();

    if (question.length === 0) {
      return null; // If no question is found, return null
    }

    const formattedCreated = new Date(question[0].created).toLocaleString(
      "en-GB",
      {
        weekday: "short", // Show short day name
        year: "numeric",
        month: "short", // Show short month name
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

    // Add the formatted 'created' timestamp to the question object
    question[0].formattedCreated = formattedCreated;

    return question[0]; // Return the single question
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  }
}

async function getAnswersByQuestionId(questionId) {
  await initDBIfNecessary();
  try {
    const answers = await collectionAnswers
      .aggregate([
        {
          $match: { questionId: ObjectId.createFromHexString(questionId) }, // Match answers by questionId
        },
        {
          $lookup: {
            from: "users", // The users collection name
            localField: "userId", // Field in questions collection
            foreignField: "_id", // Field in users collection
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails", // Convert array to object
        },
        {
          $addFields: {
            upvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "upvote"] },
                },
              },
            },
            downvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "downvote"] },
                },
              },
            },
          },
        },
        {
          $project: {
            title: 1,
            body: 1,
            tags: 1,
            votes: 1,
            created: 1,
            upvotes: 1,
            downvotes: 1,
            userId: 1,
            "userDetails.displayname": 1,
            "userDetails.profilePicture": 1,
            "userDetails._id": 1,
            votecount: { $subtract: ["$upvotes", "$downvotes"] },
          },
        },
      ])
      .toArray();

    answers.forEach((answer) => {
      answer.formattedCreated = new Date(answer.created).toLocaleString(
        "en-GB",
        {
          weekday: "short", // Show short day name
          year: "numeric",
          month: "short", // Show short month name
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
    });

    return answers; // Return array of answers
  } catch (error) {
    console.error("Error fetching answers:", error);
    return [];
  }
}

async function getAnswerById(answerId) {
  await initDBIfNecessary();
  try {
    const answer = await collectionAnswers
      .aggregate([
        {
          $match: {
            _id: ObjectId.createFromHexString(answerId),
          },
        },
        {
          $lookup: {
            from: "users", // The users collection name
            localField: "userId", // Field in questions collection
            foreignField: "_id", // Field in users collection
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails", // Convert array to object
        },
        {
          $addFields: {
            upvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "upvote"] },
                },
              },
            },
            downvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "downvote"] },
                },
              },
            },
          },
        },
        {
          $project: {
            body: 1,
            votes: 1,
            created: 1,
            upvotes: 1,
            downvotes: 1,
            questionId: 1,
            userId: 1,
            "userDetails.displayname": 1,
            "userDetails.profilePicture": 1,
            "userDetails._id": 1,
            votecount: { $subtract: ["$upvotes", "$downvotes"] },
          },
        },
      ])
      .toArray();

    if (answer.length === 0) {
      return null; // If no question is found, return null
    }

    const formattedCreated = new Date(answer[0].created).toLocaleString(
      "en-GB",
      {
        weekday: "short", // Show short day name
        year: "numeric",
        month: "short", // Show short month name
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

    // Add the formatted 'created' timestamp to the question object
    answer[0].formattedCreated = formattedCreated;

    return answer[0]; // Return the single question
  } catch (error) {
    console.error("Error fetching answer:", error);
    return null;
  }
}

async function toggleQuestionVote(questionId, userId, voteType) {
  await initDBIfNecessary();

  const objectIdQuestion = new ObjectId(questionId);
  const objectIdUser = new ObjectId(userId);

  const question = await collectionQuestions.findOne({
    _id: objectIdQuestion,
    "votes.userId": objectIdUser,
  });

  if (question) {
    const existingVote = question.votes.find((v) =>
      v.userId.equals(objectIdUser)
    );

    if (existingVote.type === voteType) {
      // Remove vote if user clicks the same vote type
      const result = await collectionQuestions.updateOne(
        { _id: objectIdQuestion },
        { $pull: { votes: { userId: objectIdUser } } }
      );
      return result.modifiedCount > 0;
    } else {
      // Change vote type if different
      const result = await collectionQuestions.updateOne(
        { _id: objectIdQuestion, "votes.userId": objectIdUser },
        { $set: { "votes.$.type": voteType } }
      );
      return result.modifiedCount > 0;
    }
  } else {
    // Add new vote if user hasn't voted
    const result = await collectionQuestions.updateOne(
      { _id: objectIdQuestion },
      { $push: { votes: { userId: objectIdUser, type: voteType } } }
    );
    return result.modifiedCount > 0;
  }
}

async function toggleAnswerVote(answerId, userId, voteType) {
  await initDBIfNecessary();

  const objectIdAnswer = new ObjectId(answerId);
  const objectIdUser = new ObjectId(userId);

  // Find the answer to get the associated questionId
  const answer = await collectionAnswers.findOne({ _id: objectIdAnswer });

  if (!answer) {
    throw new Error("Answer not found.");
  }

  const questionId = answer.questionId; // Store the related question ID

  const existingVote = answer.votes.find((v) => v.userId.equals(objectIdUser));

  if (existingVote) {
    if (existingVote.type === voteType) {
      // Remove vote if user clicks the same vote type
      await collectionAnswers.updateOne(
        { _id: objectIdAnswer },
        { $pull: { votes: { userId: objectIdUser } } }
      );
    } else {
      // Change vote type if different
      await collectionAnswers.updateOne(
        { _id: objectIdAnswer, "votes.userId": objectIdUser },
        { $set: { "votes.$.type": voteType } }
      );
    }
  } else {
    // Add new vote if user hasn't voted
    await collectionAnswers.updateOne(
      { _id: objectIdAnswer },
      { $push: { votes: { userId: objectIdUser, type: voteType } } }
    );
  }

  return questionId; // Return the related question ID for redirection
}

async function insertAnswer(answer) {
  await initDBIfNecessary();
  try {
    const newAnswer = {
      userId: new ObjectId(answer.userId),
      questionId: ObjectId.createFromHexString(answer.questionId),
      body: answer.body,
      votes: [],
      created: new Date(),
    };

    const result = await collectionAnswers.insertOne(newAnswer);
    newAnswer._id = result.insertedId.toString();
    return newAnswer;
  } catch (error) {
    console.error("Error adding answer:", error);
    throw error;
  }
}

async function editQuestion(question) {
  await initDBIfNecessary();
  const id = ObjectId.createFromHexString(question.questionId);
  const userId = ObjectId.createFromHexString(question.userId);
  const { title, body, tags } = question;

  try {
    await collectionQuestions.updateOne(
      { _id: id, userId },
      { $set: { title, body, tags } }
    );
    return question;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error;
  }
}

async function deleteQuestion(questionId) {
  await initDBIfNecessary();
  await collectionQuestions.deleteOne({
    _id: ObjectId.createFromHexString(questionId),
  });
}

async function editAnswer(answer) {
  await initDBIfNecessary();
  const id = ObjectId.createFromHexString(answer.answerId); // Convert to ObjectId
  const userId = ObjectId.createFromHexString(answer.userId);
  const body = answer.body;
  try {
    await collectionAnswers.updateOne({ _id: id, userId }, { $set: { body } });
    return answer;
  } catch (error) {
    console.error("Error updating question:", error);
    throw error; // Re-throw to handle it in the route
  }
}

async function deleteAnswer(answerId) {
  await initDBIfNecessary();
  await collectionAnswers.deleteOne({
    _id: ObjectId.createFromHexString(answerId),
  });
}

async function getAllUserAnswers(userId) {
  await initDBIfNecessary();
  try {
    const answers = await collectionAnswers
      .aggregate([
        {
          $match: { userId: ObjectId.createFromHexString(userId) }, // Match questions by userId
        },
        {
          $lookup: {
            from: "users", // The users collection name
            localField: "userId", // Field in questions collection
            foreignField: "_id", // Field in users collection
            as: "userDetails",
          },
        },
        {
          $unwind: "$userDetails", // Convert array to object
        },
        {
          $lookup: {
            from: "questions", // Lookup question details
            localField: "questionId",
            foreignField: "_id",
            as: "questionDetails",
          },
        },
        {
          $unwind: "$questionDetails", // Convert array to object
        },
        {
          $addFields: {
            upvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "upvote"] },
                },
              },
            },
            downvotes: {
              $size: {
                $filter: {
                  input: "$votes",
                  as: "vote",
                  cond: { $eq: ["$$vote.type", "downvote"] },
                },
              },
            },
          },
        },
        {
          $project: {
            body: 1,
            votes: 1,
            created: 1,
            upvotes: 1,
            downvotes: 1,
            votecount: { $subtract: ["$upvotes", "$downvotes"] }, // Upvotes - Downvotes
            "userDetails.displayname": 1,
            "userDetails.profilePicture": 1,
            "questionDetails.title": 1,
            "userDetails._id": 1,
            questionId: 1,
          },
        },
      ])
      .toArray();

    answers.forEach((answer) => {
      answer.formattedCreated = new Date(answer.created).toLocaleString(
        "en-GB",
        {
          weekday: "short", // Show short day name
          year: "numeric",
          month: "short", // Show short month name
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }
      );
    });

    return answers;
  } catch (error) {
    console.error("Error fetching user questions:", error);
    return [];
  }
}

async function getFilteredQuestions(filterCriteria, sortCriteria) {
  await initDBIfNecessary();

  // Ensure tags is always an array
  if (filterCriteria.tags && typeof filterCriteria.tags === "string") {
    filterCriteria.tags = [filterCriteria.tags]; // Convert single tag string to an array
  }

  // Build the aggregation pipeline
  const pipeline = [
    // Lookup to join with the users collection
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails", // Flatten the userDetails array
    },
    // Lookup to get the answers for each question and calculate the answer count
    {
      $lookup: {
        from: "answers",
        localField: "_id",
        foreignField: "questionId",
        as: "answers",
      },
    },
    {
      $addFields: {
        answerCount: { $size: "$answers" },
        votes: { $ifNull: ["$votes", []] },
        upvotes: {
          $size: {
            $filter: {
              input: { $ifNull: ["$votes", []] },
              as: "vote",
              cond: { $eq: ["$$vote.type", "upvote"] },
            },
          },
        },
        downvotes: {
          $size: {
            $filter: {
              input: { $ifNull: ["$votes", []] },
              as: "vote",
              cond: { $eq: ["$$vote.type", "downvote"] },
            },
          },
        },
      },
    },
    {
      $project: {
        title: 1,
        body: 1,
        tags: 1,
        created: 1,
        upvotes: 1,
        downvotes: 1,
        votecount: { $subtract: ["$upvotes", "$downvotes"] },
        answerCount: 1,
        "userDetails.displayname": 1,
        "userDetails.profilePicture": 1,
        "userDetails._id": 1,
        votes: 1,
      },
    },
  ];

  // Apply search filter if a query is provided
  if (filterCriteria.$or) {
    pipeline.push({
      $match: {
        $or: filterCriteria.$or, // Search by title or body
      },
    });
  }

  // Apply tag filtering if tags are provided
  if (filterCriteria.tags) {
    pipeline.push({
      $match: {
        tags: { $in: filterCriteria.tags },
      },
    });
  }

  // Apply unanswered questions filter
  if (filterCriteria.answerCount !== undefined) {
    pipeline.push({
      $match: {
        answerCount: filterCriteria.answerCount, // Only unanswered questions (answerCount = 0)
      },
    });
  }

  // Apply sorting criteria
  if (sortCriteria.created) {
    pipeline.push({
      $sort: {
        created: sortCriteria.created, // Sort by most recent
      },
    });
  }

  const questions = await collectionQuestions.aggregate(pipeline).toArray();

  // Format the 'created' timestamp for display
  questions.forEach((question) => {
    question.formattedCreated = new Date(question.created).toLocaleString(
      "en-GB",
      {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  });

  return questions;
}

async function getUserFilteredQuestions(id, filterCriteria, sortCriteria) {
  await initDBIfNecessary();

  // Ensure tags is always an array
  if (filterCriteria.tags && typeof filterCriteria.tags === "string") {
    filterCriteria.tags = [filterCriteria.tags]; // Convert single tag string to an array
  }

  // Build the aggregation pipeline
  const pipeline = [
    {
      $match: {
        userId: ObjectId.createFromHexString(id),
      },
    },
    // Lookup to join with the users collection
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails", // Flatten the userDetails array
    },
    // Lookup to get the answers for each question and calculate the answer count
    {
      $lookup: {
        from: "answers",
        localField: "_id",
        foreignField: "questionId",
        as: "answers",
      },
    },
    {
      $addFields: {
        answerCount: { $size: "$answers" },
        votes: { $ifNull: ["$votes", []] },
        upvotes: {
          $size: {
            $filter: {
              input: { $ifNull: ["$votes", []] },
              as: "vote",
              cond: { $eq: ["$$vote.type", "upvote"] },
            },
          },
        },
        downvotes: {
          $size: {
            $filter: {
              input: { $ifNull: ["$votes", []] },
              as: "vote",
              cond: { $eq: ["$$vote.type", "downvote"] },
            },
          },
        },
      },
    },
    {
      $project: {
        title: 1,
        body: 1,
        tags: 1,
        created: 1,
        upvotes: 1,
        downvotes: 1,
        votecount: { $subtract: ["$upvotes", "$downvotes"] },
        answerCount: 1,
        "userDetails.displayname": 1,
        "userDetails.profilePicture": 1,
        "userDetails._id": 1,
        votes: 1,
      },
    },
  ];

  // Apply search filter if a query is provided
  if (filterCriteria.$or) {
    pipeline.push({
      $match: {
        $or: filterCriteria.$or, // Search by title or body
      },
    });
  }

  // Apply tag filtering if tags are provided
  if (filterCriteria.tags) {
    pipeline.push({
      $match: {
        tags: { $in: filterCriteria.tags },
      },
    });
  }

  // Apply unanswered questions filter
  if (filterCriteria.answerCount !== undefined) {
    pipeline.push({
      $match: {
        answerCount: filterCriteria.answerCount, // Only unanswered questions (answerCount = 0)
      },
    });
  }

  // Apply sorting criteria
  if (sortCriteria.created) {
    pipeline.push({
      $sort: {
        created: sortCriteria.created, // Sort by most recent
      },
    });
  }

  const questions = await collectionQuestions.aggregate(pipeline).toArray();

  // Format the 'created' timestamp for display
  questions.forEach((question) => {
    question.formattedCreated = new Date(question.created).toLocaleString(
      "en-GB",
      {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  });

  return questions;
}

module.exports = {
  insertUser,
  updateUser,
  getAllUsers,
  getUserById,
  getUserByUsernameAndPassword,
  getUserByEmailndPassword,
  getAllQuestions,
  getAllUserQuestions,
  insertQuestion,
  getQuestionById,
  getAnswersByQuestionId,
  toggleQuestionVote,
  toggleAnswerVote,
  insertAnswer,
  editQuestion,
  deleteQuestion,
  getAnswerById,
  editAnswer,
  deleteAnswer,
  getAllUserAnswers,
  getFilteredQuestions,
  getUserFilteredQuestions,
};
