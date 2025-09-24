const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Get all user to user message threads for logged in user
router.get('/', (req, res) => {
    const { uuid } = req.query;
    if (!uuid) return res.status(400).send('Missing uuid');

    const userMessagesPathFolder = path.join(__dirname, '..', 'data', 'messages', 'user');

    fs.readdir(userMessagesPathFolder, (err, files) => {
        if (err) return res.status(500).send('Server error');

        const threadSet = new Set();

        files.forEach(file => {
            if (file.endsWith('.json') && file.includes('-')) {
                const [uuid1, uuid2] = file.replace('.json', '').split('__');
                if (uuid1 === uuid) {
                    threadSet.add(uuid2);
                }
                if (uuid2 === uuid) {
                    threadSet.add(uuid1);
                }
            }
    });

    const result = Array.from(threadSet);
    res.json(result);
    });
});

module.exports = router;
