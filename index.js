// var express = require('express');
// var http = require('http');

// var app = express();
// var server = http.createServer(app);

// var io = require('socket.io')(server);
// var path = require('path');


// app.use(express.static(path.join(__dirname,'./public')));

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/public/index.html');
// });


// var name;

// io.on('connection', (socket) => {
//   console.log('new user connected');
  
//   socket.on('joining msg', (username) => {
//   	name = username;
//   	io.emit('chat message', `---${name} joined the chat---`);
//   });
  
//   socket.on('disconnect', () => {
//     console.log('user disconnected');
//     io.emit('chat message', `---${name} left the chat---`);
    
//   });
//   socket.on('chat message', (msg) => {
//     socket.broadcast.emit('chat message', msg);        
//   });
// });

// // server.listen(3000, () => {
// //   console.log('Server listening on :3000');
// // });


// const port = process.env.PORT || 3000;
// server.listen(port, () => {
//     console.log(`Server started on port ${port}`);
// });


const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to ChatCord!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));