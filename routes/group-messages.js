const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET: Fetch all messages for a group
router.get('/', (req, res) => {
    const { groupUuid } = req.query;
    if (!groupUuid) return res.status(400).send('Missing groupUuid');

    const filepath = path.join(__dirname, '..', 'data', 'messages', 'group', `group_messages__${groupUuid}.json`);
    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) return res.json([]); // No messages yet
        try {
            const messages = JSON.parse(data);
            res.json(messages);
        } catch (e) {
            res.status(500).send('Failed to parse messages');
        }
    });
});

// POST: Send a new message to a group
router.post('/', (req, res) => {
    const { groupUuid, senderUuid, text } = req.body;
    if (!groupUuid || !senderUuid || !text) {
        console.log('POST /group-messages - Missing fields');
        return res.status(400).send('Missing groupUuid, senderUuid, or text');
    }

    const filepath = path.join(__dirname, '..', 'data', 'messages', 'group', `group_messages__${groupUuid}.json`);
    const newMessage = {
        senderUuid,
        text,
        timestamp: new Date().toISOString()
    };

    fs.readFile(filepath, 'utf8', (err, data) => {
        const messages = !err ? JSON.parse(data || '[]') : [];
        messages.push(newMessage);

        fs.writeFile(filepath, JSON.stringify(messages, null, 2), err => {
            if (err) {
                console.error('Error saving message:', err);
                return res.status(500).send('Failed to save message');
            }

            console.log(`Message saved to group ${groupUuid}`);
            res.status(200).json(newMessage);
        });
    });
});

module.exports = router;
