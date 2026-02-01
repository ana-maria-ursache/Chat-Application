require('dotenv').config();
const { Server } = require("socket.io");
const { loadUserChatHistory, saveUserStatus, saveMessage, redisConnected } = require('./redis-client');

const io = new Server(4000, {
    cors: { origin: "http://localhost:3000" }
});

const allUsers = {}; // { socketId: { name, status: 'online'|'offline' } }

io.on("connection", (socket) => {
    socket.on("user_join", async (username) => {
        allUsers[socket.id] = { name: username, status: 'online' };

        console.log(`User ${username} joined with socket ID: ${socket.id}`);
        console.log(`Current users:`, allUsers);
        
        if (redisConnected()) {
            await saveUserStatus(username, socket.id, 'online');
        }
        
        let allMessages = {};
        try {
            allMessages = await loadUserChatHistory(username);
            console.log(`Sending history to ${username}:`, Object.keys(allMessages));
        } catch (err) {
            console.error('Error loading chat history:', err);
        }
        
        socket.emit("load_history", allMessages);
        
        console.log(`Broadcasting users update to all clients:`, allUsers);
        io.emit("online_users_update", allUsers);
    });

    socket.on("send_message", async (data) => {
        const { text, senderName, receiverId } = data;
        const receiverName = allUsers[receiverId]?.name;
        
        console.log(`Message from ${senderName} to ${receiverName}:`, text);
        
        if (!receiverName) {
            console.warn(`Receiver ${receiverId} not found in online users`);
            return;
        }

        const chatKey = [senderName, receiverName].sort().join(" : ");
        
        const newMessage = { // add new message to cache
            text,
            senderName,
            timestamp: new Date().toISOString()
        };
        
        if (redisConnected()) {
            const messageData = {
                ...newMessage,
                chatKey,
                senderId: socket.id
            };
            await saveMessage(chatKey, messageData);
        }

        const messagePayload = { ...newMessage, chatKey, senderId: socket.id };
        console.log(`Sending message to receiver (${receiverName} - ${receiverId}):`, messagePayload);
        socket.to(receiverId).emit("receive_message", messagePayload);
    });

    socket.on("disconnect", async () => {
        const username = allUsers[socket.id]?.name;
        if (allUsers[socket.id]) allUsers[socket.id].status = 'offline';
        
        if (username && redisConnected()) {
            await saveUserStatus(username, null, 'offline');
        }
        
        io.emit("online_users_update", allUsers);
    });
});
