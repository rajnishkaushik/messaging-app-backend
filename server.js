const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 3000;

app.use(express.json());

// Create a new user
app.post('/users', (req, res) => {
  const { firstName } = req.body;
  if (!firstName) {
    console.log('POST /users - Missing firstName');
    return res.status(400).send('Missing firstName');
  }

  const user = {
    uuid: uuidv4(),
    firstName
  };

  const filepath = path.join(__dirname, 'users.json');
  fs.readFile(filepath, 'utf8', (err, data) => {
    const users = err ? [] : JSON.parse(data);
    users.push(user);
    fs.writeFile(filepath, JSON.stringify(users), () => {
      console.log(`User created: ${user.uuid}`);
      res.status(200).json(user);
    });
  });
});

// Retrieve all users
app.get('/users', (req, res) => {
  const filepath = path.join(__dirname, 'users.json');
  fs.readFile(filepath, 'utf8', (err, data) => {
    const users = err ? [] : JSON.parse(data);
    console.log(`Retrieved ${users.length} users`);
    res.json(users);
  });
});

// Delete a user by UUID
app.delete('/users', (req, res) => {
  const { uuid } = req.body;
  if (!uuid) {
    console.log('DELETE /users - Missing uuid');
    return res.status(400).send('Missing uuid');
  }

  const filepath = path.join(__dirname, 'users.json');
  fs.readFile(filepath, 'utf8', (err, data) => {
    let users = err ? [] : JSON.parse(data);
    const originalLength = users.length;
    users = users.filter(u => u.uuid !== uuid);
    fs.writeFile(filepath, JSON.stringify(users), () => {
      console.log(`Deleted user with UUID ${uuid} (before: ${originalLength}, after: ${users.length})`);
      res.status(200).send('User deleted');
    });
  });
});

// POST endpoint to save message
app.post('/messages', (req, res) => {
  const { uuid1, uuid2, senderUuid, text } = req.body;
  if (!uuid1 || !uuid2 || !senderUuid || !text) {
    console.log('POST /messages - Missing required fields');
    return res.status(400).send('Missing required fields');
  }

  const filename = `${uuid1}-${uuid2}.json`;
  const filepath = path.join(__dirname, filename);
  const message = {
    id: uuidv4(),
    senderUuid,
    text,
    timestamp: new Date().toISOString()
  };

  fs.readFile(filepath, 'utf8', (err, data) => {
    const messages = err ? [] : JSON.parse(data);
    messages.push(message);
    fs.writeFile(filepath, JSON.stringify(messages), () => {
      console.log(`Message saved to ${filename}`);
      res.status(200).send('Message saved');
    });
  });
});

// GET endpoint to retrieve messages
app.get('/messages', (req, res) => {
  const { uuid1, uuid2 } = req.query;
  if (!uuid1 || !uuid2) {
    console.log('GET /messages - Missing required query parameters');
    return res.status(400).send('Missing required query parameters');
  }

  const filename = `${uuid1}-${uuid2}.json`;
  const filepath = path.join(__dirname, filename);

  fs.readFile(filepath, 'utf8', (err, data) => {
    const messages = err ? [] : JSON.parse(data);
    console.log(`Retrieved ${messages.length} messages from ${filename}`);
    res.json(messages);
  });
});

// DELETE endpoint to remove message by ID
app.delete('/messages', (req, res) => {
  const { uuid1, uuid2, id } = req.body;
  if (!uuid1 || !uuid2 || !id) {
    console.log('DELETE /messages - Missing required fields');
    return res.status(400).send('Missing required fields');
  }

  const filename = `${uuid1}-${uuid2}.json`;
  const filepath = path.join(__dirname, filename);

  fs.readFile(filepath, 'utf8', (err, data) => {
    let messages = err ? [] : JSON.parse(data);
    const originalLength = messages.length;
    messages = messages.filter(m => m.id !== id);
    fs.writeFile(filepath, JSON.stringify(messages), () => {
      console.log(`Deleted message with ID ${id} from ${filename} (before: ${originalLength}, after: ${messages.length})`);
      res.status(200).send('Message deleted');
    });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));