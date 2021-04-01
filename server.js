const express = require('express')
const {spawn} = require('child_process');
const { strict } = require('assert');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const app = express()
const port = 3000
app.set('view engine', 'ejs')
const sleep = require('sleep')

//GMAIL API--------------------
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const { SSL_OP_EPHEMERAL_RSA } = require('constants');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
//-----------------------------

app.listen(port, () => console.log(`Connections Backend listening on port 
${port}!`))

app.get('/', (req, res) => {
    res.render("login")
})

app.get("/login", (request, result) => {
    result.render("login")
})

app.post('/getTwitterData', (req,res) => {
    const twitterToken = "myToken124958243"
    //req.twitterToken
    console.log(twitterToken)

    var dataToSend = []
    // spawn new child process to call the python script
    const python = spawn('python3', ['script.py', twitterToken, 'param2'])
    // collect data from script
    python.stdout.on('data', function (data) {
      console.log('Pipe data from python script ...')
      dataToSend.push(data)
    });
    // in close event we are sure that stream from child process is closed
    python.on('close', (code) => {
    console.log(`child process close all stdio with code ${code}`);
    // send data to browser
    res.send(dataToSend.join(""))
    })
})

app.get('/getContactsData', (req,res) => {
  const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/contacts.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Tasks API.
  authorize(JSON.parse(content), listConnectionNames);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  

  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Print the display name if available for 10 connections.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listConnectionNames(auth) {
  const service = google.people({version: 'v1', auth});
  service.people.connections.list({
    resourceName: 'people/me',
    pageSize: 10,
    personFields: 'names,emailAddresses',
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const connections = res.data.connections;
    if (connections) {
      console.log('Connections:');
      connections.forEach((person) => {
        if (person.names && person.names.length > 0) {
          console.log(person.names[0].displayName);
        } else {
          console.log('No display name found for connection.');
        }
      });
    } else {
      console.log('No connections found.');
    }
  });
}
})

app.get('/g', (req,res) => {

  const {google} = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  "1059184212102-caqscan3rs980con1sgktip9fn4j3u0d.apps.googleusercontent.com",
  "AqR_VsRNyhRBveyf7lw_v_Kn",
  'http://localhost:3000/oauth-callback'
);

// generate a url that asks permissions for Blogger and Google Calendar scopes
const scopes = [
  'https://www.googleapis.com/auth/gmail',
  'https://www.googleapis.com/auth/contacts'
];

const url = oauth2Client.generateAuthUrl({
  // 'online' (default) or 'offline' (gets refresh_token)
  access_type: 'offline',

  // If you only need one scope you can pass it as a string
  scope: scopes
});

// This will provide an object with the access_token and refresh_token.
// Save these somewhere safe so they can be used at a later time.

async function main () {
  
  const {tokens} = await oauth2Client.getToken(code)
oauth2Client.setCredentials(tokens);
  // Fetch the list of GCE zones within a project.

}
main().catch(console.error);


})

app.get('/getGmailData', (req,res) => {
  
  // Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    "1059184212102-caqscan3rs980con1sgktip9fn4j3u0d.apps.googleusercontent.com",
    "AqR_VsRNyhRBveyf7lw_v_Kn",
    'http://localhost:3000/oauth-callback');

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  res.writeHead(302, {
    'Location': authUrl
    //add other headers here...
  });
  res.end();
  //console.log('Authorize this app by visiting this url:', authUrl);
  // request access token
  sleep.sleep(10)
  oAuth2Client.getToken(req.query.code, function (err, tokens) {
    // set tokens to the client
    // TODO: tokens should be set by OAuth2 client.
    oAuth2Client.setCredentials(tokens);
    console.log(tokens.access_token);
    console.log(tokens.refresh_token);
});

  

  // This will provide an object with the access_token and refresh_token.
// Save these somewhere safe so they can be used at a later time.
  
 
    
      //oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      /*
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
*/
      listLabels(oAuth2Client.auth);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}

})