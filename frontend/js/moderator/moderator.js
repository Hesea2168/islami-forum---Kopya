// js/moderator/moderator.js - Moderatör Yönetimi

const Moderator = {
    canModerate(category) {
        if (!AuthService.currentUser) return false;
        if (AuthService.currentUser.role === 'admin') return true;
        if (AuthService.currentUser.role === 'moderator') {
            return category.startsWith('SO') || category.startsWith('SA');
        }
        return false;
    },
    
    canDeleteUser(targetUser) {
        if (!AuthService.currentUser) return false;
        if (AuthService.currentUser.role === 'admin') {
            return targetUser.role !== 'admin' || targetUser.id !== AuthService.currentUser.id;
        }
        if (AuthService.currentUser.role === 'moderator') {
            return targetUser.role === 'member';
        }
        return false;
    },
    
    async deleteUserInCategory(username, category) {
        if (!this.canModerate(category)) {
            Toast.error('Bu kategoride moderasyon yetkiniz yok.');
            return;
        }
        
        const user = API.getUserByUsername(username);
        if (!user) return;
        
        if (!this.canDeleteUser(user)) {
            Toast.error('Bu üyeyi silme yetkiniz yok.');
            return;
        }
        
        const result = await Modal.confirm(
            'Üye Silme (Moderatör)',
            `<strong>${user.username}</strong> adlı üyeyi silmek istediğinizden emin misiniz?<br><br>
            <small style="color: #999;">Not: Moderatör olarak sadece normal üyeleri silebilirsiniz.</small>`,
            {
                choices: [
                    { value: 'keep', label: 'Üyenin tüm mesajlarını koru' },
                    { value: 'delete', label: 'Üyenin tüm mesajlarını sil' }
                ]
            }
        );
        
        if (!result) return;
        
        if (result === 'delete') {
            API.getTopics({ author: user.username }).forEach(topic => {
                API.updateTopic(topic.id, { deleted: true });
            });
            
            API.getReplies().filter(r => r.author === user.username).forEach(reply => {
                API.updateReply(reply.id, { deleted: true });
            });
        }
        
        API.deleteUser(user.id);
        
        const logAction = result === 'delete' 
            ? `${AuthService.currentUser.username} adlı moderatörünüz "${user.username}" adlı üyenin kaydını tüm mesajlarıyla birlikte sildi.`
            : `${AuthService.currentUser.username} adlı moderatörünüz "${user.username}" adlı üyenin kaydını sildi ancak mesajlara dokunmadı.`;
        
        API.addLog('mod_user_action', 'Moderasyon - Üye Silme', logAction, AuthService.currentUser.username, AuthService.currentUser.role);
        
        Toast.success('Üye silindi.');
        
        if (window.Widgets) {
            Widgets.updateYeniUyeler();
            Widgets.updateCokYazanlar();
        }
    },
    
    async muteUserInCategory(username, category) {
        if (!this.canModerate(category)) {
            Toast.error('Bu kategoride moderasyon yetkiniz yok.');
            return;
        }
        
        const user = API.getUserByUsername(username);
        if (!user) return;
        
        if (!this.canDeleteUser(user)) {
            Toast.error('Bu üyeyi susturma yetkiniz yok.');
            return;
        }
        
        const confirm = await Modal.confirm(
            'Üye Susturma',
            `${user.username} adlı üyeyi 1 hafta boyunca susturmak istediğinizden emin misiniz?`
        );
        
        if (confirm) {
            API.updateUser(user.id, { mutedUntil: Date.now() + (7 * 24 * 60 * 60 * 1000) });
            API.addLog('mod_user_action', 'Moderasyon - Susturma', `${AuthService.currentUser.username} adlı moderatörünüz "${user.username}" adlı üyeyi 1 hafta susturdu.`, AuthService.currentUser.username, AuthService.currentUser.role);
            Toast.success('Üye susturuldu.');
        }
    },
    
    showModeratorPanel(category) {
        if (!this.canModerate(category)) {
            Toast.error('Bu kategoride moderasyon yetkiniz yok.');
            return;
        }
        
        App.clearMiddleSection();
        const ortaAlan = document.getElementById('ortaAlan');
        
        const categoryName = Categories.categoryNames[category];
        const topics = API.getTopics({ category, excludeDeleted: true });
        
        ortaAlan.innerHTML = `
            <div class="admin-panel">
                <div class="admin-header">
                    <h1>Moderatör Paneli - ${categoryName}</h1>
                    <p>Bu kategorideki içerikleri yönetin</p>
                </div>
                
                <div class="permission-warning">
                    ⚠️ Moderatör olarak sadece SO ve SA kategorilerinde moderasyon yapabilirsiniz.
                    Admin, moderatör ve kendinize işlem yapamazsınız.
                </div>
                
                <div class="search-box">
                    <input type="text" id="modTopicSearch" placeholder="Konu başlığına göre ara...">
                </div>
                
                <div id="modTopicsList" class="topics-list"></div>
            </div>
        `;
        
        document.getElementById('modTopicSearch').addEventListener('input', (e) => {
            this.filterModeratorTopics(category, e.target.value);
        });
        
        this.displayModeratorTopics(category, topics);
    },
    
    filterModeratorTopics(category, query) {
        const filtered = API.getTopics({ category, excludeDeleted: true })
            .filter(t => t.title.toLowerCase().includes(query.toLowerCase()));
        this.displayModeratorTopics(category, filtered);
    },
    
    displayModeratorTopics(category, topics) {
        const topicsList = document.getElementById('modTopicsList');
        if (!topicsList) return;
        
        if (topics.length === 0) {
            topicsList.innerHTML = '<div class="empty-state"><p>Konu bulunamadı</p></div>';
            return;
        }
        
        topicsList.innerHTML = topics.map(topic => {
            const replyCount = API.getReplies(topic.id).length;
            const author = API.getUserByUsername(topic.author);
            const canDelete = Topics.canModerate(topic);
            const canDeleteAuthor = author ? this.canDeleteUser(author) : false;
            
            return `
                <div class="topic-card">
                    <div class="topic-card-header">
                        <div class="topic-info">
                            <h3>${topic.title}</h3>
                        </div>
                    </div>
                    
                    <div class="topic-stats">
                        <span>👤 ${topic.author}</span>
                        <span>💬 ${replyCount} yanıt</span>
                        <span>👁️ ${topic.views || 0} görüntülenme</span>
                        <span>📅 ${App.formatDate(topic.createdAt)}</span>
                    </div>
                    
                    <div class="topic-actions">
                        ${canDelete ? `
                            <button class="action-btn delete" onclick="Moderator.deleteTopic('${topic.id}', '${category}')">
                                Konuyu Sil
                            </button>
                        ` : ''}
                        ${canDeleteAuthor ? `
                            <button class="action-btn delete" onclick="Moderator.deleteUserInCategory('${topic.author}', '${category}')">
                                Yazarı Sil
                            </button>
                        ` : ''}
                        <button class="action-btn moderator" onclick="Topics.showTopic('${topic.id}')">
                            Görüntüle
                        </button>
                    </div>
                    
                    ${!canDelete && !canDeleteAuthor ? `
                        <p style="color: #999; font-size: 12px; margin-top: 10px;">
                            Bu içeriğe işlem yapma yetkiniz yok
                        </p>
                    ` : ''}
                </div>
            `;
        }).join('');
    },
    
    async deleteTopic(topicId, category) {
        if (!this.canModerate(category)) {
            Toast.error('Bu kategoride moderasyon yetkiniz yok.');
            return;
        }
        
        const topic = API.getTopicById(topicId);
        if (!topic) return;
        
        if (!Topics.canModerate(topic)) {
            Toast.error('Bu konuyu silme yetkiniz yok.');
            return;
        }
        
        const confirm = await Modal.confirm(
            'Konu Silme',
            `"${topic.title}" konusunu silmek istediğinizden emin misiniz?`
        );
        
        if (confirm) {
            API.updateTopic(topicId, { deleted: true });
            API.addLog('mod_topic_delete', 'Moderatör Konu Silme', `${AuthService.currentUser.username} adlı moderatörünüz "${topic.author}" adlı üyenin '${topic.title}' adlı konusunu sildi.`, AuthService.currentUser.username, AuthService.currentUser.role);
            
            Toast.success('Konu silindi.');
            Categories.showCategory(category);
            
            if (window.Widgets) {
                Widgets.updateYeniKonular();
                Widgets.updateHitKonular();
            }
        }
    }
};