const express = require("express");
const { spawn } = require("child_process");
const { strict } = require("assert");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
app.set("view engine", "ejs");
("use strict");

const http = require("http");
const url = require("url");
const open = require("open");
const destroyer = require("server-destroy");

const { google } = require("googleapis");
const people = google.people("v1");

app.use(
  cors({
    origin: "http://localhost:3001",
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  "481059199386-dh933nt8rerrcus0f8jtrgvvp9s3ah4p.apps.googleusercontent.com",
  "we84FG2Qc0XHmD8uJ6AYr_fh",
  "http://localhost:3001/oauth-callback"
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  In this method, we're setting a global reference for all APIs.  Any other API you use here, like google.drive('v3'), will now use this auth client. You can also override the auth client at the service and method call levels.
 */
google.options({ auth: oauth2Client });

/**
 * Open an http server to accept the oauth callback. In this simple example, the only request to our webserver is to /callback?code=<code>
 */
async function authenticate(scopes, token) {
  const { tokens } = await oauth2Client.getToken(token);
  oauth2Client.credentials = tokens;
  // eslint-disable-line require-atomic-updates

  return new Promise((resolve, reject) => {
    resolve(oauth2Client);
  });
}

async function getMails(auth) {
  console.log("get mails working");
  const senders = [];
  const gmail = google.gmail({ version: "v1", auth });
  const res = await gmail.users.messages.list({
    userId: "me",
  });
  const messages = res.data.messages;
  if (messages.length) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      const mes = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });

      const headers = mes.data.payload.headers;

      for (const element of headers) {
        if (element.name == "From") {
          var sender = element.value;

          if (sender.includes("<")) {
            sender = sender.split("<")[1].split(">")[0];
          }
          senders.push(sender);
        }

        if (element.name == "To") {
          var target = element.value;
          if (target.includes("<")) {
            target = target.split("<")[1].split(">")[0];
          }
        }
      }
    }
    return { senders, target };
  } else {
    return;
  }
}

const scopes = [
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/user.emails.read",
  "https://www.googleapis.com/auth/gmail.readonly",
  "profile",
];

//-----------------------------

app.listen(port, () =>
  console.log(`Connections Backend listening on port 
${port}!`)
);

app.get("/", (req, res) => {
  res.render("login");
});

//GOOGLE Methods----------------

app.get("/getGoogleData", async function (req, res) {
  // grab the url that will be used for authorization
  console.log("get google data working");
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes.join(" "),
  });
  let cp = await open(authorizeUrl);
  //if (req.url.indexOf('/oauth-callback') > -1) {
  //Bu ifi awaitli yap

  res.render("login");
});

app.post("/oauth-callback", async function (req, res) {
  const token = req.body.token;

  let network = [];

  authenticate(scopes, token)
    .then((client) => {
      getMails(client).then((arr) => {
        let counts = arr.senders.reduce(
          (counts, val) => counts.set(val, 1 + (counts.get(val) || 0)),
          new Map()
        );
        var targetinho = arr.target;
        for (let [key, value] of counts) {
          var link = { Source: key, Target: targetinho, Weight: value };

          network.push(link);
          console.log(link);

          /*fs.appendFile('C:\\Users\\Kutay\\Desktop\\connections-backend\\json\\json.txt', a , function (err) {
          if (err) return console.log(err);
       });*/
        }
        console.log(network);
        res.send(network);
      });
    })
    .catch(console.error);
  //res.send("<script>window.close();</script>");
});

//-----------------------------
