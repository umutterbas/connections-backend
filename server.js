const express = require('express')
const {spawn} = require('child_process');
const { strict } = require('assert');
const app = express()
const port = 3000
app.set('view engine', 'ejs')

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

app.post('/setGoogleToken', (req,res) => {
  const googleToken = req.googleToken

})