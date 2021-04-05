const express = require('express')
const {spawn} = require('child_process');
const { strict } = require('assert');
const app = express()
const port = 4000
app.set('view engine', 'ejs')
const sleep = require('sleep')

//TWITTER API------------------

const session = require("express-session");
const cookieParser = require("cookie-parser");

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
  app.use(cookieParser());
  app.use(session({ secret: COOKIE_SECRET || "secret" }));

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
      console.log(`/twitter/${method}`);
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

      const authorizationUrl = `https://api.twitter.com/oauth/${method}?oauth_token=${oauthRequestToken}`;
      console.log("redirecting user to ", authorizationUrl);
      res.redirect(authorizationUrl);
    };
  }

  app.get("/twitter/callback", async (req, res) => {
    const { oauthRequestToken, oauthRequestTokenSecret } = req.session;
    const { oauth_verifier: oauthVerifier } = req.query;
    console.log("/twitter/callback", {
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
    res.cookie("twitter_screen_name", user.screen_name, {
      maxAge: 900000,
      httpOnly: true,
    });

    console.log("user succesfully logged in with twitter", user.screen_name);
    req.session.save(() => res.redirect("/"));
  });
}

//-----------------------------


//GMAIL API--------------------

'use strict';

const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');

const {google} = require('googleapis');
const people = google.people('v1');

/**
 * Create a new OAuth2 client with the configured keys.
 */
 const oauth2Client = new google.auth.OAuth2(
  "481059199386-dh933nt8rerrcus0f8jtrgvvp9s3ah4p.apps.googleusercontent.com",
  "we84FG2Qc0XHmD8uJ6AYr_fh",
  "http://localhost:5000/redirect"
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
 google.options({auth: oauth2Client});

 /**
  * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
  */
 async function authenticate(scopes) {
   return new Promise((resolve, reject) => {
     // grab the url that will be used for authorization
     const authorizeUrl = oauth2Client.generateAuthUrl({
       access_type: 'offline',
       scope: scopes.join(' '),
     });
     const server = http
       .createServer(async (req, res) => {
         try {
           if (req.url.indexOf('/redirect') > -1) {
             const qs = new url.URL(req.url, 'http://localhost:5000')
               .searchParams;
             res.end('Authentication successful! Please return to the console.');
             server.destroy();
             const {tokens} = await oauth2Client.getToken(qs.get('code'));
             oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates
             resolve(oauth2Client);
           }
         } catch (e) {
           reject(e);
         }
       })
       .listen(5000, () => {
         // open the browser to the authorize url to start the workflow
         opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
       });
     destroyer(server);
   });
 }
 
 async function runSample() {
   // retrieve user profile
   const res = await people.people.get({
     resourceName: 'people/me',
     personFields: 'emailAddresses',
   });
   console.log(res.data);
 }
 
 
 const scopes = [
 'https://www.googleapis.com/auth/contacts.readonly',
   'https://www.googleapis.com/auth/user.emails.read',
   'profile'
 ];

   app.get('/getGoogleData', (req, res) => {
    
    authenticate(scopes)
   .then(client => runSample(client))
   .catch(console.error);

   res.redirect("localhost:4000/")
   })    

//-----------------------------

app.listen(port, () => console.log(`Connections Backend listening on port 
${port}!`))

app.get('/', (req, res) => {
    res.render("login")
})

app.get("/login", (request, result) => {
    result.render("login")
})
