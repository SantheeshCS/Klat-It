const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/Auth');
const Message = require('./models/Message'); 
const User = require('./models/User'); 

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4000",
    methods: ["GET", "POST"],
    credentials: true
  }
});
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());


app.use('/api/auth', authRoutes);


app.get('/api/messages/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate('sender', 'username avatar')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});


mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log('Connected to MongoDB successfully');
});

// Track user presence across sockets
const userIdToSocketCount = new Map(); // userId -> number of active sockets
const socketIdToUserId = new Map(); // socketId -> userId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Client should emit user_online with their userId right after connect
  socket.on('user_online', async (userId) => {
    try {
      if (!userId) return;
      socketIdToUserId.set(socket.id, userId);

      const currentCount = userIdToSocketCount.get(userId) || 0;
      userIdToSocketCount.set(userId, currentCount + 1);

      if (currentCount === 0) {
        // First active socket for this user → mark online in DB and broadcast
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
        io.emit('user_status', { userId, isOnline: true });
        console.log(`Presence: user ${userId} is now ONLINE`);
      }
    } catch (err) {
      console.error('Error handling user_online:', err);
    }
  });

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
    socket.emit('joined_room', room);
  });


socket.on('send_message', async (data) => {
  try {
    console.log('🔵 [BACKEND] send_message event received:', data);
    
    if (!data.room || !data.sender || !data.content) {
      console.error('❌ [BACKEND] Missing required fields');
      return;
    }

    const message = new Message({
      room: data.room,
      sender: data.sender,
      content: data.content,
      timestamp: new Date()
    });
    
    const savedMessage = await message.save();
    console.log('✅ [BACKEND] Message saved to DB:', savedMessage._id);
    
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('sender', 'username avatar');

    io.to(data.room).emit('receive_message', populatedMessage);
    console.log('✅ [BACKEND] Message emitted to room (all clients)');
    
  } catch (error) {
    console.error('❌ [BACKEND] Error in send_message:', error);
  }
});

  socket.on('typing', (data) => {
    socket.to(data.room).emit('user_typing', data);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.room).emit('user_stop_typing', data);
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    const userId = socketIdToUserId.get(socket.id);
    if (!userId) return;
    socketIdToUserId.delete(socket.id);

    const currentCount = userIdToSocketCount.get(userId) || 0;
    const nextCount = Math.max(0, currentCount - 1);
    if (nextCount === 0) {
      userIdToSocketCount.delete(userId);
      try {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit('user_status', { userId, isOnline: false });
        console.log(`Presence: user ${userId} is now OFFLINE`);
      } catch (err) {
        console.error('Error handling disconnect presence update:', err);
      }
    } else {
      userIdToSocketCount.set(userId, nextCount);
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});