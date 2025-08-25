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

// Create an empty group
app.post('/groups', (req, res) => {
  const { name } = req.body;
  if (!name) {
    console.log('POST /groups - Missing name');
    return res.status(400).send('Missing name');
  }

  const group = {
    uuid: uuidv4(),
    name,
    userUuids: [],
    createdAt: new Date().toISOString()
  };

  const filepath = path.join(__dirname, `group-${group.uuid}.json`);
  fs.writeFile(filepath, JSON.stringify(group), () => {
    console.log(`Group created: ${group.uuid}`);
    res.status(200).json(group);
  });
});

// Add one user to a group
app.post('/groups/add-user', (req, res) => {
  const { uuid, userUuid } = req.body;
  if (!uuid || !userUuid) {
    console.log('POST /groups/add-user - Missing uuid or userUuid');
    return res.status(400).send('Missing uuid or userUuid');
  }

  const filepath = path.join(__dirname, `group-${uuid}.json`);
  fs.readFile(filepath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Group not found');
    const group = JSON.parse(data);
    if (!group.userUuids.includes(userUuid)) {
      group.userUuids.push(userUuid);
    }
    fs.writeFile(filepath, JSON.stringify(group), () => {
      console.log(`Added user ${userUuid} to group ${uuid}`);
      res.status(200).json(group);
    });
  });
});

// Remove one user from a group
app.post('/groups/remove-user', (req, res) => {
  const { uuid, userUuid } = req.body;
  if (!uuid || !userUuid) {
    console.log('POST /groups/remove-user - Missing uuid or userUuid');
    return res.status(400).send('Missing uuid or userUuid');
  }

  const filepath = path.join(__dirname, `group-${uuid}.json`);
  fs.readFile(filepath, 'utf8', (err, data) => {
    if (err) return res.status(404).send('Group not found');
    const group = JSON.parse(data);
    group.userUuids = group.userUuids.filter(u => u !== userUuid);
    fs.writeFile(filepath, JSON.stringify(group), () => {
      console.log(`Removed user ${userUuid} from group ${uuid}`);
      res.status(200).json(group);
    });
  });
});

// Send message to group
app.post('/group-messages', (req, res) => {
  const { groupUuid, senderUuid, text } = req.body;
  if (!groupUuid || !senderUuid || !text) {
    console.log('POST /group-messages - Missing required fields');
    return res.status(400).send('Missing required fields');
  }

  const filename = `group-${groupUuid}-messages.json`;
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

// Retrieve group messages
app.get('/group-messages', (req, res) => {
  const { groupUuid } = req.query;
  if (!groupUuid) {
    console.log('GET /group-messages - Missing groupUuid');
    return res.status(400).send('Missing groupUuid');
  }

  const filename = `group-${groupUuid}-messages.json`;
  const filepath = path.join(__dirname, filename);

  fs.readFile(filepath, 'utf8', (err, data) => {
    const messages = err ? [] : JSON.parse(data);
    console.log(`Retrieved ${messages.length} messages from ${filename}`);
    res.json(messages);
  });
});

// Delete group message by ID
app.delete('/group-messages', (req, res) => {
  const { groupUuid, id } = req.body;
  if (!groupUuid || !id) {
    console.log('DELETE /group-messages - Missing required fields');
    return res.status(400).send('Missing required fields');
  }

  const filename = `group-${groupUuid}-messages.json`;
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