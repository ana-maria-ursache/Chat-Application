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

    Object.entries(onlineUsers).forEach(([id, name]) => {
        if (id === socket.id) return; // We don't want to see ourselves in the list

        const div = document.createElement('div');
        div.className = `conversation-item ${currentConversationId === id ? 'active' : ''}`;
        div.innerHTML = `<div class="conversation-avatar">${name[0]}</div><p>${name}</p>`;
        div.onclick = () => { // When we click a user conversation -> open chat and see the messages
            currentConversationId = id;
            chatName.textContent = name;
            renderMessages();
            renderUsers();
        };
        conversationsList.appendChild(div);
    });
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
        socket.emit("send_message", { 
            text, 
            senderName: currentUser.username, 
            receiverId: currentConversationId 
        });
        messageInput.value = '';
    }
});

socket.on("receive_message", (data) => {
    if (!serverMessageHistory[data.chatKey]) // See if there is history with this chatKey
        serverMessageHistory[data.chatKey] = [];

    serverMessageHistory[data.chatKey].push(data); // Add the new message to the history

    const currentOtherName = onlineUsers[currentConversationId];

    // We verify that only the users implicated will get the msg
    if (data.chatKey.includes(currentUser.username) && data.chatKey.includes(currentOtherName)) { 
        renderMessages();
    }
});

init();