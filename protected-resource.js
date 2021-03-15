const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { timeout } = require('./utils');

const config = {
  port: 9002,
  publicKey: fs.readFileSync('assets/public_key.pem'),
};

const users = {
  user1: {
    username: 'user1',
    name: 'User 1',
    date_of_birth: '7th October 1990',
    weight: 57,
  },
  john: {
    username: 'john',
    name: 'John Appleseed',
    date_of_birth: '12th September 1998',
    weight: 87,
  },
};

const app = express();
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/
app.get('/user-info', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('no auth header');
  }
  const token = authHeader.slice('bearer '.length);
  // https://www.npmjs.com/package/jsonwebtoken
  jwt.verify(token, config.publicKey, { algorithms: ['RS256'] }, (err, payload) => {
    if (err) {
      return res.status(401).send(err);
    }
    if (!payload) {
      return res.status(401).send('invalid payload');
    }
    const client = users[payload.userName];
    if (!client) {
      return res.status(401).send('no such user');
    }
    const user = {};
    payload.scope.split(' ').forEach((ele) => {
      const permission = ele.slice('permission:'.length);
      console.log(permission);
      user[permission] = client[permission];
    });
    return res.json(user);
  });
});
const server = app.listen(config.port, 'localhost', () => {
  const host = server.address().address;
  const { port } = server.address();
});

// for testing purposes
module.exports = {
  app,
  server,
};
