// js/utils/storage.js - LocalStorage Yönetimi

const Storage = {
    keys: {
        USERS: 'forumUsers',
        TOPICS: 'forumTopics',
        REPLIES: 'forumReplies',
        LOGS: 'forumLogs',
        ACTIVITIES: 'forumUserActivities',
        VISITORS: 'forumVisitors',
        CURRENT_USER: 'currentUser'
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage get error:', e);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage remove error:', e);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage clear error:', e);
            return false;
        }
    }
};