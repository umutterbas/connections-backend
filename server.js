const express = require("express");
require('dotenv').config()
const { strict } = require("assert");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
var Twitter = require('twitter');
const app = express();
const port = 3000;
("use strict");

const http = require("http");
const url = require("url");
const open = require("open");

const { google } = require("googleapis");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CLIENT_REDIRECT_URI
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
  const mails = [];
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
      
      if(mes.data.labelIds[0] == 'SENT') {

        let sender = '';
        let target = '';
        let multiTargets = [];

        for (const element of headers) {

          if (element.name == "To") {
            target = element.value;
            
            const targetCount = target.split(",").length;
            if (targetCount == 1 && target.includes('<')) {
                target = target.split("<")[1].split(">")[0];
            }
            else if (targetCount > 1) {
              let targets = target.split(',');
              targets.forEach(t => {
                if (t.includes('<')) {
                  t = t.split("<")[1].split(">")[0];
                }
                multiTargets.push(t);
              });
            }
            
            //console.log('SENT TO: ', target)
          } //'Kutay Akbas <kutayakbas@sabanciuniv.edu>, "Bulent Baris Turel (Student)" <bturel@sabanciuniv.edu>'

          if (element.name == "From") {
            sender = element.value;
            if (sender.includes("<")) {
              sender = sender.split("<")[1].split(">")[0];
            }
            //console.log('SENT FROM: ', sender);
          }
        }
        if(multiTargets.length == 0) {
          let link = {
            "source": target,
            "target": sender,
            "weight": 2,
          };
          mails.push(link);
        }
        else {

          multiTargets.forEach(t => {
            let link = {
              "source": t,
              "target": sender,
              "weight": 2,
            };
            mails.push(link);
          });
        }
      }
      else {

        let sender = '';
        let target = '';
        let multiTargets = [];

        let delivered_to_count = 0;

        for (const element of headers) {

          if (element.name == "Delivered-To" && delivered_to_count===0) {delivered_to_count+=1;}
          
          else if (element.name == "Delivered-To" && delivered_to_count===1) {
            delivered_to_count+=1;
            target = element.value;
            console.log('REC TO: ', target);
          }

          else if (element.name == "From") {
            sender = element.value;
  
            if (sender.includes("<")) {
              sender = sender.split("<")[1].split(">")[0];
            }
            console.log('REC FROM: ', sender)
          }
          
          else if (element.name == "To" && !element.value.includes('undisclosed-recipients:;') && !element.value.includes('lists')) {
            
            target_s = element.value;
            
            const targetCount = target_s.split(",").length;
            if (targetCount > 1) {
              let targets = target_s.split(',');
              targets.forEach(t => {
                if (t.includes('<')) {
                  t = t.split("<")[1].split(">")[0];
                }
                multiTargets.push(t.replace(/\s/g, ''));
              });
            }
          }
        }
        if(multiTargets.length == 0) {
          let link = {
            "source": sender,
            "target": target,
            "weight": 2,
          };
          mails.push(link);
        }
        else {

          multiTargets.forEach(t => {
            let link = {
              "source": sender,
              "target": t,
              "weight": 2,
            };
            mails.push(link);
          });
        }
      }
    }
    return mails;
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

//GOOGLE Methods----------------

app.get("/getGoogleData", async function (req, res) {
  // grab the url that will be used for authorization
  console.log("get google data working");
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes.join(" "),
  });
  
  res.redirect(authorizeUrl);
});

app.post("/oauth-callback", async function (req, res) {
  const token = req.body.token;

  authenticate(scopes, token)
    .then((client) => {
      getMails(client).then((arr) => {
        
        let uniques = [];
        
        for (let i = 0; i < arr.length; i++) {
          
          if (uniques.length==0) {
            uniques.push(arr[i]);
          }
          else {
            
            let assigned = false;
            for (let j = 0; j < uniques.length; j++) {
              
              if ((uniques[j].source == arr[i].source && uniques[j].target == arr[i].target) ||
              (uniques[j].target == arr[i].source && uniques[j].source == arr[i].target)) {

                assigned = true;
                uniques[j].weight += 1;
              }
            }
            if (!assigned) {
              uniques.push(arr[i]);
            }
          }
        }

        console.log(uniques);
        res.send(uniques);
      });
    })
    .catch(console.error);
  //res.send("<script>window.close();</script>");
});

