const express = require("express");
const AuthService = require("./auth-service");
const { requireAuth } = require("../middleware/jwt-auth");

const authRouter = express.Router();
const jsonBodyParser = express.json();

authRouter.post("/login", jsonBodyParser, (req, res, next) => {
  const { username, password } = req.body;
  const loginUser = { username, password };

  for (const [key, value] of Object.entries(loginUser))
    if (value == null)
      return res.status(400).json({
        error: `Missing '${key}' in request body`,
      });

  AuthService.getUserWithUserName(req.app.get("db"), req.body.username)
    .then((user) => {
      if (!user)
        return res.status(400).json({
          error: "Incorrect username or password",
        });

      return AuthService.comparePasswords(
        req.body.password,
        user.password
      ).then((hasMatch) => {
        if (!hasMatch) {
          return res.status(400).json({
            error: "Incorrect username or password",
          });
        }

        const sub = user.username;
        const payload = { user_id: user.id };
        res.send({
          authToken: AuthService.createJwt(sub, payload),
        });
      });
    })
    .catch(next);
});

authRouter.post("/refresh", requireAuth, (req, res) => {
  const sub = req.user.username;
  const payload = { user_id: req.user.id };
  res.send({
    authToken: AuthService.createJwt(sub, payload),
  });
});

module.exports = authRouter;
