const socket = io("http://localhost:4000");

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const emptyState = document.getElementById('empty-state');
const conversationsList = document.getElementById('conversations-list');
const chatName = document.getElementById('chat-name');
const navbarUsername = document.getElementById('navbar-username');

const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
let serverMessageHistory = {}; // Replaces LocalStorage for messages
let onlineUsers = {}
let currentConversationId = null;

function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify({}));
    }
    if (!localStorage.getItem('conversations')) {
        localStorage.setItem('conversations', JSON.stringify({}));
    }
    if (!localStorage.getItem('messages')) {
        localStorage.setItem('messages', JSON.stringify({}));
    }
}

function storeCurrentUser() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    users[socket.id] = {
        id: socket.id,
        username: currentUser.username || 'Anonymous',
        joinedAt: currentUser.joinedAt || new Date().toISOString()
    };
    localStorage.setItem('users', JSON.stringify(users));
    
    const username = currentUser.username || 'Anonymous';
    navbarUsername.textContent = `Account: ${username}`;
    
    socket.emit('user_join', username);
}

function updateConversationsList(onlineUsersData) {
    conversationsList.innerHTML = '';
    onlineUsers = onlineUsersData;
    
    const conversations = JSON.parse(localStorage.getItem('conversations')) || {};
    
    Object.entries(onlineUsersData).forEach(([userId, username]) => {
        if (userId === socket.id) return; 
        
        const conversationDiv = document.createElement('div');
        conversationDiv.classList.add('conversation-item');
        conversationDiv.setAttribute('data-id', userId);
        
        if (currentConversationId === userId) {
            conversationDiv.classList.add('active');
        }
        
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('conversation-avatar');
        avatarDiv.textContent = username.charAt(0).toUpperCase();
        
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('conversation-info');
        
        const nameP = document.createElement('p');
        nameP.classList.add('conversation-name');
        nameP.textContent = username;
        
        infoDiv.appendChild(nameP);
        conversationDiv.appendChild(avatarDiv);
        conversationDiv.appendChild(infoDiv);
        
        conversationDiv.addEventListener('click', () => {
            selectConversation(userId, username);
        });
        
        conversationsList.appendChild(conversationDiv);
    });
}

function selectConversation(userId, username) {
    currentConversationId = userId;
    chatName.textContent = username;
    
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-id="${userId}"]`).classList.add('active');
    
    loadConversationMessages(userId);
}

function loadConversationMessages(userId) {
    messagesContainer.innerHTML = '';
    const messages = JSON.parse(localStorage.getItem('messages')) || {};
    const conversationMessages = messages[userId] || [];
    
    if (conversationMessages.length === 0) {
        messagesContainer.innerHTML = '<div class="empty-state" id="empty-state"><p class="empty-state-text">Hi there!! You can start a conversation!!</p></div>';
        return;
    }
    
    conversationMessages.forEach(msg => {
        addMessageToUI(msg.text, msg.type);
    });
}

function addMessageToUI(text, type) {    
    const emptyStateDiv = document.getElementById('empty-state');
    if (emptyStateDiv) {
        emptyStateDiv.remove();
    }
    
    if (!text || text.trim() === '') return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type === 'sent' ? 'message-sent' : 'message-received');

    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('message-bubble');
    
    const paragraphElement = document.createElement('p');
    paragraphElement.textContent = text;
    
    bubbleDiv.appendChild(paragraphElement);
    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    
    messageInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function saveMessageToLocalStorage(text, type, conversationId) {
    const messages = JSON.parse(localStorage.getItem('messages')) || {};
    if (!messages[conversationId]) {
        messages[conversationId] = [];
    }
    messages[conversationId].push({
        text: text,
        type: type,
        timestamp: new Date().toISOString(),
        senderId: socket.id
    });
    localStorage.setItem('messages', JSON.stringify(messages));
}

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text !== '' && currentConversationId) {
        saveMessageToLocalStorage(text, 'sent', currentConversationId);
        
        socket.emit("send_message", { 
            text: text, 
            senderId: socket.id,
            senderName: currentUser.username || 'Anonymous',
            receiverId: currentConversationId 
        });
        
        addMessageToUI(text, 'sent');
        messageInput.value = '';
    }
});

socket.on("online_users_update", (onlineUsersData) => {
    updateConversationsList(onlineUsersData);
});

socket.on("receive_message", (data) => {
    if (data.receiverId === socket.id || data.senderId === currentConversationId) {
        const type = data.senderId === socket.id ? 'sent' : 'received';
        
        const conversationId = data.senderId === socket.id ? data.receiverId : data.senderId;
        
        if (conversationId === currentConversationId) {
            saveMessageToLocalStorage(data.text, type, conversationId);
            addMessageToUI(data.text, type);
        } else {
            saveMessageToLocalStorage(data.text, type, conversationId);
        }
    }
});

initializeLocalStorage();
storeCurrentUser();
