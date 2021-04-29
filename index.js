const express = require("express");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fs = require("fs");

let tokens = {};

const {
  getOAuthRequestToken,
  getOAuthAccessTokenWith,
  oauthGetUserById,
} = require("./oauth-utilities");

const path = require("path");

const TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, "client", "template.html"),
  { encoding: "utf8" }
);

main().catch((err) => console.error(err.message, err));

async function main() {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3001",
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use(
    session({
      secret: "secret",
      cookie: {
        sameSite: "none",
        maxAge: 1000 * 60 * 60,
      },
    })
  );

  app.listen(3000, () => console.log("listening on http://127.0.0.1:3000"));

  app.get("/", async (req, res, next) => {
    console.log("/ req.cookies", req.cookies);
    if (req.cookies && req.cookies.twitter_screen_name) {
      console.log("/ authorized", req.cookies.twitter_screen_name);
      return res.send(
        TEMPLATE.replace(
          "CONTENT",
          `
        <h1>Welcome ${req.cookies.twitter_screen_name}</h1>
        <h2>ENS 491<h2>
        <br>
        <a href="/twitter/logout">logout</a>
      `
        )
      );
    }
    return next();
  });

  app.use(express.static(path.resolve(__dirname, "client")));

  app.get("/twitter/logout", logout);

  function logout(req, res, next) {
    res.clearCookie("twitter_screen_name");
    req.session.destroy(() => res.redirect("/"));
  }

  app.get("/twitter/authenticate", twitter("authenticate"));
  app.get("/twitter/authorize", twitter("authorize"));

  function twitter(method = "authorize") {
    return async (req, res) => {
      const {
        oauthRequestToken,
        oauthRequestTokenSecret,
      } = await getOAuthRequestToken();
      console.log(`/twitter/${method} ->`, {
        oauthRequestToken,
        oauthRequestTokenSecret,
      });

      res.cookie("oauth_token", oauthRequestToken, {
        maxAge: 15 * 60 * 1000, // 15 minutes
        secure: true,
        httpOnly: true,
        sameSite: true,
      });

      tokens[oauthRequestToken] = { oauthRequestTokenSecret };

      const authorizationUrl = `https://api.twitter.com/oauth/${method}?oauth_token=${oauthRequestToken}`;
      console.log("redirecting user to ", authorizationUrl);

      res.redirect(authorizationUrl);
    };
  }

  app.post("/callback", async (req, res) => {
    const oauthRequestToken = req.body.oauth_token;
    const oauthVerifier = req.body.oauth_verifier;
    const oauth_token = req.cookies["oauth_token"];
    const oauthRequestTokenSecret = tokens[oauth_token].oauthRequestTokenSecret;

    console.log(
      req.body,
      oauthRequestToken,
      oauthVerifier,
      oauth_token,
      oauthRequestTokenSecret
    );

    if (oauth_token !== oauthRequestToken) {
      res.status(403).json({ message: "Request tokens do not match" });
      return;
    }

    const {
      oauthAccessToken,
      oauthAccessTokenSecret,
      results,
    } = await getOAuthAccessTokenWith({
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier,
    });

    const { user_id: userId /*, screen_name */ } = results;
    const user = await oauthGetUserById(userId, {
      oauthAccessToken,
      oauthAccessTokenSecret,
    });

    console.log(results);

    res.cookie("twitter_screen_name", user.screen_name, {
      maxAge: 900000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    console.log("user succesfully logged in with twitter", user.screen_name);
    req.session.save(() => res.redirect("/"));
  });
}
