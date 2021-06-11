# connections-backend



## Installation

● install NodeJS:

```bash
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

sudo apt install nodejs
```

● install connections-backend source code:

```bash
git clone https://github.com/umutterbas/connections-backend.git
```

● create .env file 

```bash
cd connections-backend

sudo nano .env
```

● copy the information below to .env file. Twitter
API keys and Google API keys are written into corresponding places (which are
_TO_BE_OBTAINED_)

```bash
FRONTEND_URL=http://localhost:3001

GOOGLE_CLIENT_ID=_TO_BE_OBTAINED_ 

GOOGLE_CLIENT_SECRET=_TO_BE_OBTAINED_ 

GOOGLE_CLIENT_REDIRECT_URI=http://localhost:3001/oauth-callback

TWITTER_CONSUMER_KEY=_TO_BE_OBTAINED_ 

TWITTER_CONSUMER_SECRET=_TO_BE_OBTAINED_ 

TWITTER_CALLBACK_URL=http://localhost:3001/twitter/callback
```

● install NodeJS dependencies and start the server:

```bash
npm install

node server
```

● install Network-Front-end source code:

```bash
git clone https://github.com/ozakbas/Network-Front-end.git
```

● install NodeJS dependencies and start the server:

```bash
npm install

npm start
```

● After making sure that the web application is accessible on http://127.0.0.1:3001, install nginx reverse proxy:

```bash
sudo apt install nginx
```

● open the default Nginx config file:
```bash
sudo nano /etc/nginx/sites-available/default
```

● The information inside the default nginx config file is replaced with the given settings below in order to proxy port 80 to 3001:

```bash
server {
   listen 80; 
   listen [::]:80;

   location / {
      proxy_pass http://127.0.0.1:3001/; 
   }
}
```

● A test is run on nginx config file to make sure that there is no problem with the syntax of the default config file:
```bash
sudo nginx -t
```

● Nginx is reloaded, enabled and started, status command is run in order to make sure that reverse proxy is active:
```bash
sudo systemctl reload nginx

sudo systemctl enable nginx

sudo systemctl start nginx

sudo systemctl status nginx
```

Check if “active” is present on the output of
the status command

● If “active” is not present on the output of the previous command, you should check if there exists another application which uses port 80 such as apache2, etc. and it should be stopped

● If “active” is present on the output of the previous command, make sure that our web application is accessible at http://127.0.0.1


● The rest boils down to setting port forwarding rules on router interface and giving permission to TCP port 80 from firewall settings:
```bash
sudo ufw allow 80/tcp

sudo ufw enable
```

● If everything is done correctly, public ip of the machine can be used to access the web application