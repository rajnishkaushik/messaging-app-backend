const express = require('express');
const app = express();
const path = require('path');
const usersRoutes = require('./routes/users');
const threadsRoutes = require('./routes/threads');
const messagesRoutes = require('./routes/messages');
const groupsRoutes = require('./routes/groups');
const groupMessagesRoutes = require('./routes/group-messages');

app.use(express.json());
app.use('/users', usersRoutes);
app.use('/threads', threadsRoutes);
app.use('/messages', messagesRoutes);
app.use('/groups', groupsRoutes);
app.use('/group-messages', groupMessagesRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));

app.use(express.static(path.join(__dirname, 'public')));
