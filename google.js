// Copyright 2012 Google LLC
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');

const {google} = require('googleapis');
const people = google.people('v1');
var mail;
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
          if (req.url.indexOf('/oauth-callback') > -1) {
            const qs = new url.URL(req.url, 'http://localhost:3000')
              .searchParams;
              console.log(req.url);
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
      .listen(3000, () => {
        // open the browser to the authorize url to start the workflow
        opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
      });
    destroyer(server);
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

authenticate(scopes)
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

  .catch(console.error)