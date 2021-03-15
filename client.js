const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios').default;
const { randomString, timeout } = require('./utils');

const config = {
  port: 9000,

  clientId: 'my-client',
  clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
  redirectUri: 'http://localhost:9000/callback',

  authorizationEndpoint: 'http://localhost:9001/authorize',
  tokenEndpoint: 'http://localhost:9001/token',
  userInfoEndpoint: 'http://localhost:9002/user-info',
};
let state = '';

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'assets/client');
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/
app.get('/authorize', (req, res) => {
  state = randomString();
  const redirectUrl = new URL(config.authorizationEndpoint);
  redirectUrl.searchParams.append('response_type', 'code');
  redirectUrl.searchParams.append('client_id', config.clientId);
  redirectUrl.searchParams.append('redirect_uri', config.redirectUri);
  redirectUrl.searchParams.append('scope', 'permission:name permission:date_of_birth');
  redirectUrl.searchParams.append('state', state);
  return res.redirect(redirectUrl.href);
});

app.get('/callback', (req, res) => {
  const newState = req.query.state;
  if (newState !== state) {
    return res.status(403).send('invalid state');
  }
  // Send a POST request
  axios({
    method: 'post',
    url: config.tokenEndpoint,
    auth: { username: config.clientId, password: config.clientSecret },
    data: { code: req.query.code },
  }).then((response) => {
    const token = response.data.access_token;
    return axios({
      method: 'get',
      url: config.userInfoEndpoint,
      headers: { authorization: `bearer ${token}` },
    });
  }).then((userInfo) => res.render('welcome', { user: userInfo.data }))
    .catch((err) => res.status(500).send(err));
});

app.get('/app');
const server = app.listen(config.port, 'localhost', () => {
  const host = server.address().address;
  const { port } = server.address();
});

// for testing purposes

module.exports = {
  app,
  server,
  getState() {
    return state;
  },
  setState(s) {
    state = s;
  },
};
