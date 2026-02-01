import * as ui from './ui.js';

const socket = io("http://localhost:4000");

let state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || {},
    currentConversationId: null,
    currentConversationUserName: null,
    allUsers: {},
    serverMessageHistory: {}
};

const getChatKey = (name) => [state.currentUser.username, name].sort().join(" : ");

function init() {
    ui.elements.navbarUsername.textContent = `Account: ${state.currentUser.username || 'Anonymous'}`;
    socket.emit('user_join', state.currentUser.username);
}

// rendering the UI based on the current state
function refreshUI() {
    ui.elements.conversationsList.innerHTML = '';
    
    Object.entries(state.allUsers).forEach(([id, user]) => {
        if (id === socket.id) return;
        const item = ui.createConversationItem(user.name, user.status, state.currentConversationId === id, () => {
            state.currentConversationId = id;
            state.currentConversationUserName = user.name;
            ui.elements.chatName.textContent = user.name;
            updateChat();
        });
        ui.elements.conversationsList.appendChild(item);
    });

    const recipientInfo = Object.values(state.allUsers).find(u => u.name === state.currentConversationUserName);
    const isRecipientOnline = recipientInfo?.status === 'online';
    ui.updateInputState(isRecipientOnline);
}

function updateChat() {
    const chatKey = getChatKey(state.currentConversationUserName);
    const history = state.serverMessageHistory[chatKey] || [];
    ui.renderMessages(history, state.currentUser.username);
    refreshUI();
}

// listening to server events
socket.on("load_history", (history) => {
    state.serverMessageHistory = history;
    updateChat();
});

socket.on("online_users_update", (users) => {
    state.allUsers = users;
    refreshUI();
});

socket.on("receive_message", (data) => {
    if (!state.serverMessageHistory[data.chatKey]) state.serverMessageHistory[data.chatKey] = [];
    
    const exists = state.serverMessageHistory[data.chatKey].some(m => m.timestamp === data.timestamp);
    if (!exists) {
        state.serverMessageHistory[data.chatKey].push(data);
        updateChat();
    }
});

// submit event
ui.elements.messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = ui.elements.messageInput.value.trim();
    
    if (text && state.currentConversationId) {
        const receiverName = state.allUsers[state.currentConversationId]?.name;
        const chatKey = getChatKey(receiverName);
        const msgData = { text, senderName: state.currentUser.username, timestamp: new Date().toISOString() };

        if (!state.serverMessageHistory[chatKey]) state.serverMessageHistory[chatKey] = [];
        state.serverMessageHistory[chatKey].push(msgData);
        
        socket.emit("send_message", { ...msgData, receiverId: state.currentConversationId });
        ui.elements.messageInput.value = '';
        updateChat();
    }
});

init();