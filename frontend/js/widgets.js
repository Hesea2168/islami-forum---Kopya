// js/widgets.js - Widget Yönetimi

const Widgets = {
    init() {
        // Tüm widget'ları güncelle
        this.updateAllWidgets();
        
        // 30 saniyede bir tüm widget'ları güncelle
        setInterval(() => {
            this.updateAllWidgets();
        }, 30000);
    },
    
    updateAllWidgets() {
        this.updateYeniUyeler();
        this.updateCokYazanlar();
        this.updateYeniKonular();
        this.updateHitKonular();
        this.updateZiyaretciSayisi();
        this.updateIcerdekiler();
    },
    
    async updateYeniUyeler() {
        const widget = document.getElementById('yeniUyeler');
        if (!widget) return;
        
        try {
            const users = await API.getUsers();
            const sortedUsers = users
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 25);
            
            if (sortedUsers.length === 0) {
                widget.innerHTML = `
                    <h3>Yeni Üyeler</h3>
                    <p style="color: #999; text-align: center; padding: 20px; font-size: 13px;">Henüz veri bulunmamaktadır</p>
                `;
                return;
            }
            
            widget.innerHTML = `
                <h3>Yeni Üyeler</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${sortedUsers.map(user => `
                        <div class="widget-username-link" data-username="${user.username}" style="
                            padding: 8px;
                            background: white;
                            border-radius: 4px;
                            font-size: 12px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            cursor: pointer;
                            transition: background 0.3s;
                        " onmouseenter="this.style.background='#f0f0f0'" onmouseleave="this.style.background='white'">
                            <span style="font-weight: 600; color: #333;">👤 ${user.username}</span>
                            <span style="color: #999; font-size: 11px;">${App.formatDate(user.createdAt)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            widget.querySelectorAll('.widget-username-link').forEach(link => {
                link.addEventListener('click', () => {
                    AuthLogic.handleProfileView(link.dataset.username);
                });
            });
        } catch (error) {
            console.error('Yeni Üyeler widget hatası:', error);
            widget.innerHTML = `
                <h3>Yeni Üyeler</h3>
                <p style="color: #f5576c; text-align: center; padding: 20px; font-size: 13px;">Veri yüklenirken hata oluştu</p>
            `;
        }
    },
    
    async updateCokYazanlar() {
        const widget = document.getElementById('cokYazanlar');
        if (!widget) return;
        
        try {
            const users = await API.getUsers();
            const userStatsPromises = users.map(async (user) => ({
                username: user.username,
                totalMessages: await API.getUserTopicCount(user.username) + await API.getUserReplyCount(user.username)
            }));
            
            const userStats = await Promise.all(userStatsPromises);
            const sortedStats = userStats
                .filter(u => u.totalMessages > 0)
                .sort((a, b) => b.totalMessages - a.totalMessages)
                .slice(0, 25);
            
            if (sortedStats.length === 0) {
                widget.innerHTML = `
                    <h3>Çok Yazanlar</h3>
                    <p style="color: #999; text-align: center; padding: 20px; font-size: 13px;">Henüz veri bulunmamaktadır</p>
                `;
                return;
            }
            
            widget.innerHTML = `
                <h3>Çok Yazanlar</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${sortedStats.map((user, index) => `
                        <div class="widget-username-link" data-username="${user.username}" style="
                            padding: 8px;
                            background: white;
                            border-radius: 4px;
                            font-size: 12px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            cursor: pointer;
                            transition: background 0.3s;
                        " onmouseenter="this.style.background='#f0f0f0'" onmouseleave="this.style.background='white'">
                            <span style="font-weight: 600; color: #333;">
                                ${index < 3 ? ['🥇', '🥈', '🥉'][index] : (index + 1) + '.'} ${user.username}
                            </span>
                            <span style="
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                padding: 3px 8px;
                                border-radius: 10px;
                                font-size: 11px;
                                font-weight: 600;
                            ">${user.totalMessages}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            
            widget.querySelectorAll('.widget-username-link').forEach(link => {
                link.addEventListener('click', () => {
                    AuthLogic.handleProfileView(link.dataset.username);
                });
            });
        } catch (error) {
            console.error('Çok Yazanlar widget hatası:', error);
            widget.innerHTML = `
                <h3>Çok Yazanlar</h3>
                <p style="color: #f5576c; text-align: center; padding: 20px; font-size: 13px;">Veri yüklenirken hata oluştu</p>
            `;
        }
    },
    
    async updateYeniKonular() {
        const widget = document.getElementById('yeniKonular');
        if (!widget) return;
        
        try {
            const topics = await API.getTopics({ excludeDeleted: true });
            const sortedTopics = topics
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 25);
            
            if (sortedTopics.length === 0) {
                widget.innerHTML = `
                    <h3>Yeni Konular</h3>
                    <p style="color: #999; text-align: center; padding: 20px; font-size: 13px;">Henüz veri bulunmamaktadır</p>
                `;
                return;
            }
            
            widget.innerHTML = `
                <h3>Yeni Konular</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${sortedTopics.map(topic => {
                        const categoryName = Categories.categoryNames[topic.category] || topic.category;
                        return `
                            <div style="
                                padding: 8px;
                                background: white;
                                border-radius: 4px;
                                font-size: 11px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            " 
                            onmouseenter="this.style.background='#f0f0f0'"
                            onmouseleave="this.style.background='white'"
                            onclick="Topics.showTopic('${topic.id}')">
                                <div style="font-weight: 600; color: #333; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${topic.title}
                                </div>
                                <div style="display: flex; justify-content: space-between; color: #999;">
                                    <span>${categoryName}</span>
                                    <span>${App.formatDate(topic.createdAt)}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Yeni Konular widget hatası:', error);
            widget.innerHTML = `
                <h3>Yeni Konular</h3>
                <p style="color: #f5576c; text-align: center; padding: 20px; font-size: 13px;">Veri yüklenirken hata oluştu</p>
            `;
        }
    },
    
    async updateHitKonular() {
        const widget = document.getElementById('hitKonular');
        if (!widget) return;
        
        try {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const topics = await API.getTopics({ excludeDeleted: true });
            const recentTopics = topics
                .filter(t => t.createdAt >= oneWeekAgo)
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, 25);
            
            if (recentTopics.length === 0) {
                widget.innerHTML = `
                    <h3>Hit Konular (Son 1 Hafta)</h3>
                    <p style="color: #999; text-align: center; padding: 20px; font-size: 13px;">Henüz veri bulunmamaktadır</p>
                `;
                return;
            }
            
            widget.innerHTML = `
                <h3>Hit Konular (Son 1 Hafta)</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${recentTopics.map((topic, index) => {
                        const categoryName = Categories.categoryNames[topic.category] || topic.category;
                        return `
                            <div style="
                                padding: 8px;
                                background: white;
                                border-radius: 4px;
                                font-size: 11px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            "
                            onmouseenter="this.style.background='#f0f0f0'"
                            onmouseleave="this.style.background='white'"
                            onclick="Topics.showTopic('${topic.id}')">
                                <div style="font-weight: 600; color: #333; margin-bottom: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${index < 3 ? ['🔥', '⭐', '💫'][index] : '•'} ${topic.title}
                                </div>
                                <div style="display: flex; justify-content: space-between; color: #999;">
                                    <span>${categoryName}</span>
                                    <span>👁️ ${topic.views || 0}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Hit Konular widget hatası:', error);
            widget.innerHTML = `
                <h3>Hit Konular (Son 1 Hafta)</h3>
                <p style="color: #f5576c; text-align: center; padding: 20px; font-size: 13px;">Veri yüklenirken hata oluştu</p>
            `;
        }
    },
    
    async updateZiyaretciSayisi() {
        const widget = document.getElementById('ziyaretciSayisi');
        if (!widget) return;
        
        try {
            const users = await API.getUsers();
            const totalUsers = users.length;
            const totalVisitors = API.getVisitors();
            
            widget.innerHTML = `
                <h3>Ziyaretçi Sayısı</h3>
                <div style="padding: 15px; text-align: center;">
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Kayıtlı Üyeler</div>
                        <div style="font-size: 24px; font-weight: 700; color: #667eea;">👥 ${totalUsers}</div>
                    </div>
                    <div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 5px;">Toplam Ziyaret</div>
                        <div style="font-size: 24px; font-weight: 700; color: #43e97b;">🌍 ${totalVisitors}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ziyaretçi Sayısı widget hatası:', error);
            widget.innerHTML = `
                <h3>Ziyaretçi Sayısı</h3>
                <p style="color: #f5576c; text-align: center; padding: 20px; font-size: 13px;">Veri yüklenirken hata oluştu</p>
            `;
        }
    },
    
    async updateIcerdekiler() {
        const widget = document.getElementById('icerdekiler');
        if (!widget) return;
        
        try {
            const stats = App.getActiveStats();
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            const users = await API.getUsers();
            const activeUsers = users.filter(u => u.lastActivity && u.lastActivity >= fiveMinutesAgo);
            
            widget.innerHTML = `
                <h3>İçerdekiler</h3>
                <div style="padding: 12px;">
                    <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                            <span style="color: #666;">👤 Üyeler:</span>
                            <span style="font-weight: 700; color: #667eea;">${stats.loggedIn}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 12px;">
                            <span style="color: #666;">👥 Ziyaretçiler:</span>
                            <span style="font-weight: 700; color: #43e97b;">${stats.guests}</span>
                        </div>
                    </div>
                    
                    ${activeUsers.length > 0 ? `
                        <div>
                            <div style="font-size: 11px; color: #666; margin-bottom: 8px; font-weight: 600;">Aktif Üyeler:</div>
                            <div style="display: flex; flex-direction: column; gap: 5px;">
                                ${activeUsers.slice(0, 10).map(u => {
                                    const isCurrentUser = AuthService.currentUser && u.username === AuthService.currentUser.username;
                                    return `
                                        <div class="${!isCurrentUser ? 'widget-username-link' : ''}" ${!isCurrentUser ? `data-username="${u.username}"` : ''} style="
                                            padding: 6px 10px;
                                            background: ${isCurrentUser ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                                            color: ${isCurrentUser ? 'white' : '#333'};
                                            border-radius: 4px;
                                            font-size: 11px;
                                            font-weight: ${isCurrentUser ? '600' : 'normal'};
                                            cursor: ${isCurrentUser ? 'default' : 'pointer'};
                                            transition: background 0.3s;
                                        " ${!isCurrentUser ? `onmouseenter="this.style.background='#f0f0f0'" onmouseleave="this.style.background='white'"` : ''}>
                                            ${isCurrentUser ? '✓' : '•'} ${u.username}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : '<p style="color: #999; text-align: center; font-size: 11px; margin-top: 10px;">Şu anda aktif üye yok</p>'}
                </div>
            `;
            
            widget.querySelectorAll('.widget-username-link').forEach(link => {
                link.addEventListener('click', () => {
                    AuthLogic.handleProfileView(link.dataset.username);
                });
            });
        } catch (error) {
            console.error('İçerdekiler widget hatası:', error);
            widget.innerHTML = `
                <h3>İçerdekiler</h3>
                <p style="color: #f5576c; text-align: center; padding: 20px; font-size: 13px;">Veri yüklenirken hata oluştu</p>
            `;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Widgets.init();
});