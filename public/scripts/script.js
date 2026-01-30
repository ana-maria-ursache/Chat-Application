const socket = io("http://localhost:4000");

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const conversationsList = document.getElementById('conversations-list');
const chatName = document.getElementById('chat-name');
const navbarUsername = document.getElementById('navbar-username');

const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
let currentConversationId = null;
let currentConversationUserName = null;
let onlineUsers = {};
let serverMessageHistory = {};

function init() {
    navbarUsername.textContent = `Account: ${currentUser.username || 'Anonymous'}`;
    socket.emit('user_join', currentUser.username);
}

// Update message input state based on whether recipient is online
function updateMessageInputState() {
    const isRecipientOnline = currentConversationUserName && Object.values(onlineUsers).includes(currentConversationUserName);
    
    if (isRecipientOnline) {
        messageInput.disabled = false;
        messageInput.placeholder = 'Type your message here...';
        messageForm.style.opacity = '1';
    } else {
        messageInput.disabled = true;
        messageInput.value = '';
        messageInput.placeholder = 'Wait until the user is online again to send messages';
        messageForm.style.opacity = '0.7';
    }
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
    updateMessageInputState(); // Update input state when users come online/offline
});

function renderUsers() {
    conversationsList.innerHTML = '';

    // Separate conversations by online/offline status
    const onlineUsersWithHistory = [];
    const onlineUsersWithoutHistory = [];
    const offlineUsersWithHistory = [];

    // Online users
    Object.entries(onlineUsers).forEach(([id, name]) => {
        if (id === socket.id) return; // Don't show ourselves

        const chatKey = [currentUser.username, name].sort().join(" : ");
        if (serverMessageHistory[chatKey]) {
            onlineUsersWithHistory.push({ id, name });
        } else {
            onlineUsersWithoutHistory.push({ id, name });
        }
    });

    // Offline users with chat history available
    Object.keys(serverMessageHistory).forEach((chatKey) => {
        const users = chatKey.split(' : ');
        const otherUser = users[0] === currentUser.username ? users[1] : users[0];
        
        const isOnline = Object.values(onlineUsers).includes(otherUser);
        
        if (!isOnline && !offlineUsersWithHistory.find(u => u.name === otherUser)) {
            offlineUsersWithHistory.push({ id: null, name: otherUser });
        }
    });

    // Render "Online (Previously Chatted)" section
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
                currentConversationUserName = name;
                chatName.textContent = name;
                renderMessages();
                renderUsers();
                updateMessageInputState();
            };
            conversationsList.appendChild(div);
        });
    }

    // Render "Offline (Previously Chatted)" section
    if (offlineUsersWithHistory.length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'conversations-category';
        categoryDiv.innerHTML = '<h3 class="category-title">Offline (Previously Chatted)</h3>';
        conversationsList.appendChild(categoryDiv);

        offlineUsersWithHistory.forEach(({ name }) => {
            const div = document.createElement('div');
            div.className = `conversation-item offline-user`;
            div.innerHTML = `<div class="conversation-avatar">${name[0]}</div><p>${name}</p><span class="offline-indicator">●</span>`;
            div.onclick = () => {
                const chatKey = [currentUser.username, name].sort().join(" : ");
                currentConversationId = null;
                currentConversationUserName = name;
                chatName.textContent = name;
                renderMessages(chatKey);
                renderUsers();
                updateMessageInputState();
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
                currentConversationUserName = name;
                chatName.textContent = name;
                renderMessages();
                renderUsers();
                updateMessageInputState();
            };
            conversationsList.appendChild(div);
        });
    }
}

function renderMessages(overrideChatKey) {
    messagesContainer.innerHTML = '';

    let chatKey;
    
    if (overrideChatKey) {
        chatKey = overrideChatKey; // Used when clicking offline users
    } else if (currentConversationId) {
        const otherName = onlineUsers[currentConversationId]; // Used when clicking online users
        chatKey = [currentUser.username, otherName].sort().join(" : ");
    } else {
        return; // No selection
    }
    
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
