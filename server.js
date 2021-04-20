const express = require('express')
const {spawn} = require('child_process');
const { strict } = require('assert');
const app = express()
const port = 3000
app.set('view engine', 'ejs')
const sleep = require('sleep')

//TWITTER API------------------
/*
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

    const { user_id: userId /*, screen_name */ /*} = results;
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
*/
//-----------------------------


//GOOGLE API--------------------

'use strict';

const http = require('http');
const url = require('url');
const open = require('open');
const destroyer = require('server-destroy');

const {google} = require('googleapis');
const people = google.people('v1');

/**
 * To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */
/*
const keyPath = path.join(__dirname, 'oauth2.keys.json');
let keys = {redirect_uris: ['']};
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}
*/

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
    "1059184212102-caqscan3rs980con1sgktip9fn4j3u0d.apps.googleusercontent.com",
    "AqR_VsRNyhRBveyf7lw_v_Kn",
    'http://localhost:3000/oauth-callback'
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({auth: oauth2Client});

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate(scopes, reqUrl) {

  const qs = new url.URL(reqUrl, 'http://localhost:3000').searchParams;
  const {tokens} = await oauth2Client.getToken(qs.get('code'));
  oauth2Client.credentials = tokens; // eslint-disable-line require-atomic-updates

  return new Promise((resolve, reject) => {
    resolve(oauth2Client);
  });
}

async function getMails(auth) {
  const senders = []
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.messages.list({
    userId: 'me',
  });
  const messages = res.data.messages;
  if (messages.length) {

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      const mes = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });
        
      const headers = mes.data.payload.headers;


      for (const element of headers) {
        if (element.name=='From') {
          var sender = element.value;
          
          if(sender.includes("<")){
            sender = sender.split("<")[1].split(">")[0];
          }
          senders.push(sender);
        }

        if (element.name=='To') {
          var target = element.value;
          if(target.includes("<")){
            target = target.split("<")[1].split(">")[0];
          }
        };
      }
    }
    return {senders,target}; 
  }
  else {
    return;
  }
}

const scopes = [
'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/user.emails.read',
  'https://www.googleapis.com/auth/gmail.readonly',
  'profile'
];   

//-----------------------------

app.listen(port, () => console.log(`Connections Backend listening on port 
${port}!`))

app.get('/', (req, res) => {
    res.render("login")
})

//GOOGLE Methods----------------

app.get('/getGoogleData', async function (req, res) {
  
  // grab the url that will be used for authorization
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes.join(' '),
  });
  let cp = await open(authorizeUrl);
  //if (req.url.indexOf('/oauth-callback') > -1) {
    //Bu ifi awaitli yap
    res.render('login');
})    

app.get('/oauth-callback*', async function (req, res) {
  
  authenticate(scopes, req.url)
  .then(client => {
    getMails(client).then(arr => {
      let counts = arr.senders.reduce((counts, val) => counts.set(val, 1 + (counts.get(val) || 0)), new Map());
      var targetinho = arr.target;
      for(let [key, value] of counts){
        var a = "{\"Source\": " + key  + " , \"Weight\": " +  value +  "}";
        console.log("{\"Source\": ", key , " , Target: ", targetinho, " ,",  "Weight\": ", value, "}");
        
        /*fs.appendFile('C:\\Users\\Kutay\\Desktop\\connections-backend\\json\\json.txt', a , function (err) {
          if (err) return console.log(err);
       });*/
      }
    })})
  .catch(console.error);
  //res.send("<script>window.close();</script>");
  res.render('close');
})

//-----------------------------