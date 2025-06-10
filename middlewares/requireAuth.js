function requireAuth(req, res, next) {
  if (!req.session.user) {
    if (req.headers["accept"] === "application/json") {
      return res.status(401).json({ redirect: "/users/login" }); // JSON redirect for fetch
    } else {
      return res.redirect("/users/login"); // Normal redirect for form
    }
  }
  next();
}

module.exports = requireAuth;
