const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// POST endpoint to save user to user message
router.post('/', (req, res) => {
    const { uuid1, uuid2, senderUuid, text } = req.body;
    if (!uuid1 || !uuid2 || !senderUuid || !text) {
        console.log('POST /messages - Missing required fields');
        return res.status(400).send('Missing required fields');
    }

    const filename = `${uuid1}__${uuid2}.json`;
    const filepath = path.join(__dirname, '..', 'data', 'messages', 'user', filename);
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

// GET endpoint to retrieve user to user messages
router.get('/', (req, res) => {
    const { uuid1, uuid2 } = req.query;
    if (!uuid1 || !uuid2) {
        console.log('GET /messages - Missing required query parameters');
        return res.status(400).send('Missing required query parameters');
    }

    const filename = `${uuid1}__${uuid2}.json`;
    const filepath = path.join(__dirname, '..', 'data', 'messages', 'user', filename);

    fs.readFile(filepath, 'utf8', (err, data) => {
        const messages = err ? [] : JSON.parse(data);
        console.log(`Retrieved ${messages.length} messages from ${filename}`);
        res.json(messages);
    });
});

module.exports = router;
