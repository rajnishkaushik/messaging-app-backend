const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create a group
router.post('/', (req, res) => {
    const { name, createdBy, description } = req.body;

    if (!name || !createdBy) {
        console.log('POST /groups - Missing name or createdBy');
        return res.status(400).send('Missing name or createdBy');
    }

    const group = {
        uuid: uuidv4(),
        name,
        description,
        createdBy,
        users: [{ uuid: createdBy, isAdmin: true }],
        createdAt: new Date().toISOString()
    };

    const filepath = path.join(__dirname, '..', 'data', 'groups', `group__${group.uuid}.json`);
    fs.writeFile(filepath, JSON.stringify(group, null, 2), err => {
        if (err) {
            console.error('Error creating group:', err);
            return res.status(500).send('Failed to create group');
        }

        console.log(`Group created: ${group.uuid}`);
        res.status(200).json(group);
    });
});

// Add one user to a group
router.post('/add-user', (req, res) => {
    const { uuid, userUuid } = req.body;

    if (!uuid || !userUuid) {
        console.log('POST /groups/add-user - Missing uuid or userUuid');
        return res.status(400).send('Missing uuid or userUuid');
    }

    const filepath = path.join(__dirname, '..', 'data', 'groups', `group__${uuid}.json`);

    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('Group not found');

        const group = JSON.parse(data);
        const alreadyExists = group.users.some(u => u.uuid === userUuid);

        if (!alreadyExists) {
            group.users.push({ uuid: userUuid, isAdmin: false });
        }

        fs.writeFile(filepath, JSON.stringify(group, null, 2), err => {
            if (err) {
                console.error('Error updating group:', err);
                return res.status(500).send('Failed to update group');
            }

            console.log(`Added user ${userUuid} to group ${uuid}`);
            res.status(200).json(group);
        });
    });
});

// Remove one user from a group
router.post('/remove-user', (req, res) => {
    const { uuid, userUuid } = req.body;

    if (!uuid || !userUuid) {
        console.log('POST /groups/remove-user - Missing uuid or userUuid');
        return res.status(400).send('Missing uuid or userUuid');
    }

    const filepath = path.join(__dirname, '..', 'data', 'groups', `group__${uuid}.json`);

    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) return res.status(404).send('Group not found');

        const group = JSON.parse(data);
        const originalLength = group.users.length;
        group.users = group.users.filter(u => u.uuid !== userUuid);

        if (group.users.length === originalLength) {
            console.log(`User ${userUuid} not found in group ${uuid}`);
        } else {
            console.log(`Removed user ${userUuid} from group ${uuid}`);
        }

        fs.writeFile(filepath, JSON.stringify(group, null, 2), err => {
            if (err) {
                console.error('Error updating group:', err);
                return res.status(500).send('Failed to update group');
            }

            res.status(200).json(group);
        });
    });
});

router.get('/by-user/:uuid', (req, res) => {
    const userUuid = req.params.uuid;
    const groupsDir = path.join(__dirname, '..', 'data', 'groups');

    fs.readdir(groupsDir, (err, files) => {
        if (err) {
            console.error('Error reading groups directory:', err);
            return res.status(500).send('Failed to read groups');
        }

        const groupFiles = files.filter(f => f.startsWith('group__') && f.endsWith('.json'));
        const userGroups = [];

        let pending = groupFiles.length;
        if (pending === 0) return res.json([]);

        groupFiles.forEach(file => {
            const filepath = path.join(groupsDir, file);
            fs.readFile(filepath, 'utf8', (err, data) => {
                if (!err) {
                    try {
                        const group = JSON.parse(data);
                        const isMember = group.users?.some(u => u.uuid === userUuid);
                        if (isMember) userGroups.push(group);
                    } catch (e) {
                        console.warn(`Invalid JSON in ${file}`);
                    }
                }
                pending--;
                if (pending === 0) res.json(userGroups);
            });
        });
    });
});

// Get a group by UUID
router.get('/by-uuid/:uuid', (req, res) => {
    const groupUuid = req.params.uuid;
    if (!groupUuid) return res.status(400).send('Missing group UUID');

    const filepath = path.join(__dirname, '..', 'data', 'groups', `group__${groupUuid}.json`);

    fs.readFile(filepath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Group not found: ${groupUuid}`);
            return res.status(404).send('Group not found');
        }

        try {
            const group = JSON.parse(data);
            res.status(200).json(group);
        } catch (e) {
            console.error(`Failed to parse group file: ${groupUuid}`);
            res.status(500).send('Error parsing group data');
        }
    });
});

module.exports = router;




module.exports = router;
