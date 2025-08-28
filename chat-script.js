// Chat App JavaScript
class ChatApp {
    constructor() {
        this.currentUser = null;
        this.currentChat = { id: 'general', type: 'group' };
        this.universalPassword = 'chat2024'; // Universal password for all users
        this.users = new Set();
        this.messages = {};
        this.directMessages = {};
        
        this.initializeApp();
        this.bindEvents();
        this.loadData();
    }

    initializeApp() {
        // Initialize default group chats
        this.messages = {
            general: [],
            random: [],
            gaming: []
        };
        
        // Load existing data from localStorage
        this.loadData();
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

        // Message sending
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Chat switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chat-item')) {
                const chatItem = e.target.closest('.chat-item');
                const chatId = chatItem.dataset.chatId;
                const chatType = chatItem.dataset.chatType;
                this.switchChat(chatId, chatType);
            }
            
            if (e.target.closest('.user-item')) {
                const userItem = e.target.closest('.user-item');
                const username = userItem.dataset.username;
                this.startDirectMessage(username);
            }
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (!username) {
            errorDiv.textContent = 'Please enter a username';
            return;
        }

        if (password !== this.universalPassword) {
            errorDiv.textContent = 'Invalid password';
            return;
        }

        // Successful login
        this.currentUser = username;
        this.users.add(username);
        this.saveData();
        
        document.getElementById('currentUser').textContent = username;
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('chatScreen').classList.remove('hidden');
        
        this.updateOnlineUsers();
        this.loadChat('general', 'group');
        
