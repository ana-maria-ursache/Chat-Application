const { Server } = require("socket.io");

const io = new Server(4000, {
    cors: { origin: "http://localhost:3000" } // dam voie sa fie conexiuni de la UI la server
});

const onlineUsers = {};

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("user_join", (username) => {
        onlineUsers[socket.id] = username;
        console.log(username + " joined, online users:", onlineUsers);
        io.emit("online_users_update", onlineUsers);
    });

    socket.on("send_message", (data) => {
        io.emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log("This user disconnected:", socket.id);
        delete onlineUsers[socket.id];
        io.emit("online_users_update", onlineUsers);
    });
});

console.log("This websocket server is running on port 4000");