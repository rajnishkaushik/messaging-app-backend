const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Retrieve all users or a specific one
router.get('/', (req, res) => {
    const usersDir = path.join(__dirname, '..', 'data', 'users');
    const requestedUuids = Array.isArray(req.query.uuid)
        ? req.query.uuid
        : req.query.uuid ? [req.query.uuid] : null;

    const loadUserFile = uuid => {
        const filePath = path.join(usersDir, `${uuid}.json`);
        try {
            return fs.existsSync(filePath)
                ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
                : null;
        } catch (e) {
            console.warn(`Failed to load user ${uuid}:`, e);
            return null;
        }
    };

    if (requestedUuids) {
        const users = requestedUuids
            .map(loadUserFile)
            .filter(Boolean); // remove nulls
        console.log(`Retrieved ${users.length} users by UUID`);
        return res.json(users);
    }

    // Fallback: load all users
    fs.readdir(usersDir, (err, files) => {
        if (err) {
            console.error('Error reading users directory:', err);
            return res.status(500).send('Failed to read users');
        }

        const users = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(usersDir, file);
                try {
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                } catch (e) {
                    console.warn(`Failed to parse ${file}:`, e);
                    return null;
                }
            })
            .filter(Boolean);

        console.log(`Retrieved ${users.length} users`);
        res.json(users);
    });
});



// Create a new user
router.post('/', (req, res) => {
    const { firstName, lastName, profileName, phoneCountryCode, phoneNumber, dateOfBirth } = req.body;

    if (!firstName) {
        console.log('POST /users - Missing firstName');
        return res.status(400).send('Missing firstName');
    }

    const user = {
        uuid: uuidv4(),
        firstName,
        lastName: lastName || '',
        profileName: profileName || '',
        phoneCountryCode: phoneCountryCode || '',
        phoneNumber: phoneNumber || '',
        dateOfBirth: dateOfBirth || ''
    };

    const userFilePath = path.join(__dirname, '..', 'data', 'users', `${user.uuid}.json`);

    fs.writeFile(userFilePath, JSON.stringify(user, null, 2), err => {
        if (err) {
            console.error('Error saving user:', err);
            res.status(500).send('Failed to save user');
        } else {
            console.log(`User created: ${user.uuid}`);
            res.status(200).json(user);
        }
    });
});


// Delete a user by UUID
router.delete('/', (req, res) => {
    const { uuid } = req.body;
    if (!uuid) {
        console.log('DELETE /users - Missing uuid');
        return res.status(400).send('Missing uuid');
    }

    const userFilePath = path.join(__dirname, '..', 'data', 'users', `${uuid}.json`);

    fs.readFile(userFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('User not found:', err);
            return res.status(404).send('User not found');
        }

        const user = JSON.parse(data);
        user.deletedOn = new Date().toISOString();

        fs.writeFile(userFilePath, JSON.stringify(user, null, 2), err => {
            if (err) {
                console.error('Error updating user:', err);
                return res.status(500).send('Failed to update user');
            }

            console.log(`User marked as deleted: ${uuid}`);
            res.status(200).json(user);
        });
    });
});

module.exports = router;
