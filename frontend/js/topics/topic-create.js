// js/topics/topic-create.js - Konu Oluşturma Modülü

const TopicCreate = {
    showCreateTopicForm(category, categoryName) {
        App.clearMiddleSection();
        const ortaAlan = document.getElementById('ortaAlan');
        
        ortaAlan.innerHTML = `
            <div style="max-width: 900px; margin: 0 auto;">
                <h2 style="color: #667eea; margin-bottom: 25px;">Yeni Konu Başlat - ${categoryName}</h2>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 600;">Konu Başlığı</label>
                    <input type="text" id="topicTitle" style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e0e0e0;
                        border-radius: 8px;
                        font-size: 16px;
                    " placeholder="Konu başlığını girin..." maxlength="200">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 600;">Mesajınız</label>
                    
                    <!-- Gelişmiş Editör Toolbar -->
                    <div id="editorToolbar" style="
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
                        <select id="fontFamily" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <option value="">Yazı Tipi</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Verdana">Verdana</option>
                        </select>
                        
                        <!-- Yazı Boyutu -->
                        <select id="fontSize" style="padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                            <option value="">Boyut</option>
                            <option value="1">Küçük</option>
                            <option value="3">Normal</option>
                            <option value="5">Büyük</option>
                            <option value="7">Çok Büyük</option>
                        </select>
                        
                        <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                        
                        <!-- Metin Rengi -->
                        <input type="color" id="textColor" title="Metin Rengi" style="width: 40px; height: 32px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                        
                        <!-- Arka Plan Rengi -->
                        <input type="color" id="bgColor" title="Arka Plan Rengi" style="width: 40px; height: 32px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                        
                        <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                        
                        <!-- Temel Formatlar -->
                        <button class="editor-btn" data-cmd="bold" title="Kalın (Ctrl+B)" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-weight: bold;">B</button>
                        <button class="editor-btn" data-cmd="italic" title="İtalik (Ctrl+I)" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-style: italic;">I</button>
                        <button class="editor-btn" data-cmd="underline" title="Altı Çizili (Ctrl+U)" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; text-decoration: underline;">U</button>
                        <button class="editor-btn" data-cmd="strikeThrough" title="Üstü Çizili" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; text-decoration: line-through;">S</button>
                        
                        <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                        
                        <!-- Hizalama -->
                        <button class="editor-btn" data-cmd="justifyLeft" title="Sola Hizala" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">⬅</button>
                        <button class="editor-btn" data-cmd="justifyCenter" title="Ortala" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">↔</button>
                        <button class="editor-btn" data-cmd="justifyRight" title="Sağa Hizala" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">➡</button>
                        
                        <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                        
                        <!-- Liste -->
                        <button class="editor-btn" data-cmd="insertUnorderedList" title="Madde İşareti" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">• Liste</button>
                        <button class="editor-btn" data-cmd="insertOrderedList" title="Numaralı Liste" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">1. Liste</button>
                        
                        <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                        
                        <!-- Özel -->
                        <button id="quoteBtn" title="Alıntı" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">💬 Alıntı</button>
                        <button id="codeBtn" title="Kod Bloğu" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">{'</>'} Kod</button>
                        <button id="spoilerBtn" title="Spoiler" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">👁️ Spoiler</button>
                        <button id="emojiBtn" title="Emoji" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">😊 Emoji</button>
                        
                        <div style="width: 1px; height: 30px; background: #ddd; margin: 0 5px;"></div>
                        
                        <!-- Temizle -->
                        <button class="editor-btn" data-cmd="removeFormat" title="Formatı Temizle" style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">🧹</button>
                    </div>
                    
                    <!-- Editör Alanı -->
                    <div id="editor" style="
                        min-height: 350px;
                        border: 2px solid #e0e0e0;
                        border-top: none;
                        border-radius: 0 0 8px 8px;
                        padding: 15px;
                        background: white;
                        overflow-y: auto;
                        font-size: 15px;
                        line-height: 1.6;
                    " contenteditable="true"></div>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="previewBtn" style="
                        padding: 15px 30px;
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">👁️ Önizleme</button>
                    <button id="submitTopicBtn" style="
                        flex: 1;
                        padding: 15px;
                        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">📤 Konuyu Gönder</button>
                    <button id="cancelTopicBtn" style="
                        padding: 15px 30px;
                        background: #e0e0e0;
                        color: #666;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                    ">❌ İptal</button>
                </div>
            </div>
        `;
        
        this.initEditor();
        
        document.getElementById('submitTopicBtn').addEventListener('click', () => {
            this.createTopic(category);
        });
        
        document.getElementById('cancelTopicBtn').addEventListener('click', () => {
            Categories.showCategory(category);
        });
        
        document.getElementById('previewBtn').addEventListener('click', () => {
            this.showPreview();
        });
    },
    
    initEditor() {
        const editor = document.getElementById('editor');
        
        // Temel formatlar
        document.querySelectorAll('.editor-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.dataset.cmd;
                document.execCommand(cmd, false, null);
                editor.focus();
            });
        });
        
        // Yazı tipi
        document.getElementById('fontFamily').addEventListener('change', (e) => {
            if (e.target.value) {
                document.execCommand('fontName', false, e.target.value);
                editor.focus();
            }
        });
        
        // Yazı boyutu
        document.getElementById('fontSize').addEventListener('change', (e) => {
            if (e.target.value) {
                document.execCommand('fontSize', false, e.target.value);
                editor.focus();
            }
        });
        
        // Metin rengi
        document.getElementById('textColor').addEventListener('change', (e) => {
            document.execCommand('foreColor', false, e.target.value);
            editor.focus();
        });
        
        // Arka plan rengi
        document.getElementById('bgColor').addEventListener('change', (e) => {
            document.execCommand('backColor', false, e.target.value);
            editor.focus();
        });
        
        // Alıntı
        document.getElementById('quoteBtn').addEventListener('click', () => {
            const selection = window.getSelection().toString();
            const quote = `<blockquote style="border-left: 4px solid #667eea; padding-left: 15px; margin: 10px 0; color: #666; font-style: italic;">${selection || 'Alıntı metni buraya...'}</blockquote>`;
            document.execCommand('insertHTML', false, quote);
            editor.focus();
        });
        
        // Kod bloğu
        document.getElementById('codeBtn').addEventListener('click', () => {
            const selection = window.getSelection().toString();
            const code = `<pre style="background: #f5f5f5; padding: 15px; border-radius: 6px; border: 1px solid #ddd; overflow-x: auto;"><code>${selection || 'Kod buraya...'}</code></pre>`;
            document.execCommand('insertHTML', false, code);
            editor.focus();
        });
        
        // Spoiler
        document.getElementById('spoilerBtn').addEventListener('click', () => {
            const selection = window.getSelection().toString();
            const spoiler = `<span style="background: #333; color: #333; cursor: pointer; padding: 2px 6px; border-radius: 3px;" onclick="this.style.color='white'; this.style.background='#667eea';" title="Görmek için tıkla">${selection || 'Spoiler içerik...'}</span>`;
            document.execCommand('insertHTML', false, spoiler);
            editor.focus();
        });
        
        // Emoji paneli
        document.getElementById('emojiBtn').addEventListener('click', () => {
            const emojis = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '⭐', '💯', '🎉', '👏', '🤔', '😍', '🥰', '😢', '😭', '🙌', '💪', '🌟'];
            const emojiHTML = emojis.map(e => `<span style="cursor: pointer; font-size: 24px; padding: 5px;" onclick="document.execCommand('insertHTML', false, '${e}'); document.getElementById('editor').focus();">${e}</span>`).join('');
            
            const panel = `<div style="background: white; border: 2px solid #667eea; padding: 10px; border-radius: 6px; margin: 5px 0;">${emojiHTML}</div>`;
            document.execCommand('insertHTML', false, panel);
        });
    },
    
    showPreview() {
        const title = document.getElementById('topicTitle').value.trim();
        const content = document.getElementById('editor').innerHTML.trim();
        
        Modal.create(
            'Önizleme',
            `
                <div style="max-height: 500px; overflow-y: auto;">
                    <h2 style="color: #667eea; margin-bottom: 15px;">${title || '(Başlık girilmedi)'}</h2>
                    <div style="border-top: 2px solid #eee; padding-top: 15px; line-height: 1.8;">
                        ${content || '<p style="color: #999;">İçerik henüz girilmedi.</p>'}
                    </div>
                </div>
            `
        );
    },
    
    async createTopic(category) {
        const title = document.getElementById('topicTitle').value.trim();
        const content = document.getElementById('editor').innerHTML.trim();
        
        if (!title) {
            Toast.error('Lütfen konu başlığı girin.');
            return;
        }
        
        if (!content || content === '<br>') {
            Toast.error('Lütfen mesaj girin.');
            return;
        }
        
        try {
            const newTopic = {
                category,
                title,
                content
            };
            
            const result = await API.addTopic(newTopic);
            
            const categoryName = Categories.categoryNames[category] || category;
            const logType = AuthService.currentUser.role === 'moderator' ? 'mod_topic_create' : 'member_topic_create';
            const logAction = AuthService.currentUser.role === 'moderator' ? 'Moderatör Konu Oluşturma' : 'Üye Konu Oluşturma';
            await API.addLog(
                logType, 
                logAction, 
                `${AuthService.currentUser.username} adlı ${AuthService.currentUser.role === 'moderator' ? 'moderatörünüz' : 'üye'}, "${categoryName}" bölümünde '${title}' adlı bir konu oluşturdu.`, 
                AuthService.currentUser.username, 
                AuthService.currentUser.role
            );
            
            Toast.success('Konu başarıyla oluşturuldu!');
            
            if (window.Widgets) {
                Widgets.updateYeniKonular();
            }
            
            TopicView.showTopic(result.topic.id);
        } catch (error) {
            console.error('Konu oluşturma hatası:', error);
            Toast.error(error.message || 'Konu oluşturulamadı.');
        }
    }
};