const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const messagesContainer = document.getElementById('messages-container');


messageForm.addEventListener('submit', (event) => {
    event.preventDefault(); // I don't want to refresh the page at every message sent
    
    const messageText = messageInput.value.trim();
    if (messageText === '') return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'message-sent');
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('message-bubble');
    
    const paragraphElement = document.createElement('p');
    paragraphElement.textContent = messageText;
    
    bubbleDiv.appendChild(paragraphElement);
    messageDiv.appendChild(bubbleDiv);
    messagesContainer.appendChild(messageDiv);
    
    messageInput.value = '';
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
