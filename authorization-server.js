const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
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
    return res.status(401).send('invalid body');
  }
  if (!users[userName] && users[userName] !== password) {
    return res.status(401).send('invalid login details');
  }
  if (!requests[requestId]) {
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

app.post('/token', (req, res) => {
  console.log(req);
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    return res.status(401).send('no auth headers');
  }
  const { clientId, clientSecret } = decodeAuthCredentials(authHeader);

  if (!clientId || !clientSecret) {
    return res.status(401).send('invalid auth details');
  }
  if (!clients[clientId] || clients[clientId].clientSecret !== clientSecret) {
    return res.status(401).send('invalid auth details');
  }
  const { code } = req.body;
  if (!authorizationCodes[code]) {
    return res.status(401).send('invalid auth code');
  }
  const authcode = authorizationCodes[code];
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete
  delete authorizationCodes[code];
  // Synchronous Sign with RSA SHA256
  // sign with RSA SHA256
  // https://www.npmjs.com/package/jsonwebtoken
  const privateKeyPath = path.join(
    __dirname,
    'assets',
    'private_key.pem',
  );

  const privateKey = fs.readFileSync(privateKeyPath);
  const token = jwt.sign(
    {
      userName: authcode.userName,
      scope: authcode.clientReq.scope,
    },
    privateKey,
    { algorithm: 'RS256' },
  );
  return res.json({
    access_token: token,
    token_type: 'Bearer',
  });
});
const server = app.listen(config.port, 'localhost', () => {
  const host = server.address().address;
  const { port } = server.address();
});

// for testing purposes

module.exports = {
  app, requests, authorizationCodes, server,
};
