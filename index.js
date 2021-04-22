const express = require("express");
const session = require("express-session");
const cors = require("cors");

const {
  getOAuthRequestToken,
  getOAuthAccessTokenWith,
  oauthGetUserById,
} = require("./oauth-utilities");

const path = require("path");
const fs = require("fs");

const TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, "client", "template.html"),
  { encoding: "utf8" }
);

const COOKIE_SECRET =
  process.env.npm_config_cookie_secret || process.env.COOKIE_SECRET;

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

  app.use(
    session({
      secret: COOKIE_SECRET || "secret",
      cookie: {
        secure: true,
        sameSite: "none",
        maxAge: 60 * 24 * 1000,
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

      req.session = req.session || {};
      req.session.oauthRequestToken = oauthRequestToken;
      req.session.oauthRequestTokenSecret = oauthRequestTokenSecret;

      console.log(req.session);

      const authorizationUrl = `https://api.twitter.com/oauth/${method}?oauth_token=${oauthRequestToken}`;
      console.log("redirecting user to ", authorizationUrl);

      res.redirect(authorizationUrl);
    };
  }

  app.post("/callback", async (req, res) => {
    console.log("callback session: ", req.session);
    console.log("callback session token: ", req.session.oauthRequestToken);

    const { oauthRequestToken, oauthRequestTokenSecret } = req.session;
    const oauthVerifier = req.body.oauth_verifier;
    console.log("/callback", {
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier,
    });

    const {
      oauthAccessToken,
      oauthAccessTokenSecret,
      results,
    } = await getOAuthAccessTokenWith({
      oauthRequestToken,
      oauthRequestTokenSecret,
      oauthVerifier,
    });
    req.session.oauthAccessToken = oauthAccessToken;

    const { user_id: userId /*, screen_name */ } = results;
    const user = await oauthGetUserById(userId, {
      oauthAccessToken,
      oauthAccessTokenSecret,
    });

    req.session.twitter_screen_name = user.screen_name;
    console.log(results);

    res.cookie("twitter_screen_name", user.screen_name, {
      maxAge: 900000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    console.log("user succesfully logged in with twitter", user.screen_name);
    req.session.save();
    //req.session.save(() => res.redirect("/"));
  });
}
