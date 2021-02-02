'use strict';

const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');

const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

app.use(bodyParser.json({ strict: false }));

app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.get('/users/:email', async function(req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      email: req.params.email
    }
  };
  console.log('Params ', params);
  try {
    const result = await dynamoDb.get(params).promise();
    console.log('Result ', result);
    if (result && result.Item) {
      const { email, username } = result.Item;
      res.json({ email, username });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.log('Error ', error);
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get user' });
    }
  }
});

app.post('/users', async function(req, res) {
  const { email, username } = req.body;
  if (typeof email !== 'string') {
    res.status(400).json({ error: '"email" must be a string' });
  } else if (typeof username !== 'string') {
    res.status(400).json({ error: '"username" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      email,
      username
    }
  };

  const { error } = await dynamoDb.put(params).promise();
  if (error) {
    console.log(error);
    res.status(400).json({ error: 'Could not create user' });
  }
  res.json({ email, username });
});

app.put('/users', async (req, res) => {
  const { email, username } = req.body;
  console.log('Email ', email);
  console.log('username ', username);
  const params = {
    TableName: USERS_TABLE,
    Key: { email },
    UpdateExpression: 'set username = :username',
    ExpressionAttributeValues: { ':username': username },
    ReturnValues: 'UPDATED_NEW'
  };
  console.log(params);
  try {
    const result = await dynamoDb.update(params).promise();
    console.log(result);
    res.json({ message: 'Successfully modified row', result });
  } catch (err) {
    console.error(err);
    res.json({ message: err });
  }
});

app.delete('/users/:emailId', async (req, res) => {
  const { emailId } = req.params;
  console.log('Email Id ', emailId);
  var params = {
    TableName: USERS_TABLE,
    Key: {
      email: emailId
    },
    ConditionExpression: 'email <= :email',
    ExpressionAttributeValues: {
      ':email': emailId
    }
  };

  try {
    const data = await dynamoDb.delete(params).promise();
    console.log('DeleteItem succeeded:', JSON.stringify(data, null, 2));
    res.json({ message: 'deleted successfully' });
  } catch (err) {
    console.error(
      'Unable to delete item. Error JSON:',
      JSON.stringify(err, null, 2)
    );
    res.json({ message: err });
  }
});

module.exports.handler = serverless(app);