        // Add welcome message
        this.addSystemMessage('general', `${username} joined the chat`);
    }

    handleLogout() {
        if (this.currentUser) {
            this.addSystemMessage(this.currentChat.id, `${this.currentUser} left the chat`);
        }
        
        this.currentUser = null;
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('chatScreen').classList.add('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('loginError').textContent = '';
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const content = messageInput.value.trim();
        
        if (!content || !this.currentUser) return;

        const message = {
            id: Date.now(),
            username: this.currentUser,
            content: content,
            timestamp: new Date().toISOString(),
            type: 'user'
        };

        if (this.currentChat.type === 'group') {
            if (!this.messages[this.currentChat.id]) {
                this.messages[this.currentChat.id] = [];
            }
            this.messages[this.currentChat.id].push(message);
        } else {
            // Direct message
            const dmKey = this.getDMKey(this.currentUser, this.currentChat.id);
            if (!this.directMessages[dmKey]) {
                this.directMessages[dmKey] = [];
            }
            this.directMessages[dmKey].push(message);
        }

        this.saveData();
        this.displayMessage(message);
        messageInput.value = '';
        this.scrollToBottom();
    }

    switchChat(chatId, chatType) {
        // Remove active class from all chat items
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to selected chat
        const selectedChat = document.querySelector(`[data-chat-id="${chatId}"][data-chat-type="${chatType}"]`);
        if (selectedChat) {
            selectedChat.classList.add('active');
        }

        this.currentChat = { id: chatId, type: chatType };
        this.loadChat(chatId, chatType);
    }

    loadChat(chatId, chatType) {
        const chatTitle = document.getElementById('chatTitle');
        const chatTypeSpan = document.getElementById('chatType');
        const messagesContainer = document.getElementById('messagesContainer');

        // Update header
        if (chatType === 'group') {
            chatTitle.textContent = chatId.charAt(0).toUpperCase() + chatId.slice(1);
            chatTypeSpan.textContent = 'Group Chat';
        } else {
            chatTitle.textContent = chatId;
            chatTypeSpan.textContent = 'Direct Message';
        }

        // Clear messages
        messagesContainer.innerHTML = '';

        // Load messages
        let messages = [];
        if (chatType === 'group') {
            messages = this.messages[chatId] || [];
        } else {
            const dmKey = this.getDMKey(this.currentUser, chatId);
            messages = this.directMessages[dmKey] || [];
        }

        messages.forEach(message => {
            this.displayMessage(message);
        });

        this.scrollToBottom();
    }

    displayMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        
        if (message.type === 'system') {
            const systemDiv = document.createElement('div');
            systemDiv.className = 'system-message';
            systemDiv.textContent = message.content;
            messagesContainer.appendChild(systemDiv);
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.username === this.currentUser ? 'own' : 'other'}`;

        const time = new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageDiv.innerHTML = `
            <div class="message-header">${message.username}</div>
            <div class="message-content">${this.escapeHtml(message.content)}</div>
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageDiv);
    }

    addSystemMessage(chatId, content) {
        const message = {
            id: Date.now(),
            content: content,
            timestamp: new Date().toISOString(),
            type: 'system'
        };

        if (!this.messages[chatId]) {
            this.messages[chatId] = [];
        }
        this.messages[chatId].push(message);
        
        // Display if current chat
        if (this.currentChat.id === chatId && this.currentChat.type === 'group') {
            this.displayMessage(message);
            this.scrollToBottom();
        }
        
        this.saveData();
    }

    startDirectMessage(username) {
        if (username === this.currentUser) return;

        const dmKey = this.getDMKey(this.currentUser, username);
        
        // Check if DM already exists in sidebar
        let dmItem = document.querySelector(`[data-chat-id="${username}"][data-chat-type="dm"]`);
        
        if (!dmItem) {
            // Create new DM item
            const directMessages = document.getElementById('directMessages');
            dmItem = document.createElement('div');
            dmItem.className = 'chat-item';
            dmItem.dataset.chatId = username;
            dmItem.dataset.chatType = 'dm';
            dmItem.innerHTML = `
                <span class="chat-name">${username}</span>
                <span class="unread-count hidden">0</span>
            `;
            directMessages.appendChild(dmItem);
        }

        this.switchChat(username, 'dm');
    }

    updateOnlineUsers() {
        const onlineUsers = document.getElementById('onlineUsers');
        onlineUsers.innerHTML = '';

        this.users.forEach(username => {
            if (username !== this.currentUser) {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.dataset.username = username;
                userDiv.textContent = username;
                onlineUsers.appendChild(userDiv);
            }
        });
    }

    getDMKey(user1, user2) {
        return [user1, user2].sort().join('_');
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

    saveData() {
        const data = {
            users: Array.from(this.users),
            messages: this.messages,
            directMessages: this.directMessages
        };
        localStorage.setItem('chatAppData', JSON.stringify(data));
    }

    loadData() {
        const savedData = localStorage.getItem('chatAppData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.users = new Set(data.users || []);
                this.messages = data.messages || { general: [], random: [], gaming: [] };
                this.directMessages = data.directMessages || {};
            } catch (e) {
                console.error('Error loading saved data:', e);
                this.initializeApp();
            }
        }
    }

    // Simulate other users for demo purposes
    simulateActivity() {
        const demoUsers = ['Alice', 'Bob', 'Charlie', 'Diana'];
        const demoMessages = [
            'Hello everyone!',
            'How is everyone doing?',
            'Anyone want to play a game?',
            'Great weather today!',
            'What are you all up to?',
            'Check out this cool website I found',
            'Anyone here good at coding?',
            'Love this chat app!'
        ];

        // Add demo users
        demoUsers.forEach(user => this.users.add(user));
        
        // Add some demo messages to different channels
        const channels = ['general', 'random', 'gaming'];
        channels.forEach(channel => {
            if (!this.messages[channel]) this.messages[channel] = [];
            
            // Add a few demo messages
            for (let i = 0; i < 3; i++) {
                const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
                const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];
                
                this.messages[channel].push({
                    id: Date.now() + Math.random(),
                    username: randomUser,
                    content: randomMessage,
                    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                    type: 'user'
                });
            }
        });

        this.saveData();
        this.updateOnlineUsers();
    }
}

// Initialize the chat app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const chatApp = new ChatApp();
    
    // Add some demo content on first load
    if (!localStorage.getItem('chatAppData')) {
        chatApp.simulateActivity();
    }
});
