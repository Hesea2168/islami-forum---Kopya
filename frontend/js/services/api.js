// js/services/api.js - Backend API Servisleri

const API_BASE_URL = window.location.origin + '/api';

const API = {
    token: null,
    currentUser: null,

    init() {
        this.token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('current_user');
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
            } catch (e) {
                this.currentUser = null;
            }
        }
    },

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    },

    clearToken() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
    },

    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
    },

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Bir hata oluştu');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth metodları
    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: { username, email, password }
        });
        
        if (data.token) {
            this.setToken(data.token);
            this.setCurrentUser(data.user);
        }
        
        return data;
    },

    async login(username, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: { username, password }
        });
        
        if (data.token) {
            this.setToken(data.token);
            this.setCurrentUser(data.user);
        }
        
        return data;
    },

    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error:', e);
        } finally {
            this.clearToken();
        }
    },

    async verifyToken() {
        try {
            const data = await this.request('/auth/verify');
            if (data.valid && data.user) {
                this.setCurrentUser(data.user);
                return data.user;
            }
        } catch (e) {
            this.clearToken();
        }
        return null;
    },

    // User metodları
    async getUsers(page = 1, limit = 1000, role = null) {
        const params = new URLSearchParams({ page, limit });
        if (role) params.append('role', role);
        const data = await this.request(`/users?${params}`);
        return data.users || [];
    },

    async getUserById(userId) {
        const data = await this.request(`/users/${userId}`);
        return data.user;
    },

    async getUserByUsername(username) {
        const users = await this.getUsers();
        return users.find(u => u.username === username);
    },

    async updateUser(userId, updates) {
        return await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: updates
        });
    },

    async deleteUser(userId) {
        return await this.request(`/users/${userId}`, {
            method: 'DELETE'
        });
    },

    async getUserTopics(userId, page = 1, limit = 1000) {
        const data = await this.request(`/users/${userId}/topics?page=${page}&limit=${limit}`);
        return data.topics || [];
    },

    async getUserReplies(userId, page = 1, limit = 1000) {
        const data = await this.request(`/users/${userId}/replies?page=${page}&limit=${limit}`);
        return data.replies || [];
    },

    async getUserStats(userId) {
        const data = await this.request(`/users/${userId}/stats`);
        return data.stats;
    },

    async getRecentUsers(limit = 25) {
        const data = await this.request(`/users/recent/list?limit=${limit}`);
        return data.users || [];
    },

    async getUserTopicCount(username) {
        const users = await this.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return 0;
        const topics = await this.getUserTopics(user.id);
        return topics.filter(t => !t.deleted).length;
    },

    async getUserReplyCount(username) {
        const users = await this.getUsers();
        const user = users.find(u => u.username === username);
        if (!user) return 0;
        const replies = await this.getUserReplies(user.id);
        return replies.filter(r => !r.deleted).length;
    },

    // Topic metodları
    async getTopics(filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 1000;
        const params = new URLSearchParams({ page, limit });
        
        if (filters.category) params.append('category', filters.category);
        if (filters.author) {
            // author username'den user_id'ye dönüştür
            const users = await this.getUsers();
            const user = users.find(u => u.username === filters.author);
            if (user) params.append('author_id', user.id);
        }
        
        const data = await this.request(`/topics?${params}`);
        let topics = data.topics || [];
        
        if (filters.excludeDeleted) {
            topics = topics.filter(t => !t.deleted);
        }
        
        return topics;
    },

    async getTopicById(topicId) {
        const data = await this.request(`/topics/${topicId}`);
        return data.topic;
    },

    async addTopic(topicData) {
        return await this.request('/topics', {
            method: 'POST',
            body: {
                title: topicData.title,
                content: topicData.content,
                category: topicData.category
            }
        });
    },

    async updateTopic(topicId, updates) {
        return await this.request(`/topics/${topicId}`, {
            method: 'PUT',
            body: updates
        });
    },

    async deleteTopic(topicId) {
        return await this.request(`/topics/${topicId}`, {
            method: 'DELETE'
        });
    },

    async togglePinTopic(topicId) {
        return await this.request(`/topics/${topicId}/pin`, {
            method: 'PATCH'
        });
    },

    async toggleLockTopic(topicId) {
        return await this.request(`/topics/${topicId}/lock`, {
            method: 'PATCH'
        });
    },

    async getHotTopics(limit = 25) {
        const data = await this.request(`/topics/hot?limit=${limit}`);
        return data.topics || [];
    },

    async getRecentTopics(limit = 25) {
        const data = await this.request(`/topics/recent?limit=${limit}`);
        return data.topics || [];
    },

    async searchTopics(query, page = 1, limit = 20) {
        const data = await this.request(`/topics/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
        return data.topics || [];
    },

    // Reply metodları
    async getReplies(topicId, page = 1, limit = 1000) {
        const data = await this.request(`/replies/topic/${topicId}?page=${page}&limit=${limit}`);
        return data.replies || [];
    },

    async getReplyById(replyId) {
        const data = await this.request(`/replies/${replyId}`);
        return data.reply;
    },

    async addReply(replyData) {
        return await this.request(`/replies/topic/${replyData.topicId}`, {
            method: 'POST',
            body: { content: replyData.content }
        });
    },

    async updateReply(replyId, updates) {
        return await this.request(`/replies/${replyId}`, {
            method: 'PUT',
            body: updates
        });
    },

    async deleteReply(replyId) {
        return await this.request(`/replies/${replyId}`, {
            method: 'DELETE'
        });
    },

    async getRecentReplies(limit = 10) {
        const data = await this.request(`/replies/recent/list?limit=${limit}`);
        return data.replies || [];
    },

    // Admin metodları
    async getLogs(filters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 100;
        const params = new URLSearchParams({ page, limit });
        
        if (filters.type) params.append('action', filters.type);
        if (filters.action) params.append('action', filters.action);
        if (filters.admin_id) params.append('admin_id', filters.admin_id);
        
        const data = await this.request(`/admin/logs?${params}`);
        return data.logs || [];
    },

    async addLog(type, action, details, username, role) {
        // Log'ları backend'e gönder
        try {
            await this.request('/admin/logs', {
                method: 'POST',
                body: { type, action, details, username, role }
            });
        } catch (error) {
            console.error('Log kaydetme hatası:', error);
        }
    },

    async getStats() {
        const data = await this.request('/admin/stats');
        return data.stats;
    },

    async muteUser(userId, minutes = 10080) {
        return await this.request(`/admin/users/${userId}/mute`, {
            method: 'POST',
            body: { duration: minutes }
        });
    },

    async unmuteUser(userId) {
        return await this.request(`/admin/users/${userId}/unmute`, {
            method: 'POST'
        });
    },

    async banUser(userId) {
        return await this.request(`/admin/users/${userId}/ban`, {
            method: 'POST'
        });
    },

    async unbanUser(userId) {
        return await this.request(`/admin/users/${userId}/unban`, {
            method: 'POST'
        });
    },

    async promoteToModerator(userId) {
        return await this.request(`/admin/users/${userId}/promote`, {
            method: 'POST'
        });
    },

    async demoteFromModerator(userId) {
        return await this.request(`/admin/users/${userId}/demote`, {
            method: 'POST'
        });
    },

    async adminDeleteTopic(topicId) {
        return await this.request(`/admin/topics/${topicId}`, {
            method: 'DELETE'
        });
    },

    async adminDeleteReply(replyId) {
        return await this.request(`/admin/replies/${replyId}`, {
            method: 'DELETE'
        });
    },

    async createBackup() {
        return await this.request('/admin/backup', {
            method: 'POST'
        });
    },

    async getBackups() {
        const data = await this.request('/admin/backups');
        return data.backups || [];
    },

    async restoreBackup(filename) {
        return await this.request(`/admin/restore/${filename}`, {
            method: 'POST'
        });
    },

    // Activity metodları
    async addActivity(username, role, type, details) {
        try {
            await this.request('/activities', {
                method: 'POST',
                body: { username, role, type, details }
            });
        } catch (error) {
            console.error('Aktivite kaydetme hatası:', error);
        }
    },

    async updateActivity(activityId, duration) {
        try {
            await this.request(`/activities/${activityId}`, {
                method: 'PUT',
                body: { duration }
            });
        } catch (error) {
            console.error('Aktivite güncelleme hatası:', error);
        }
    },

    // Ziyaretçi takibi (localStorage ile)
    incrementVisitors() {
        let visitors = parseInt(localStorage.getItem('total_visitors') || '0');
        visitors++;
        localStorage.setItem('total_visitors', visitors.toString());
    },

    getVisitors() {
        return parseInt(localStorage.getItem('total_visitors') || '0');
    },

    // Helper metodları
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    },

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    },

    isModerator() {
        return this.currentUser && (this.currentUser.role === 'moderator' || this.currentUser.role === 'admin');
    },

    getCurrentUser() {
        return this.currentUser;
    },

    isMuted() {
        if (!this.currentUser) return false;
        const now = Math.floor(Date.now() / 1000);
        return this.currentUser.muted_until > now;
    },

    getMutedTimeRemaining() {
        if (!this.isMuted()) return 0;
        const now = Math.floor(Date.now() / 1000);
        return Math.ceil((this.currentUser.muted_until - now) / 60); // minutes
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

// Initialize on load
API.init();