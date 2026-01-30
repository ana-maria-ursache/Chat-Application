const socket = io("http://localhost:4000");

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const conversationsList = document.getElementById('conversations-list');
const chatName = document.getElementById('chat-name');
const navbarUsername = document.getElementById('navbar-username');

const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
let currentConversationId = null;
let onlineUsers = {};
let serverMessageHistory = {}; 

function init() {
    navbarUsername.textContent = `Account: ${currentUser.username || 'Anonymous'}`;
    socket.emit('user_join', currentUser.username);
}

// socket.emit = sent data from client to server
//      in the server it is emited and, here, in the script, is handled

// socket.on = listener, then handler
socket.on("load_history", (history) => {
    serverMessageHistory = history;
});

socket.on("online_users_update", (users) => {
    onlineUsers = users;
    renderUsers();
});

function renderUsers() {
    conversationsList.innerHTML = '';

    // Separate online users from those with chat history that are offline
    const onlineUsersWithHistory = [];
    const onlineUsersWithoutHistory = [];

    Object.entries(onlineUsers).forEach(([id, name]) => {
        if (id === socket.id) return; // We don't want to see ourselves in the list

        const chatKey = [currentUser.username, name].sort().join(" : ");
        if (serverMessageHistory[chatKey]) {
            onlineUsersWithHistory.push({ id, name });
        } else {
            onlineUsersWithoutHistory.push({ id, name });
        }
    });

    // Render "Online & Previously Chatted" section
    if (onlineUsersWithHistory.length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'conversations-category';
        categoryDiv.innerHTML = '<h3 class="category-title">Online (Previously Chatted)</h3>';
        conversationsList.appendChild(categoryDiv);

        onlineUsersWithHistory.forEach(({ id, name }) => {
            const div = document.createElement('div');
            div.className = `conversation-item ${currentConversationId === id ? 'active' : ''} online-user`;
            div.innerHTML = `<div class="conversation-avatar">${name[0]}</div><p>${name}</p><span class="online-indicator"></span>`;
            div.onclick = () => {
                currentConversationId = id;
                chatName.textContent = name;
                renderMessages();
                renderUsers();
            };
            conversationsList.appendChild(div);
        });
    }

    // Render "Other Online Users" section
    if (onlineUsersWithoutHistory.length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'conversations-category';
        categoryDiv.innerHTML = '<h3 class="category-title">Other Online Users</h3>';
        conversationsList.appendChild(categoryDiv);

        onlineUsersWithoutHistory.forEach(({ id, name }) => {
            const div = document.createElement('div');
            div.className = `conversation-item ${currentConversationId === id ? 'active' : ''} online-user`;
            div.innerHTML = `<div class="conversation-avatar">${name[0]}</div><p>${name}</p><span class="online-indicator"></span>`;
            div.onclick = () => {
                currentConversationId = id;
                chatName.textContent = name;
                renderMessages();
                renderUsers();
            };
            conversationsList.appendChild(div);
        });
    }
}

function renderMessages() {
    messagesContainer.innerHTML = '';

    const otherName = onlineUsers[currentConversationId];

    const chatKey = [currentUser.username, otherName].sort().join(" : ");
    const history = serverMessageHistory[chatKey] || [];
    
    history.forEach(msg => {
        const type = msg.senderName === currentUser.username ? 'sent' : 'received';

        const div = document.createElement('div');
        div.className = `message message-${type}`;
        div.innerHTML = `<div class="message-bubble"><p>${msg.text}</p></div>`;

        messagesContainer.appendChild(div);
    });
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text && currentConversationId) {
        const receiverName = onlineUsers[currentConversationId];
        const chatKey = [currentUser.username, receiverName].sort().join(" : ");
        
        if (!serverMessageHistory[chatKey]) {
            serverMessageHistory[chatKey] = [];
        }
        serverMessageHistory[chatKey].push({
            text,
            senderName: currentUser.username,
            timestamp: new Date().toISOString()
        });
        renderMessages();
        
        socket.emit("send_message", { 
            text, 
            senderName: currentUser.username, 
            receiverId: currentConversationId 
        });
        messageInput.value = '';
    }
});

socket.on("receive_message", (data) => {
    if (!serverMessageHistory[data.chatKey]) {
        serverMessageHistory[data.chatKey] = [];
    }

    // Check if message already exists (to avoid duplicates)
    const messageExists = serverMessageHistory[data.chatKey].some(
        msg => msg.timestamp === data.timestamp && msg.senderName === data.senderName && msg.text === data.text
    );
    
    if (!messageExists) {
        serverMessageHistory[data.chatKey].push(data);
    }

    if (currentConversationId) {
        const currentOtherName = onlineUsers[currentConversationId];
        const currentChatKey = [currentUser.username, currentOtherName].sort().join(" : ");
        
        if (data.chatKey === currentChatKey) {
            renderMessages();
        }
    }
});

init();