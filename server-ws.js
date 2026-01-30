require('dotenv').config();
const { Server } = require("socket.io");
const { createClient } = require("redis");

const io = new Server(4000, {
    cors: { origin: "http://localhost:3000" }
});

const redis = createClient({
    host: 'localhost',
    port: 6379
});

let redisConnected = false;

redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
    console.warn('Running without Redis cache - using file storage only');
});

redis.on('connect', () => {
    redisConnected = true;
    console.log('Connected to Redis');
});

redis.connect().catch(() => {
    console.warn('Could not connect to Redis - please ensure Redis server is running');
    console.warn('To start Redis, run: redis-server');
});

// Load all chat conversations for a user from Redis
async function loadUserChatHistory(username) {
    const chatHistory = {};
    
    if (!redisConnected) {
        console.warn('Redis not connected, returning empty chat history');
        return chatHistory;
    }
    
    try {
        const chatKeys = await redis.keys('chat:*');
        
        for (const key of chatKeys) {
            const chatKey = key.replace('chat:', '');
            if (chatKey.includes(username)) {
                try {
                    const messages = await redis.lRange(key, 0, -1); // lRange = get all the list
                    chatHistory[chatKey] = messages.map(msg => JSON.parse(msg)).reverse();
                } catch (parseErr) {
                    console.error(`Error parsing messages for ${chatKey}:`, parseErr);
                }
            }
        }
    } catch (err) {
        console.error('Error loading chat history from Redis:', err);
    }
    return chatHistory;
}

const onlineUsers = {}; 

io.on("connection", (socket) => {
    socket.on("user_join", async (username) => {
        onlineUsers[socket.id] = username;

        console.log(`User ${username} joined with socket ID: ${socket.id}`);
        console.log(`Current online users:`, onlineUsers);
        
        if (redisConnected) {
            try {
                await redis.hSet(`users:${username}`, { // add/update info
                    id: socket.id,
                    status: 'online',
                    lastSeen: new Date().toISOString()
                });
                await redis.sAdd('online_users', username);
            } catch (err) {
                console.error('Redis error:', err);
            }
        }
        
        let allMessages = {};
        try {
            allMessages = await loadUserChatHistory(username);
            console.log(`Sending history to ${username}:`, Object.keys(allMessages));
        } catch (err) {
            console.error('Error loading chat history:', err);
        }
        
        socket.emit("load_history", allMessages);
        
        console.log(`Broadcasting online users update to all clients:`, onlineUsers);
        io.emit("online_users_update", onlineUsers);
    });

    socket.on("send_message", async (data) => {
        const { text, senderName, receiverId } = data;
        const receiverName = onlineUsers[receiverId];
        
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
        
        if (redisConnected) {
            try {
                const messageData = {
                    ...newMessage,
                    chatKey,
                    senderId: socket.id
                };
                await redis.lPush(`chat:${chatKey}`, JSON.stringify(messageData));
                console.log(`Message stored in Redis for chat: ${chatKey}`);
            } catch (err) {
                console.error('Redis error:', err);
            }
        }

        const messagePayload = { ...newMessage, chatKey, senderId: socket.id };
        console.log(`Sending message to receiver (${receiverName} - ${receiverId}):`, messagePayload);
        socket.to(receiverId).emit("receive_message", messagePayload);
    });

    socket.on("disconnect", async () => {
        const username = onlineUsers[socket.id];
        delete onlineUsers[socket.id];
        
        if (username && redisConnected) {
            try {
                await redis.hSet(`users:${username}`, {
                    status: 'offline',
                    lastSeen: new Date().toISOString()
                });
                await redis.sRem('online_users', username);
            } catch (err) {
                console.error('Redis error:', err);
            }
        }
        
        io.emit("online_users_update", onlineUsers);
    });
});