// js/topics/topic-reply.js - Yanıt Oluşturma Modülü

const TopicReply = {
    renderReplyForm(container, topicId, topic) {
        if (!AuthService.currentUser) return;
        
        const canPost = AuthService.canUserPost();
        if (!canPost.allowed) {
            Toast.error(canPost.message);
            return;
        }
        
        const replyForm = document.createElement('div');
        replyForm.style.cssText = `
            margin-top: 40px; 
            padding-top: 30px; 
            border-top: 4px solid #43e97b;
        `;
        
        replyForm.innerHTML = `
            <h3 style="color: #43e97b; margin-bottom: 20px; font-size: 22px;">✍️ Yanıt Yaz</h3>
            
            <!-- Gelişmiş Editör Toolbar -->
            <div id="replyEditorToolbar" style="
                display: flex;
                gap: 5px;
                padding: 10px;
                background: #f9f9f9;
                border: 2px solid #e0e0e0;
                border-bottom: none;
                border-radius: 8px 8px 0 0;
                flex-wrap: wrap;
            ">
                <!-- Yazı Tipi -->
                <select id="replyFontFamily" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                    <option value="">Yazı Tipi</option>
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                </select>
                
                <!-- Yazı Boyutu -->
                <select id="replyFontSize" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                    <option value="">Boyut</option>
                    <option value="1">Küçük</option>
                    <option value="3">Normal</option>
                    <option value="5">Büyük</option>
                    <option value="7">Çok Büyük</option>
                </select>
                
                <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                
                <!-- Metin Rengi -->
                <input type="color" id="replyTextColor" title="Metin Rengi" style="width: 40px; height: 32px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                
                <!-- Arka Plan Rengi -->
                <input type="color" id="replyBgColor" title="Arka Plan Rengi" style="width: 40px; height: 32px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                
                <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                
                <!-- Temel Formatlar -->
                <button class="reply-editor-btn" data-cmd="bold" title="Kalın (Ctrl+B)" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-weight: bold;">B</button>
                <button class="reply-editor-btn" data-cmd="italic" title="İtalik (Ctrl+I)" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-style: italic;">I</button>
                <button class="reply-editor-btn" data-cmd="underline" title="Altı Çizili (Ctrl+U)" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; text-decoration: underline;">U</button>
                <button class="reply-editor-btn" data-cmd="strikeThrough" title="Üstü Çizili" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; text-decoration: line-through;">S</button>
                
                <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                
                <!-- Hizalama -->
                <button class="reply-editor-btn" data-cmd="justifyLeft" title="Sola Hizala" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">⬅</button>
                <button class="reply-editor-btn" data-cmd="justifyCenter" title="Ortala" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">↔</button>
                <button class="reply-editor-btn" data-cmd="justifyRight" title="Sağa Hizala" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">➡</button>
                
                <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                
                <!-- Liste -->
                <button class="reply-editor-btn" data-cmd="insertUnorderedList" title="Madde İşareti" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">• Liste</button>
                <button class="reply-editor-btn" data-cmd="insertOrderedList" title="Numaralı Liste" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">1. Liste</button>
                
                <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                
                <!-- Özel -->
                <button id="replyQuoteBtn" title="Alıntı" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">💬 Alıntı</button>
                <button id="replyCodeBtn" title="Kod Bloğu" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">{'</>'} Kod</button>
                <button id="replySpoilerBtn" title="Spoiler" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">👁️ Spoiler</button>
                <button id="replyEmojiBtn" title="Emoji" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">😊 Emoji</button>
                
                <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                
                <!-- Temizle -->
                <button class="reply-editor-btn" data-cmd="removeFormat" title="Formatı Temizle" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">🧹</button>
            </div>
            
            <!-- Editör Alanı -->
            <div id="replyEditor" style="
                min-height: 250px;
                border: 2px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 8px 8px;
                padding: 15px;
                background: white;
                margin-bottom: 15px;
                overflow-y: auto;
                font-size: 15px;
                line-height: 1.6;
            " contenteditable="true"></div>
            
            <div style="display: flex; gap: 10px;">
                <button id="replyPreviewBtn" style="
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                ">👁️ Önizleme</button>
                <button id="submitReplyBtn" style="
                    flex: 1;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                ">📤 Yanıtı Gönder</button>
            </div>
        `;
        
        container.appendChild(replyForm);
        
        this.initReplyEditor();
        
        document.getElementById('submitReplyBtn').addEventListener('click', () => {
            this.createReply(topicId, topic);
        });
        
        document.getElementById('replyPreviewBtn').addEventListener('click', () => {
            this.showReplyPreview();
        });
    },
    
    initReplyEditor() {
        const editor = document.getElementById('replyEditor');
        
        // Temel formatlar
        document.querySelectorAll('.reply-editor-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.dataset.cmd;
                document.execCommand(cmd, false, null);
                editor.focus();
            });
        });
        
        // Yazı tipi
        document.getElementById('replyFontFamily').addEventListener('change', (e) => {
            if (e.target.value) {
                document.execCommand('fontName', false, e.target.value);
                editor.focus();
            }
        });
        
        // Yazı boyutu
        document.getElementById('replyFontSize').addEventListener('change', (e) => {
            if (e.target.value) {
                document.execCommand('fontSize', false, e.target.value);
                editor.focus();
            }
        });
        
        // Metin rengi
        document.getElementById('replyTextColor').addEventListener('change', (e) => {
            document.execCommand('foreColor', false, e.target.value);
            editor.focus();
        });
        
        // Arka plan rengi
        document.getElementById('replyBgColor').addEventListener('change', (e) => {
            document.execCommand('backColor', false, e.target.value);
            editor.focus();
        });
        
        // Alıntı
        document.getElementById('replyQuoteBtn').addEventListener('click', () => {
            const selection = window.getSelection().toString();
            const quote = `<blockquote style="border-left: 4px solid #43e97b; padding-left: 15px; margin: 10px 0; color: #666; font-style: italic; background: #f9f9f9; padding: 10px 15px; border-radius: 4px;">${selection || 'Alıntı metni buraya...'}</blockquote>`;
            document.execCommand('insertHTML', false, quote);
            editor.focus();
        });
        
        // Kod bloğu
        document.getElementById('replyCodeBtn').addEventListener('click', () => {
            const selection = window.getSelection().toString();
            const code = `<pre style="background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 6px; border: 1px solid #444; overflow-x: auto; font-family: 'Courier New', monospace;"><code>${selection || 'Kod buraya...'}</code></pre>`;
            document.execCommand('insertHTML', false, code);
            editor.focus();
        });
        
        // Spoiler
        document.getElementById('replySpoilerBtn').addEventListener('click', () => {
            const selection = window.getSelection().toString();
            const spoiler = `<span style="background: #333; color: #333; cursor: pointer; padding: 2px 6px; border-radius: 3px; transition: all 0.3s;" onclick="this.style.color='white'; this.style.background='#43e97b';" title="Görmek için tıkla">${selection || 'Spoiler içerik...'}</span>`;
            document.execCommand('insertHTML', false, spoiler);
            editor.focus();
        });
        
        // Emoji paneli
        document.getElementById('replyEmojiBtn').addEventListener('click', () => {
            const emojis = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '⭐', '💯', '🎉', '👏', '🤔', '😍', '🥰', '😢', '😭', '🙌', '💪', '🌟', '✨', '💖'];
            const emojiHTML = emojis.map(e => `<span style="cursor: pointer; font-size: 24px; padding: 5px; display: inline-block; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'" onclick="document.execCommand('insertHTML', false, '${e}'); document.getElementById('replyEditor').focus();">${e}</span>`).join('');
            
            const panel = `<div style="background: white; border: 2px solid #43e97b; padding: 10px; border-radius: 8px; margin: 5px 0; box-shadow: 0 2px 8px rgba(67, 233, 123, 0.2);">${emojiHTML}</div>`;
            document.execCommand('insertHTML', false, panel);
        });
    },
    
    showReplyPreview() {
        const content = document.getElementById('replyEditor').innerHTML.trim();
        
        Modal.create(
            '💬 Yanıt Önizleme',
            `
                <div style="max-height: 500px; overflow-y: auto;">
                    <div style="
                        padding: 20px;
                        background: #fafafa;
                        border: 2px solid #e8e8e8;
                        border-radius: 10px;
                        line-height: 1.8;
                    ">
                        ${content || '<p style="color: #999; text-align: center;">Yanıt henüz girilmedi.</p>'}
                    </div>
                </div>
            `
        );
    },
    
    async createReply(topicId, topic) {
        const content = document.getElementById('replyEditor').innerHTML.trim();
        
        if (!content || content === '<br>') {
            Toast.error('Lütfen yanıt girin.');
            return;
        }
        
        try {
            const newReply = {
                topicId,
                content
            };
            
            const result = await API.addReply(newReply);
            
            if (topic) {
                const categoryName = Categories.categoryNames[topic.category] || topic.category;
                const logType = AuthService.currentUser.role === 'moderator' ? 'mod_reply_create' : 'member_reply_create';
                const logAction = AuthService.currentUser.role === 'moderator' ? 'Moderatör Yanıt Yazma' : 'Üye Yanıt Yazma';
                await API.addLog(
                    logType, 
                    logAction, 
                    `${AuthService.currentUser.username} adlı ${AuthService.currentUser.role === 'moderator' ? 'moderatörünüz' : 'üye'}, "${categoryName}" bölümündeki '${topic.title}' adlı konuya yanıt yazdı.`, 
                    AuthService.currentUser.username, 
                    AuthService.currentUser.role
                );
            }
            
            Toast.success('Yanıt gönderildi!');
            
            if (window.Widgets) {
                Widgets.updateCokYazanlar();
            }
            
            // Son sayfaya git
            const allReplies = await API.getReplies(topicId);
            const totalReplies = allReplies.filter(r => !r.deleted).length;
            const lastPage = Math.ceil(totalReplies / TopicView.repliesPerPage);
            TopicView.showTopic(topicId, lastPage);
        } catch (error) {
            console.error('Yanıt oluşturma hatası:', error);
            Toast.error(error.message || 'Yanıt gönderilemedi.');
        }
    }
};