class ChatApp {
    constructor() {
        this.currentUser = null;
        this.messages = [];
        this.users = new Set();
        this.bindEvents();
        this.loadMessages();
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Send message
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            document.getElementById('loginError').textContent = 'Please enter a username';
            return;
        }

        this.currentUser = username;
        this.users.add(username);
        
        document.getElementById('currentUser').textContent = username;
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('chatScreen').classList.remove('hidden');
        
        this.updateOnlineUsers();
        this.addSystemMessage(`${username} joined the chat`);
    }

    handleLogout() {
        if (this.currentUser) {
            this.addSystemMessage(`${this.currentUser} left the chat`);
            this.users.delete(this.currentUser);
        }
        this.currentUser = null;
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('chatScreen').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content || !this.currentUser) return;

        const message = {
            id: Date.now(),
            username: this.currentUser,
            content: content,
            timestamp: new Date().toISOString()
        };

        this.messages.push(message);
        this.displayMessage(message);
        this.saveMessages();
        
        messageInput.value = '';
        this.scrollToBottom();
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageDiv = document.createElement('div');
        
        if (message.type === 'system') {
            messageDiv.className = 'system-message';
            messageDiv.textContent = message.content;
        } else {
            messageDiv.className = `message ${message.username === this.currentUser ? 'own' : 'other'}`;
            messageDiv.innerHTML = `
                <div class="message-header">${message.username}</div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
                <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
            `;
        }

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addSystemMessage(content) {
        const message = {
            id: Date.now(),
            content: content,
            timestamp: new Date().toISOString(),
            type: 'system'
        };
        this.messages.push(message);
        this.displayMessage(message);
        this.saveMessages();
    }

    updateOnlineUsers() {
        const onlineUsers = document.getElementById('onlineUsers');
        onlineUsers.innerHTML = '';
        this.users.forEach(username => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.textContent = username;
            onlineUsers.appendChild(userDiv);
        });
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveMessages() {
        localStorage.setItem('chatMessages', JSON.stringify({
            messages: this.messages,
            users: Array.from(this.users)
        }));
    }

    loadMessages() {
        const saved = localStorage.getItem('chatMessages');
        if (saved) {
            const data = JSON.parse(saved);
            this.messages = data.messages || [];
            this.users = new Set(data.users || []);
            this.messages.forEach(msg => this.displayMessage(msg));
        }
    }
}

// Initialize the chat app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});