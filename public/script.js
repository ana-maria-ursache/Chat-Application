const socket = io("http://localhost:4000");

const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');
const emptyState = document.getElementById('empty-state');

function addMessageToUI(text, type) {    
    if (emptyState) {
        emptyState.remove();
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

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    
    if (text !== '') {
        socket.emit("send_message", { text: text, senderId: socket.id });
        messageInput.value = '';
    }
});

socket.on("receive_message", (data) => {
    const type = data.senderId === socket.id ? 'sent' : 'received';
    addMessageToUI(data.text, type);
});