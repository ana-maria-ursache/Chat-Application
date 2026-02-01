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

// Get users that current user has conversations with
function getConversationUsers() {
    const conversationUserNames = new Set();
    
    // Extract usernames from chat keys
    Object.keys(state.serverMessageHistory).forEach(chatKey => {
        const [user1, user2] = chatKey.split(' : ');
        const otherUser = user1 === state.currentUser.username ? user2 : user1;
        if (otherUser) conversationUserNames.add(otherUser);
    });
    
    // Map to user objects with status
    return Array.from(conversationUserNames)
        .map(name => {
            const userEntry = Object.entries(state.allUsers).find(([_, user]) => user.name === name);
            return {
                socketId: userEntry?.[0] || name,
                name: name,
                status: userEntry?.[1]?.status || 'offline'
            };
        })
        .filter(u => u.name !== state.currentUser.username); // Exclude current user
}

function init() {
    ui.elements.navbarUsername.textContent = `Account: ${state.currentUser.username || 'Anonymous'}`;
    socket.emit('user_join', state.currentUser.username);
}

// rendering the UI based on the current state
function refreshUI() {
    const conversationUsers = getConversationUsers();
    
    ui.renderConversationSections(
        state.allUsers,
        conversationUsers,
        state.currentConversationId,
        socket.id,
        (id, name) => {
            state.currentConversationId = id;
            state.currentConversationUserName = name;
            ui.elements.chatName.textContent = name;
            updateChat();
        }
    );

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