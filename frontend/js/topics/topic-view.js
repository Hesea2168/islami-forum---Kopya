// js/topics/topic-view.js - Konu Görüntüleme Modülü

const TopicView = {
    repliesPerPage: 25,
    currentPage: 1,
    
    async showTopic(topicId, page = 1) {
        try {
            const topic = await API.getTopicById(topicId);
            if (!topic || topic.deleted) {
                Toast.error('Konu bulunamadı.');
                return;
            }
            
            await API.updateTopic(topicId, { views: (topic.views || 0) + 1 });
            
            if (AuthService.currentUser) {
                App.startTopicView(topicId, topic.title, topic.category);
            }
            
            this.currentPage = page;
            App.clearMiddleSection();
            const ortaAlan = document.getElementById('ortaAlan');
            
            await this.renderTopicHeader(ortaAlan, topic);
            await this.renderTopicContent(ortaAlan, topic);
            await this.renderReplies(ortaAlan, topic, page);
            
            if (AuthService.currentUser) {
                TopicReply.renderReplyForm(ortaAlan, topicId, topic);
            }
        } catch (error) {
            console.error('Konu görüntüleme hatası:', error);
            Toast.error('Konu yüklenirken hata oluştu.');
        }
    },
    
    renderTopicHeader(container, topic) {
        const header = document.createElement('div');
        header.style.cssText = `
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
        `;
        
        header.innerHTML = `
            <button id="backBtn" style="
                padding: 8px 16px;
                background: #e0e0e0;
                color: #666;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                margin-bottom: 15px;
                font-weight: 600;
            ">← Geri</button>
            <h1 style="color: #667eea; font-size: 28px;">${topic.title}</h1>
        `;
        
        container.appendChild(header);
        
        document.getElementById('backBtn').addEventListener('click', () => {
            Categories.showCategory(topic.category);
        });
    },
    
    async renderTopicContent(container, topic) {
        const stats = await AuthLogic.getUserStats(topic.author);
        
        const topicContent = document.createElement('div');
        topicContent.style.cssText = `
            display: flex;
            gap: 20px;
            background: white;
            border: 3px solid #667eea;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 40px;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        `;
        
        topicContent.innerHTML = `
            <div class="user-info-box" style="
                width: 200px;
                flex-shrink: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                text-align: center;
                color: white;
            ">
                <div class="username-clickable" data-username="${topic.author}" style="
                    font-weight: 700;
                    font-size: 18px;
                    margin-bottom: 15px;
                    cursor: pointer;
                    transition: transform 0.3s;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                " onmouseenter="this.style.transform='scale(1.05)'" onmouseleave="this.style.transform='scale(1)'">
                    👤 ${topic.author}
                </div>
                
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: 15px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                ">
                    <span style="font-size: 28px;">${stats.rank.icon}</span>
                    <span style="font-size: 13px; font-weight: 600;">${stats.rank.name}</span>
                </div>
                
                <div style="
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    font-size: 14px;
                    backdrop-filter: blur(10px);
                ">
                    <div style="font-weight: 600; margin-bottom: 5px; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">Mesaj Sayısı</div>
                    <div style="font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${stats.totalMessages}</div>
                </div>
            </div>
            
            <div style="flex: 1;">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #f0f0f0;
                    font-size: 14px;
                    color: #666;
                ">
                    <span style="font-weight: 600;">📅 ${App.formatDate(topic.createdAt)}</span>
                    <span style="font-weight: 600;">👁️ ${topic.views} görüntülenme</span>
                </div>
                <div style="
                    line-height: 1.8; 
                    color: #333;
                    font-size: 15px;
                ">${topic.content}</div>
            </div>
        `;
        
        container.appendChild(topicContent);
        
        topicContent.querySelector('.username-clickable').addEventListener('click', () => {
            AuthLogic.handleProfileView(topic.author);
        });
        
        if (AuthService.currentUser && this.canModerate(topic)) {
            this.addDeleteTopicButton(container, topic);
        }
    },
    
    async renderReplies(container, topic, page) {
        const repliesSection = document.createElement('div');
        repliesSection.style.cssText = `
            margin-top: 40px;
            padding-top: 30px;
            border-top: 4px solid #667eea;
        `;
        
        const repliesHeader = document.createElement('h2');
        repliesHeader.style.cssText = 'color: #667eea; margin-bottom: 25px; font-size: 24px;';
        repliesHeader.innerHTML = '💬 Yanıtlar';
        repliesSection.appendChild(repliesHeader);
        
        container.appendChild(repliesSection);
        
        try {
            const allReplies = await API.getReplies(topic.id);
            const sortedReplies = allReplies
                .filter(r => !r.deleted)
                .sort((a, b) => a.createdAt - b.createdAt);
            
            const totalPages = Math.ceil(sortedReplies.length / this.repliesPerPage);
            const startIndex = (page - 1) * this.repliesPerPage;
            const pageReplies = sortedReplies.slice(startIndex, startIndex + this.repliesPerPage);
            
            if (pageReplies.length > 0) {
                for (const reply of pageReplies) {
                    await this.renderReply(repliesSection, reply, topic);
                }
            } else if (sortedReplies.length === 0) {
                repliesSection.innerHTML += `
                    <div style="
                        text-align: center; 
                        padding: 60px 20px; 
                        color: #999;
                        background: #f9f9f9;
                        border-radius: 8px;
                        border: 2px dashed #ddd;
                    ">
                        <p style="font-size: 18px;">💭 Henüz yanıt yok. İlk yanıtı siz yazın!</p>
                    </div>
                `;
            }
            
            if (totalPages > 1) {
                this.renderPagination(repliesSection, topic.id, page, totalPages);
            }
        } catch (error) {
            console.error('Yanıtlar yüklenirken hata:', error);
            repliesSection.innerHTML += `
                <div style="text-align: center; padding: 40px; color: #f5576c;">
                    <p>Yanıtlar yüklenirken hata oluştu.</p>
                </div>
            `;
        }
    },
    
    async renderReply(container, reply, topic) {
        const stats = await AuthLogic.getUserStats(reply.author);
        
        const replyDiv = document.createElement('div');
        replyDiv.style.cssText = `
            display: flex;
            gap: 20px;
            background: #fafafa;
            border: 2px solid #e8e8e8;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        `;
        
        replyDiv.addEventListener('mouseenter', () => {
            replyDiv.style.borderColor = '#667eea';
            replyDiv.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.1)';
        });
        
        replyDiv.addEventListener('mouseleave', () => {
            replyDiv.style.borderColor = '#e8e8e8';
            replyDiv.style.boxShadow = 'none';
        });
        
        replyDiv.innerHTML = `
            <div class="user-info-box" style="
                width: 180px;
                flex-shrink: 0;
                padding: 18px;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                border-radius: 10px;
                text-align: center;
            ">
                <div class="username-clickable" data-username="${reply.author}" style="
                    font-weight: 700;
                    font-size: 16px;
                    color: #333;
                    margin-bottom: 12px;
                    cursor: pointer;
                    transition: color 0.3s;
                " onmouseenter="this.style.color='#667eea'" onmouseleave="this.style.color='#333'">
                    👤 ${reply.author}
                </div>
                
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 12px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                ">
                    <span style="font-size: 22px;">${stats.rank.icon}</span>
                    <span style="font-size: 12px; font-weight: 600; color: #667eea;">${stats.rank.name}</span>
                </div>
                
                <div style="
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 8px;
                    font-size: 13px;
                    color: #666;
                ">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Mesaj Sayısı</div>
                    <div style="font-size: 20px; font-weight: 700; color: #667eea;">${stats.totalMessages}</div>
                </div>
            </div>
            
            <div style="flex: 1;">
                <div style="
                    padding: 10px 0;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #e8e8e8;
                    font-size: 13px;
                    color: #999;
                    font-weight: 600;
                ">
                    📅 ${App.formatDate(reply.createdAt)}
                </div>
                <div style="
                    line-height: 1.8; 
                    color: #333;
                    font-size: 15px;
                ">${reply.content}</div>
            </div>
        `;
        
        container.appendChild(replyDiv);
        
        replyDiv.querySelector('.username-clickable').addEventListener('click', () => {
            AuthLogic.handleProfileView(reply.author);
        });
        
        if (AuthService.currentUser && this.canModerate(topic)) {
            this.addDeleteReplyButton(replyDiv, reply, topic);
        }
    },
    
    renderPagination(container, topicId, currentPage, totalPages) {
        const pagination = document.createElement('div');
        pagination.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 30px 0;
            padding-top: 20px;
            border-top: 2px solid #eee;
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.style.cssText = `
                padding: 10px 18px;
                border: 2px solid ${i === currentPage ? '#667eea' : '#e0e0e0'};
                background: ${i === currentPage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                color: ${i === currentPage ? 'white' : '#333'};
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 15px;
                transition: all 0.3s ease;
            `;
            
            pageBtn.addEventListener('click', () => {
                this.showTopic(topicId, i);
            });
            
            pagination.appendChild(pageBtn);
        }
        
        container.appendChild(pagination);
    },
    
    async showUserTopics(username) {
        Modal.close();
        App.clearMiddleSection();
        const ortaAlan = document.getElementById('ortaAlan');
        
        try {
            const userTopics = await API.getTopics({ author: username, excludeDeleted: true });
            const sortedTopics = userTopics.sort((a, b) => b.createdAt - a.createdAt);
            
            ortaAlan.innerHTML = `
                <div style="margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #667eea;">
                    <h1 style="color: #667eea; font-size: 28px;">${username} - Konuları</h1>
                    <p style="color: #666; margin-top: 10px;">Toplam ${sortedTopics.length} konu</p>
                </div>
            `;
            
            if (sortedTopics.length === 0) {
                ortaAlan.innerHTML += `
                    <div style="text-align: center; padding: 60px 20px; color: #999;">
                        <p style="font-size: 18px;">Henüz konu açılmamış.</p>
                    </div>
                `;
                return;
            }
            
            const topicsList = document.createElement('div');
            topicsList.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
            
            for (const topic of sortedTopics) {
                const replies = await API.getReplies(topic.id);
                const replyCount = replies.filter(r => !r.deleted).length;
                const categoryName = Categories.categoryNames[topic.category] || topic.category;
                
                const card = document.createElement('div');
                card.style.cssText = `
                    background: #f9f9f9;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                
                card.addEventListener('mouseenter', () => {
                    card.style.borderColor = '#667eea';
                    card.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.2)';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.borderColor = '#e0e0e0';
                    card.style.boxShadow = 'none';
                });
                
                card.addEventListener('click', () => this.showTopic(topic.id));
                
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <h3 style="color: #333; font-size: 18px; margin: 0; flex: 1;">${topic.title}</h3>
                        <div style="display: flex; gap: 15px; font-size: 13px; color: #666;">
                            <span>💬 ${replyCount}</span>
                            <span>👁️ ${topic.views || 0}</span>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #999;">
                        <span>${categoryName}</span>
                        <span>${App.formatDate(topic.createdAt)}</span>
                    </div>
                `;
                
                topicsList.appendChild(card);
            }
            
            ortaAlan.appendChild(topicsList);
        } catch (error) {
            console.error('Kullanıcı konuları yüklenirken hata:', error);
            ortaAlan.innerHTML += `
                <div style="text-align: center; padding: 40px; color: #f5576c;">
                    <p>Konular yüklenirken hata oluştu.</p>
                </div>
            `;
        }
    },
    
    canModerate(topic) {
        if (AuthService.currentUser.role === 'admin') return true;
        if (AuthService.currentUser.role === 'moderator') {
            return topic.category.startsWith('SO') || topic.category.startsWith('SA');
        }
        return false;
    },
    
    addDeleteTopicButton(container, topic) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Konuyu Sil';
        deleteBtn.style.cssText = `
            padding: 12px 24px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-bottom: 20px;
            font-weight: 600;
            font-size: 15px;
        `;
        deleteBtn.addEventListener('click', async () => {
            const confirm = await Modal.confirm('Konu Silme', 'Bu konuyu silmek istediğinizden emin misiniz?');
            if (confirm) {
                try {
                    await API.updateTopic(topic.id, { deleted: true });
                    
                    const logType = AuthService.currentUser.role === 'moderator' ? 'mod_topic_delete' : 'admin_action';
                    const logAction = AuthService.currentUser.role === 'moderator' ? 'Moderatör Konu Silme' : 'Admin Konu Silme';
                    await API.addLog(
                        logType, 
                        logAction, 
                        `${AuthService.currentUser.username} adlı ${AuthService.currentUser.role === 'moderator' ? 'moderatörünüz' : 'admin'}, "${topic.author}" adlı üyenin '${topic.title}' adlı konusunu sildi.`, 
                        AuthService.currentUser.username, 
                        AuthService.currentUser.role
                    );
                    
                    Toast.success('Konu silindi.');
                    Categories.showCategory(topic.category);
                } catch (error) {
                    console.error('Konu silme hatası:', error);
                    Toast.error('Konu silinemedi.');
                }
            }
        });
        container.appendChild(deleteBtn);
    },
    
    addDeleteReplyButton(replyDiv, reply, topic) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '🗑️ Yanıtı Sil';
        deleteBtn.style.cssText = `
            margin-top: 10px;
            padding: 8px 16px;
            background: #f5576c;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
        `;
        deleteBtn.addEventListener('click', async () => {
            const confirm = await Modal.confirm('Yanıt Silme', 'Bu yanıtı silmek istediğinizden emin misiniz?');
            if (confirm) {
                try {
                    await API.updateReply(reply.id, { deleted: true });
                    
                    const logType = AuthService.currentUser.role === 'moderator' ? 'mod_reply_delete' : 'admin_action';
                    const logAction = AuthService.currentUser.role === 'moderator' ? 'Moderatör Yanıt Silme' : 'Admin Yanıt Silme';
                    await API.addLog(
                        logType, 
                        logAction, 
                        `${AuthService.currentUser.username} adlı ${AuthService.currentUser.role === 'moderator' ? 'moderatörünüz' : 'admin'}, "${reply.author}" adlı üyenin bir konuya yazdığı yanıtı sildi.`, 
                        AuthService.currentUser.username, 
                        AuthService.currentUser.role
                    );
                    
                    Toast.success('Yanıt silindi.');
                    this.showTopic(topic.id, this.currentPage);
                } catch (error) {
                    console.error('Yanıt silme hatası:', error);
                    Toast.error('Yanıt silinemedi.');
                }
            }
        });
        replyDiv.querySelector('div:last-child').appendChild(deleteBtn);
    }
};