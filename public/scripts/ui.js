export const elements = {
    messageForm: document.getElementById('message-form'),
    messageInput: document.getElementById('message-input'),
    messagesContainer: document.getElementById('messages-container'),
    conversationsList: document.getElementById('conversations-list'),
    chatName: document.getElementById('chat-name'),
    navbarUsername: document.getElementById('navbar-username')
};

export function updateInputState(isOnline) {
    elements.messageInput.disabled = !isOnline;
    elements.messageInput.placeholder = isOnline ? 'Type your message here...' : 'Wait until user is online...';
    elements.messageForm.style.opacity = isOnline ? '1' : '0.7';
    if (!isOnline) elements.messageInput.value = '';
}

export function renderMessages(history, currentUsername) {
    elements.messagesContainer.innerHTML = '';
    history.forEach(msg => {
        const type = msg.senderName === currentUsername ? 'sent' : 'received';
        const div = document.createElement('div');
        div.className = `message message-${type}`;
        div.innerHTML = `<div class="message-bubble"><p>${msg.text}</p></div>`;
        elements.messagesContainer.appendChild(div);
    });
    elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

export function createConversationItem(name, status, isActive, onClick) {
    const div = document.createElement('div');
    div.className = `conversation-item ${isActive ? 'active' : ''} ${status}-user`;
    const indicator = status === 'online' ? '<span class="online-indicator"></span>' : '<span class="offline-indicator">●</span>';
    
    div.innerHTML = `
        <div class="conversation-avatar">${name[0]}</div>
        <p>${name}</p>
        ${indicator}
    `;
    div.onclick = onClick;
    return div;
}