//-----------------------------

//TWITTER API------------------

let tokens = {};

const {
  getOAuthRequestToken,
  getOAuthAccessTokenWith,
  oauthGetUserById,
} = require("./oauth-utilities");

const path = require("path");
/*
const TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, "client", "template.html"),
  { encoding: "utf8" }
);
*/
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

  let client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: oauthAccessToken,
    access_token_secret: oauthAccessTokenSecret,
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

  let network = [];
  let ids = [];
  client.get('direct_messages/events/list.json',{count: 50}, function(error, tweets, response) {

    if (!error) {
      const obj = JSON.parse(response.body);
      console.log(obj);
      for (const element of obj.events) {
        if(element.message_create.sender_id !== userId) {
          ids.push(String(element.message_create.sender_id));
        }
        if(element.message_create.target.recipient_id !== userId) {
          ids.push(String(element.message_create.target.recipient_id));
        }
        console.log("Source: ",element.message_create.sender_id, "Target: ", element.message_create.target.recipient_id);
      }
    }
    console.log('IDS: ',ids);
    let counts = ids.reduce(
      (counts, val) => counts.set(val, 1 + (counts.get(val) || 0)),
      new Map()
    );

    console.log('COUNTS: ',counts);

    let ids_ = [];
    for (let [key, value] of counts) {
      ids_.push(String(key));
    }
    
    let names = new Map();
    
    //let screen_names = [];
    client.get('users/lookup.json', {user_id: ids_.toString()}, function(error, tweets, response) {
      if (!error) {
        
        const obj = JSON.parse(response.body);
        //console.log(obj)
        obj.forEach(element => {
          //screen_names.push(element.screen_name);
          names.set(element.id_str, element.screen_name);
          console.log(element.screen_name);
        });
      }
      let targetinho = user.screen_name;
      for (let [key, value] of counts) {
        let source = names.get(key);
        let weight = Number(value)*4;
        let link = {
          "source": source,
          "target": targetinho,
          "weight": weight
        };
  
        network.push(link);
      }
      console.log('NETWORK: ',network);
      //res.send(network);


      // add 1 more weight if the name of the user in the array is included in one of the tweets of umolibooo
      // 
      let mentions = [];

      client.get('search/tweets.json', {q: 'umoliboo',include_entities: true}, function(error, tweets, response) {
        if (!error) {
          const obj = JSON.parse(response.body);
          //console.log('STATUS: ',obj);
          for (s of obj.statuses){
            const a = s.entities.user_mentions;
            mentions.concat(a);
          }
          console.log("user mentions: ",mentions)
        } 
        let followers = [];
        client.get('followers/list.json',{count: 200}, function(error, tweets, response) {
          if (!error) {
            const obj = JSON.parse(response.body);
            //console.log(obj);
            //console.log(obj.users[0].name)

            for (let a of obj.users){
              followers.push(a.screen_name);
            }
            console.log(followers);
            
            for (let n of network){
              console.log(n.target);
              if ( followers.includes(n.target) || followers.includes(n.source)){
                n.weight += 2;
              };
            }
            
            for (let f of followers){
              if (!network.includes(f))
              {
                let link = {
                  "source": f,
                  "target": userId,
                  "weight": 2
                };
                network.push(link);
              };
            }
            console.log("new network: ",network);
            res.send(network);
          };
        });
      });
    });
  });
  //req.session.save(() => res.redirect("/"));
});
//-----------------------------
//-------------------------------------------------------------------------------------------------------------------------------------------------

