// js/admin/admin.js - Admin Panel Yönetimi

const Admin = {
    currentTab: 'users',
    
    init() {
        document.getElementById('adminPanelBtn')?.addEventListener('click', () => {
            this.showAdminPanel();
        });
    },
    
    showAdminPanel() {
        if (!AuthService.currentUser || AuthService.currentUser.role !== 'admin') {
            Toast.error('Bu sayfaya erişim yetkiniz yok.');
            return;
        }
        
        App.clearMiddleSection();
        const ortaAlan = document.getElementById('ortaAlan');
        
        ortaAlan.innerHTML = `
            <div class="admin-panel">
                <div class="admin-header">
                    <h1>Admin Paneli</h1>
                    <p>Site yönetim ve denetim merkezi</p>
                </div>
                
                <div class="admin-tabs">
                    <button class="admin-tab active" data-tab="users">Üyeler</button>
                    <button class="admin-tab" data-tab="topics">Konular</button>
                    <button class="admin-tab" data-tab="moderators">Yetkilendirme</button>
                    <button class="admin-tab" data-tab="member-logs">Üye Kayıtları</button>
                    <button class="admin-tab" data-tab="mod-logs">Moderatör Kayıtları</button>
                </div>
                
                <div id="adminTabContent"></div>
            </div>
        `;
        
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.tab;
                this.renderTabContent();
            });
        });
        
        this.renderTabContent();
    },
    
    renderTabContent() {
        const content = document.getElementById('adminTabContent');
        
        const tabs = {
            'users': () => this.renderUsersTab(content),
            'topics': () => this.renderTopicsTab(content),
            'moderators': () => this.renderModeratorsTab(content),
            'member-logs': () => this.renderMemberLogsTab(content),
            'mod-logs': () => this.renderModLogsTab(content)
        };
        
        tabs[this.currentTab]?.();
    },
    
    async renderUsersTab(content) {
        content.innerHTML = `
            <div class="search-box">
                <input type="text" id="userSearch" placeholder="Üye adına göre ara...">
            </div>
            <div id="usersList" class="users-list">Yükleniyor...</div>
        `;
        
        document.getElementById('userSearch').addEventListener('input', async (e) => {
            const users = await API.getUsers();
            this.displayUsers(users.filter(u => 
                u.username.toLowerCase().includes(e.target.value.toLowerCase())
            ));
        });
        
        await this.displayUsers();
    },
    
    async displayUsers(users = null) {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        try {
            if (!users) {
                users = await API.getUsers();
            }
            
            if (users.length === 0) {
                usersList.innerHTML = '<div class="empty-state"><p>Kullanıcı bulunamadı</p></div>';
                return;
            }
            
            const userCards = await Promise.all(users.map(async (user) => {
                const stats = await AuthLogic.getUserStats(user.username);
                const isMuted = user.mutedUntil && Date.now() < user.mutedUntil;
                const remainingDays = isMuted ? Math.ceil((user.mutedUntil - Date.now()) / 86400000) : 0;
                
                return `
                    <div class="user-card">
                        <div class="user-card-header">
                            <div class="user-info">
                                <h3>${user.username}</h3>
                                <span class="user-badge ${user.role}">${this.getRoleName(user.role)}</span>
                                ${isMuted ? `<span class="user-badge muted">Susturulmuş (${remainingDays} gün)</span>` : ''}
                            </div>
                        </div>
                        
                        <div class="user-stats">
                            <span>📝 Konular: ${stats.topicCount}</span>
                            <span>💬 Yanıtlar: ${stats.replyCount}</span>
                            <span>📊 Toplam: ${stats.totalMessages}</span>
                            <span>📅 ${App.formatDate(user.createdAt)}</span>
                        </div>
                        
                        <div class="user-actions">
                            ${user.role !== 'admin' ? `
                                <button class="action-btn delete" onclick="Admin.deleteUser('${user.id}')">Üyeyi Sil</button>
                                ${!isMuted ? `
                                    <button class="action-btn mute" onclick="Admin.muteUser('${user.id}')">1 Hafta Sustur</button>
                                ` : `
                                    <button class="action-btn moderator" onclick="Admin.unmuteUser('${user.id}')">Susturmayı Kaldır</button>
                                `}
                                ${user.role === 'member' ? `
                                    <button class="action-btn moderator" onclick="Admin.makeModerator('${user.id}')">Moderatör Yap</button>
                                ` : user.role === 'moderator' ? `
                                    <button class="action-btn moderator" onclick="Admin.removeModerator('${user.id}')">Moderatörlüğü Kaldır</button>
                                ` : ''}
                            ` : '<p style="color: #999; font-size: 13px;">Admin üyesine işlem yapılamaz</p>'}
                        </div>
                    </div>
                `;
            }));
            
            usersList.innerHTML = userCards.join('');
        } catch (error) {
            console.error('Kullanıcılar yüklenirken hata:', error);
            usersList.innerHTML = '<div class="empty-state"><p style="color: #f5576c;">Yükleme hatası</p></div>';
        }
    },
    
    async deleteUser(userId) {
        try {
            const users = await API.getUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            const result = await Modal.confirm(
                'Üye Silme',
                `<strong>${user.username}</strong> adlı üyeyi silmek istediğinizden emin misiniz?`,
                {
                    choices: [
                        { value: 'keep', label: 'Üyenin tüm mesajlarını koru' },
                        { value: 'delete', label: 'Üyenin tüm mesajlarını sil' }
                    ]
                }
            );
            
            if (!result) return;
            
            if (result === 'delete') {
                const topics = await API.getTopics({ author: user.username });
                for (const topic of topics) {
                    await API.updateTopic(topic.id, { deleted: true });
                }
                
                const replies = await API.getReplies();
                const userReplies = replies.filter(r => r.author === user.username);
                for (const reply of userReplies) {
                    await API.updateReply(reply.id, { deleted: true });
                }
            }
            
            await API.deleteUser(userId);
            await API.addLog('admin_action', 'Üye Silme', `${user.username} silindi (Mesajlar: ${result === 'delete' ? 'Silindi' : 'Korundu'})`, AuthService.currentUser.username, 'admin');
            
            Toast.success('Üye silindi.');
            this.renderTabContent();
            
            if (window.Widgets) {
                Widgets.updateYeniUyeler();
                Widgets.updateCokYazanlar();
            }
        } catch (error) {
            console.error('Üye silme hatası:', error);
            Toast.error('Üye silinemedi.');
        }
    },
    
    async muteUser(userId) {
        try {
            const users = await API.getUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            const confirm = await Modal.confirm('Susturma', `${user.username} adlı üyeyi 1 hafta boyunca susturmak istediğinizden emin misiniz?`);
            
            if (confirm) {
                await API.muteUser(userId, 10080); // 7 gün = 10080 dakika
                await API.addLog('admin_action', 'Susturma', `${user.username} 1 hafta susturuldu`, AuthService.currentUser.username, 'admin');
                Toast.success('Üye susturuldu.');
                this.renderTabContent();
            }
        } catch (error) {
            console.error('Susturma hatası:', error);
            Toast.error('İşlem başarısız.');
        }
    },
    
    async unmuteUser(userId) {
        try {
            const users = await API.getUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            const confirm = await Modal.confirm('Susturma Kaldırma', `${user.username} adlı üyenin susturmasını kaldırmak istediğinizden emin misiniz?`);
            
            if (confirm) {
                await API.unmuteUser(userId);
                await API.addLog('admin_action', 'Susturma Kaldırma', `${user.username} susturması kaldırıldı`, AuthService.currentUser.username, 'admin');
                Toast.success('Susturma kaldırıldı.');
                this.renderTabContent();
            }
        } catch (error) {
            console.error('Susturma kaldırma hatası:', error);
            Toast.error('İşlem başarısız.');
        }
    },
    
    async makeModerator(userId) {
        try {
            const users = await API.getUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            const confirm = await Modal.confirm('Moderatör Yetkisi', `${user.username} adlı üyeye moderatör yetkisi vermek istediğinizden emin misiniz?`);
            
            if (confirm) {
                await API.promoteToModerator(userId);
                await API.addLog('admin_action', 'Moderatör Yetkisi', `${user.username} moderatör yapıldı`, AuthService.currentUser.username, 'admin');
                Toast.success('Moderatör yetkisi verildi.');
                this.renderTabContent();
            }
        } catch (error) {
            console.error('Moderatör yapma hatası:', error);
            Toast.error('İşlem başarısız.');
        }
    },
    
    async removeModerator(userId) {
        try {
            const users = await API.getUsers();
            const user = users.find(u => u.id === userId);
            if (!user) return;
            
            const confirm = await Modal.confirm('Moderatör Yetkisi Kaldırma', `${user.username} adlı üyenin moderatör yetkisini kaldırmak istediğinizden emin misiniz?`);
            
            if (confirm) {
                await API.demoteFromModerator(userId);
                await API.addLog('admin_action', 'Moderatör Yetkisi Kaldırma', `${user.username} moderatörlüğü kaldırıldı`, AuthService.currentUser.username, 'admin');
                Toast.success('Moderatör yetkisi kaldırıldı.');
                this.renderTabContent();
            }
        } catch (error) {
            console.error('Moderatör kaldırma hatası:', error);
            Toast.error('İşlem başarısız.');
        }
    },
    
    async renderTopicsTab(content) {
        content.innerHTML = `
            <div class="search-box">
                <input type="text" id="topicSearch" placeholder="Konu başlığına göre ara...">
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="action-btn delete" onclick="Admin.deleteEmptyTopics()">Boş Konuları Sil</button>
                <button class="action-btn delete" onclick="Admin.deleteNoReplyTopics()">Yanıtsız Konuları Sil</button>
            </div>
            <div id="topicsList" class="topics-list">Yükleniyor...</div>
        `;
        
        document.getElementById('topicSearch').addEventListener('input', async (e) => {
            const topics = await API.getTopics({ excludeDeleted: true });
            this.displayTopics(topics.filter(t => 
                t.title.toLowerCase().includes(e.target.value.toLowerCase())
            ));
        });
        
        await this.displayTopics();
    },
    
    async displayTopics(topics = null) {
        const topicsList = document.getElementById('topicsList');
        if (!topicsList) return;
        
        try {
            if (!topics) {
                topics = await API.getTopics({ excludeDeleted: true });
            }
            
            if (topics.length === 0) {
                topicsList.innerHTML = '<div class="empty-state"><p>Konu bulunamadı</p></div>';
                return;
            }
            
            const topicCards = await Promise.all(topics.map(async (topic) => {
                const replies = await API.getReplies(topic.id);
                const replyCount = replies.filter(r => !r.deleted).length;
                const categoryName = Categories.categoryNames[topic.category] || topic.category;
                
                return `
                    <div class="topic-card">
                        <div class="topic-card-header">
                            <div class="topic-info">
                                <h3>${topic.title}</h3>
                            </div>
                        </div>
                        
                        <div class="topic-stats">
                            <span>📁 ${categoryName}</span>
                            <span>👤 ${topic.author}</span>
                            <span>💬 ${replyCount} yanıt</span>
                            <span>👁️ ${topic.views || 0} görüntülenme</span>
                            <span>📅 ${App.formatDate(topic.createdAt)}</span>
                        </div>
                        
                        <div class="topic-actions">
                            <button class="action-btn delete" onclick="Admin.deleteTopic('${topic.id}')">Konuyu Sil</button>
                            <button class="action-btn moderator" onclick="Topics.showTopic('${topic.id}')">Görüntüle</button>
                        </div>
                    </div>
                `;
            }));
            
            topicsList.innerHTML = topicCards.join('');
        } catch (error) {
            console.error('Konular yüklenirken hata:', error);
            topicsList.innerHTML = '<div class="empty-state"><p style="color: #f5576c;">Yükleme hatası</p></div>';
        }
    },
    
    async deleteTopic(topicId) {
        try {
            const topic = await API.getTopicById(topicId);
            if (!topic) return;
            
            const confirm = await Modal.confirm('Konu Silme', `"${topic.title}" konusunu silmek istediğinizden emin misiniz?`);
            
            if (confirm) {
                await API.updateTopic(topicId, { deleted: true });
                await API.addLog('admin_action', 'Konu Silme', `"${topic.title}" konusu silindi`, AuthService.currentUser.username, 'admin');
                Toast.success('Konu silindi.');
                this.renderTabContent();
                
                if (window.Widgets) {
                    Widgets.updateYeniKonular();
                    Widgets.updateHitKonular();
                }
            }
        } catch (error) {
            console.error('Konu silme hatası:', error);
            Toast.error('Konu silinemedi.');
        }
    },
    
    async deleteEmptyTopics() {
        const confirm = await Modal.confirm('Toplu Silme', 'İçeriği boş olan tüm konuları silmek istediğinizden emin misiniz?');
        
        if (confirm) {
            try {
                const topics = await API.getTopics({ excludeDeleted: true });
                let count = 0;
                
                for (const topic of topics) {
                    if (!topic.content || topic.content.trim() === '' || topic.content === '<br>') {
                        await API.updateTopic(topic.id, { deleted: true });
                        count++;
                    }
                }
                
                await API.addLog('admin_action', 'Toplu Konu Silme', `${count} adet boş konu silindi`, AuthService.currentUser.username, 'admin');
                Toast.success(`${count} adet boş konu silindi.`);
                this.renderTabContent();
            } catch (error) {
                console.error('Toplu silme hatası:', error);
                Toast.error('İşlem başarısız.');
            }
        }
    },
    
    async deleteNoReplyTopics() {
        const confirm = await Modal.confirm('Toplu Silme', 'Yanıtı olmayan tüm konuları silmek istediğinizden emin misiniz?');
        
        if (confirm) {
            try {
                const topics = await API.getTopics({ excludeDeleted: true });
                let count = 0;
                
                for (const topic of topics) {
                    const replies = await API.getReplies(topic.id);
                    if (replies.filter(r => !r.deleted).length === 0) {
                        await API.updateTopic(topic.id, { deleted: true });
                        count++;
                    }
                }
                
                await API.addLog('admin_action', 'Toplu Konu Silme', `${count} adet yanıtsız konu silindi`, AuthService.currentUser.username, 'admin');
                Toast.success(`${count} adet yanıtsız konu silindi.`);
                this.renderTabContent();
            } catch (error) {
                console.error('Toplu silme hatası:', error);
                Toast.error('İşlem başarısız.');
            }
        }
    },
    
    async renderModeratorsTab(content) {
        try {
            const users = await API.getUsers();
            const moderators = users.filter(u => u.role === 'moderator');
            
            const moderatorCards = await Promise.all(moderators.map(async (mod) => {
                const stats = await AuthLogic.getUserStats(mod.username);
                return `
                    <div class="user-card">
                        <div class="user-card-header">
                            <div class="user-info">
                                <h3>${mod.username}</h3>
                                <span class="user-badge moderator">Moderatör</span>
                            </div>
                        </div>
                        <div class="user-stats">
                            <span>📝 Konular: ${stats.topicCount}</span>
                            <span>💬 Yanıtlar: ${stats.replyCount}</span>
                            <span>📅 ${App.formatDate(mod.createdAt)}</span>
                        </div>
                        <div class="user-actions">
                            <button class="action-btn delete" onclick="Admin.removeModerator('${mod.id}')">
                                Moderatörlüğü Kaldır
                            </button>
                        </div>
                    </div>
                `;
            }));
            
            content.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #667eea;">Moderatör Yönetimi</h3>
                
                <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="color: #856404; margin-bottom: 10px;">Moderatör Yetkileri:</h4>
                    <ul style="color: #856404; line-height: 1.8; padding-left: 20px;">
                        <li>SO (Sol) ve SA (Sağ) bölümlerinde mesaj ve konu silebilir</li>
                        <li>SO ve SA bölümlerinde normal üyeleri silebilir</li>
                        <li>Adminlere ve diğer moderatörlere işlem yapamaz</li>
                    </ul>
                </div>
                
                <div class="users-list">
                    ${moderatorCards.length > 0 ? moderatorCards.join('') : '<div class="empty-state"><p>Henüz moderatör yok</p></div>'}
                </div>
            `;
        } catch (error) {
            console.error('Moderatörler yüklenirken hata:', error);
            content.innerHTML = '<div class="empty-state"><p style="color: #f5576c;">Yükleme hatası</p></div>';
        }
    },
    
    renderMemberLogsTab(content) {
        content.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #667eea;">Üye Kayıtları</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="action-btn moderator" onclick="Admin.showLogs('member_login')">Giriş / Çıkış</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('member_topic_create')">Açtığı Konular</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('member_reply_create')">Verdiği Yanıtlar</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('member_profile_view')">Baktığı Profiller</button>
            </div>
            <div id="logsContent"></div>
        `;
    },
    
    renderModLogsTab(content) {
        content.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #667eea;">Moderatör Kayıtları</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_login')">Giriş / Çıkış</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_topic_create')">Açtığı Konular</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_reply_create')">Verdiği Yanıtlar</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_profile_view')">Baktığı Profiller</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_user_action')">Üye İşlemleri</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_topic_delete')">Konu İşlemleri</button>
                <button class="action-btn moderator" onclick="Admin.showLogs('mod_reply_delete')">Yanıt İşlemleri</button>
            </div>
            <div id="logsContent"></div>
        `;
    },
    
    async showLogs(type) {
        const container = document.getElementById('logsContent');
        if (!container) return;
        
        container.innerHTML = 'Yükleniyor...';
        
        try {
            let logs = [];
            if (type === 'member_login' || type === 'mod_login') {
                const logoutType = type.replace('login', 'logout');
                const allLogs = await API.getLogs();
                logs = allLogs.filter(l => l.type === type || l.type === logoutType);
            } else if (type === 'mod_user_action') {
                const allLogs = await API.getLogs();
                logs = allLogs.filter(l => l.action && l.action.includes('Moderasyon - Üye'));
            } else {
                logs = await API.getLogs({ type });
            }
            
            logs = logs.slice(0, 100);
            
            if (logs.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Henüz kayıt yok</p></div>';
                return;
            }
            
            container.innerHTML = `
                <div class="logs-list">
                    ${logs.map(log => `
                        <div class="log-card">
                            <div class="log-header">
                                <span class="log-action">${log.action}</span>
                                <span class="log-time">${App.formatDate(log.timestamp)}</span>
                            </div>
                            <div class="log-details">${log.details}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Log yükleme hatası:', error);
            container.innerHTML = '<div class="empty-state"><p style="color: #f5576c;">Yükleme hatası</p></div>';
        }
    },
    
    getRoleName(role) {
        return { admin: 'Admin', moderator: 'Moderatör', member: 'Üye' }[role] || 'Üye';
    }
};