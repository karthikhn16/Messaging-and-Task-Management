document.addEventListener('DOMContentLoaded', () => {
    const socket = io({
        query: {
            userId:  currentUser 
        }
    });

    const recipientSelect = document.getElementById('recipientSelect');
    const messageList = document.getElementById('messageList');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');

    messageForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const message = messageInput.value;
        const recipient = recipientSelect.value;
        if (message.trim() !== '') {
            socket.emit('message', { message, recipient });
            messageInput.value = '';
        }
    });

    socket.on('message', (data) => {
        const { message, sender, recipient } = data;
        if (recipient === 'all' || recipient === '<%= currentUser %>') {
            const messageItem = document.createElement('div');
            messageItem.textContent = `${sender}: ${message}`;
            messageList.appendChild(messageItem);
        }
    });
});
