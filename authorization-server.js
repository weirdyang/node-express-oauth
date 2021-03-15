const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const {
  randomString,
  containsAll,
  decodeAuthCredentials,
  timeout,
} = require('./utils');

const config = {
  port: 9001,
  privateKey: fs.readFileSync('assets/private_key.pem'),

  clientId: 'my-client',
  clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
  redirectUri: 'http://localhost:9000/callback',

  authorizationEndpoint: 'http://localhost:9001/authorize',
};

const clients = {
  'my-client': {
    name: 'Sample Client',
    clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
    scopes: ['permission:name', 'permission:date_of_birth'],
  },
  'test-client': {
    name: 'Test Client',
    clientSecret: 'TestSecret',
    scopes: ['permission:name'],
  },
};

const users = {
  user1: 'password1',
  john: 'appleseed',
};

const requests = {};
const authorizationCodes = {};

const state = '';

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'assets/authorization-server');
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/
app.get('/authorize', (req, res) => {
  const clientId = req.query.client_id;
  if (!(clientId in clients)) {
    return res.status(401).send('no such client');
  }
  const { scope } = req.query;
  if (!scope || !containsAll(clients[clientId].scopes, scope.split(' '))) {
    return res.status(401).send('invalid scope');
  }
  const key = randomString();
  requests[key] = req.query;
  return res.render('login', {
    client: clients[clientId],
    scope,
    requestId: key,
  });
});

app.post('/approve', (req, res) => {
  const { userName, password, requestId } = req.body;
  if (!users[userName] || !password || !requestId) {
    console.log('1');
    return res.status(401).send('invalid body');
  }
  if (!users[userName] && users[userName] !== password) {
    console.log('2');
    return res.status(401).send('invalid login details');
  }
  if (!requests[requestId]) {
    console.log('3');
    return res.status(401).send('invalid request id');
  }
  const clientReq = requests[requestId];
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete
  delete requests[requestId];
  const key = randomString();
  authorizationCodes[key] = { clientReq, userName };
  // eslint-disable-next-line camelcase
  const { redirect_uri, state } = clientReq;
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', key);
  redirectUrl.searchParams.append('state', state);
  
  return res.redirect(redirectUrl.href);
});
const server = app.listen(config.port, 'localhost', () => {
  const host = server.address().address;
  const { port } = server.address();
});

// for testing purposes

module.exports = {
  app, requests, authorizationCodes, server,
};
