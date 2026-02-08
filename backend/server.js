//server configuration
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();
const { db } = require('./config/firebase');

const app = express();
const server = http.createServer(app);

//frontend on port 3000
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});
//running first
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}));

//Websocket setup
io.on('connection',(socket) => {
    console.log('Client connected: ', socket.id);

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} join room: ${roomId}`);
        });

    socket.on('send_message', async (data) => {
        try {
            const { room, message, senderId, senderName, timestamp } = data;

            await db.collection('chats').doc(room).collection('messages').add({
                senderId,
                senderName,
                text: message,
                timestamp: timestamp || new Date().toISOString()
            });

            await db.collection('chats').doc(room).set({
                lastMessage: message,
                updatedAt: new Date().toISOString(),
                employeeId: room.replace('chat_room_', '')
            }, { merge: true });

            io.to(room).emit('receive_message', data);
        } catch (error) {
            console.error('Error saving to Firebase:', error);
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        });
    });
    app.set('io', io);

    //routing
    const ownerRoutes = require('./routes/owner');
    const employeeRoutes = require('./routes/employee');

    app.use('/api/owner', ownerRoutes);
    app.use('/api/employee', employeeRoutes);

    app.get('/', (req, res) => {
    res.json({
        message: 'server is working',
        timestamp: new Date().toISOString()
    });
    });
    //check health sever
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            uptime: process.uptime()
        });
    });
    //server info
    app.get('/info', (req, res) => {
        res.json({
            server: 'Employee Management API',
            version: '1.0.0',
            endpoints: {
                owner: '/api/owner',
                employee: '/api/employee'
            },
            author: 'dinhlam2901'
        });
    });
    //error handle
    app.use((req, res, next) => {
        res.status(404).json({
            success: false,
            message: `Route ${req.method} ${req.url} not exist`
        });
    });
    app.use((err, req, res, next) => {
        console.error('Server Error:', err.stack);
        res.status(500).json({
            success: false,
            message: 'something when wrong',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });
    //start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log('='.repeat(50));
        console.log(`Server running at: http://localhost:${PORT}`);
        console.log(`Socket.io ready for connections`);
        console.log(`Started at: ${new Date().toLocaleString()}`);
        console.log('='.repeat(50));
    });
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is used`);
            process.exit(1);
        } else {
            console.error('Server error:', error);
        }
    });
    //Ctrl + C handle
    process.on('SIGINT', () => {
        console.log('\nshutting down server...');
        server.close(() => {
            console.log('Server off');
            process.exit(0);
        });
    });


