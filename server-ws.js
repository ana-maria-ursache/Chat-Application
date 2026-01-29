const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const io = new Server(4000, {
    cors: { origin: "http://localhost:3000" }
});

const MESSAGES_FILE = path.join(__dirname, 'messages.json');
const USERS_FILE = path.join(__dirname, 'users.json');

if (!fs.existsSync(MESSAGES_FILE)) 
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify({}));

if (!fs.existsSync(USERS_FILE)) 
    fs.writeFileSync(USERS_FILE, JSON.stringify({}));

const onlineUsers = {}; 

io.on("connection", (socket) => {
    socket.on("user_join", (username) => {
        onlineUsers[socket.id] = username;
        
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        users[username] = { id: socket.id, lastSeen: new Date() };
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        const allMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
        socket.emit("load_history", allMessages);
        
        io.emit("online_users_update", onlineUsers);
    });

    socket.on("send_message", (data) => {
        const { text, senderName, receiverId } = data;
        const receiverName = onlineUsers[receiverId];
        
        if (!receiverName) return;

        const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE));
        const chatKey = [senderName, receiverName].sort().join(" : ");
        
        if (!messages[chatKey]) messages[chatKey] = [];
        
        const newMessage = {
            text,
            senderName,
            timestamp: new Date().toISOString()
        };
        
        messages[chatKey].push(newMessage);
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

        socket.emit("receive_message", { ...newMessage, chatKey, senderId: socket.id });
        socket.to(receiverId).emit("receive_message", { ...newMessage, chatKey, senderId: socket.id });
    });

    socket.on("disconnect", () => {
        delete onlineUsers[socket.id];
        io.emit("online_users_update", onlineUsers);
    });
});