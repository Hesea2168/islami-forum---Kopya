// js/categories.js - Kategori Yönetimi (SO & SA)

const Categories = {
    currentCategory: null,
    currentPage: 1,
    topicsPerPage: 25,
    
    categoryNames: {
        'SO4-1': 'Esma-i Nebi',
        'SO4-2': '4 Halife ve Mahreçleri',
        'SO2-3': 'Tevbe İstiğfar',
        'SO2-4': 'Bol Sevap',
        'SO2-5': 'Dilek - Hacet',
        'SO2-6': 'Alternatif Tıp',
        'SO2-7': 'Akdi Lisan',
        'SO2-8': 'Muhabbet',
        'SO2-9': 'Hırsızlık',
        'SO2-10': 'Rızık',
        'SO2-11': 'Cine - Periye Dair Her Şey',
        'SO2-12': 'İstihare',
        'SO2-13': 'Muhafaza',
        'SO2-14': 'Kısmet',
        'SO2-15': 'Sabır',
        'SO2-16': 'Tevekkül',
        'SO2-17': 'Psikoterapi',
        'SO2-18': 'Esmaül Hüsna',
        'SO2-19': 'Hastalıklar',
        'SO2-20': 'İstişare',
        'SO2-21': 'Sohbet Köşesi',
        'SO2-22': 'Zikir Bölümü',
        'SO2-23': 'Kur\'an Öğrenme',
        'SO2-24': 'Muhtelif',
        'SO5-25': '4 Kutbu Kamil',
        'SA4-1': 'Esmaül Hüsna',
        'SA4-2': '313 Nebi ve Mahreçleri',
        'SA2-3': 'Tefsirler',
        'SA2-4': 'Fıkıh Kitapları',
        'SA2-5': 'Hadis Kitapları',
        'SA2-6': 'Sarf - Nahiv Kitapları',
        'SA2-7': 'Fetva Kitapları',
        'SA2-8': 'Hanfi Mezhebi',
        'SA2-9': 'Şafii Mezhebi',
        'SA2-10': 'Maliki Mezhebi',
        'SA2-11': 'Hanbeli Mezhebi',
        'SA2-12': 'Peygamberlerin Hayatı',
        'SA2-13': '4 Halifenin Hayatı',
        'SA2-14': 'Tasavvuf Kitapları',
        'SA2-15': 'ALLLAH (A.C.) Dostları',
        'SA2-16': 'İslam Alimleri - Bilim Adamları',
        'SA2-17': 'Veda Hutbesi',
        'SA2-18': 'Altın Sözler',
        'SA2-19': 'Dini şiirler - Kasideler',
        'SA2-20': 'Dini Hikayeler',
        'SA2-21': 'Ricali Gayb Duaları',
        'SA2-22': 'Arifler Sofrası',
        'SA2-23': 'Tılsımlar',
        'SA2-24': 'İslami Programlar',
        'SA5-25': '12 İmam İsimleri'
    },
    
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.showCategory(category);
            });
        });
    },
    
    async showCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        
        const categoryName = this.categoryNames[category];
        
        try {
            const topics = await this.getCategoryTopics(category);
            
            if (AuthService.currentUser) {
                App.startCategoryVisit(category, categoryName);
            }
            
            this.renderTopicList(categoryName, topics);
        } catch (error) {
            console.error('Kategori yükleme hatası:', error);
            Toast.error('Kategori yüklenirken hata oluştu.');
        }
    },
    
    async getCategoryTopics(category) {
        const topics = await API.getTopics({ category, excludeDeleted: true });
        return topics.sort((a, b) => b.createdAt - a.createdAt);
    },
    
    async renderTopicList(categoryName, topics) {
        App.clearMiddleSection();
        const ortaAlan = document.getElementById('ortaAlan');
        
        // SO veya SA bölümü kontrolü
        const isSOorSA = this.currentCategory.startsWith('SO') || this.currentCategory.startsWith('SA');
        
        ortaAlan.innerHTML = `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 3px solid #667eea;
            ">
                <h1 style="color: #667eea; font-size: 28px;">${categoryName}</h1>
                ${AuthService.currentUser && isSOorSA ? `
                    <button class="create-topic-button" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    ">+ Konu Başlat</button>
                ` : ''}
            </div>
        `;
        
        // Event listener'ı butonu render ettikten SONRA ekle
        if (AuthService.currentUser && isSOorSA) {
            setTimeout(() => {
                const createBtn = ortaAlan.querySelector('.create-topic-button');
                if (createBtn) {
                    createBtn.addEventListener('click', () => {
                        const canPost = AuthService.canUserPost();
                        if (canPost.allowed) {
                            Topics.showCreateTopicForm(this.currentCategory, categoryName);
                        } else {
                            Toast.error(canPost.message);
                        }
                    });
                }
            }, 0);
        }
        
        if (topics.length === 0) {
            ortaAlan.innerHTML += `
                <div style="text-align: center; padding: 60px 20px; color: #999;">
                    <p style="font-size: 18px;">Henüz konu yok. İlk konuyu siz açın!</p>
                </div>
            `;
            return;
        }
        
        const totalPages = Math.ceil(topics.length / this.topicsPerPage);
        const startIndex = (this.currentPage - 1) * this.topicsPerPage;
        const pageTopics = topics.slice(startIndex, startIndex + this.topicsPerPage);
        
        const topicsList = document.createElement('div');
        topicsList.style.cssText = 'display: flex; flex-direction: column; gap: 15px;';
        
        for (const topic of pageTopics) {
            await this.renderTopicCard(topicsList, topic);
        }
        
        ortaAlan.appendChild(topicsList);
        
        if (totalPages > 1) {
            this.renderPagination(ortaAlan, categoryName, topics, totalPages);
        }
    },
    
    async renderTopicCard(container, topic) {
        try {
            const replies = await API.getReplies(topic.id);
            const replyCount = replies.filter(r => !r.deleted).length;
            
            const topicCard = document.createElement('div');
            topicCard.style.cssText = `
                background: #f9f9f9;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            
            topicCard.addEventListener('mouseenter', () => {
                topicCard.style.borderColor = '#667eea';
                topicCard.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.2)';
            });
            
            topicCard.addEventListener('mouseleave', () => {
                topicCard.style.borderColor = '#e0e0e0';
                topicCard.style.boxShadow = 'none';
            });
            
            topicCard.addEventListener('click', (e) => {
                if (!e.target.classList.contains('author-link')) {
                    Topics.showTopic(topic.id);
                }
            });
            
            topicCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <h3 style="color: #333; font-size: 18px; margin: 0; flex: 1;">${topic.title}</h3>
                    <div style="display: flex; gap: 15px; font-size: 13px; color: #666;">
                        <span class="author-link" style="cursor: pointer; transition: color 0.3s;" 
                              onmouseenter="this.style.color='#667eea'" 
                              onmouseleave="this.style.color='#666'">👤 ${topic.author}</span>
                        <span>💬 ${replyCount}</span>
                        <span>👁️ ${topic.views || 0}</span>
                    </div>
                </div>
                <div style="font-size: 13px; color: #999;">
                    ${App.formatDate(topic.createdAt)}
                </div>
            `;
            
            topicCard.querySelector('.author-link').addEventListener('click', (e) => {
                e.stopPropagation();
                AuthLogic.handleProfileView(topic.author);
            });
            
            container.appendChild(topicCard);
        } catch (error) {
            console.error('Konu kartı render hatası:', error);
        }
    },
    
    renderPagination(container, categoryName, topics, totalPages) {
        const pagination = document.createElement('div');
        pagination.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
        `;
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.style.cssText = `
                padding: 8px 16px;
                border: 2px solid ${i === this.currentPage ? '#667eea' : '#e0e0e0'};
                background: ${i === this.currentPage ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                color: ${i === this.currentPage ? 'white' : '#333'};
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            `;
            
            pageBtn.addEventListener('click', () => {
                this.currentPage = i;
                this.renderTopicList(categoryName, topics);
            });
            
            if (i !== this.currentPage) {
                pageBtn.addEventListener('mouseenter', () => {
                    pageBtn.style.borderColor = '#667eea';
                });
                pageBtn.addEventListener('mouseleave', () => {
                    pageBtn.style.borderColor = '#e0e0e0';
                });
            }
            
            pagination.appendChild(pageBtn);
        }
        
        container.appendChild(pagination);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Categories.init();
});