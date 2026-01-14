// js/auth/auth.ui.js - Auth UI Componentleri

const AuthUI = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        document.getElementById('kayitBtn').addEventListener('click', () => {
            this.showRegisterModal();
        });
        
        document.getElementById('girisBtn').addEventListener('click', () => {
            this.showLoginModal();
        });
        
        document.getElementById('profilBtn').addEventListener('click', () => {
            this.showProfileModal();
        });
    },
    
    showRegisterModal() {
        Modal.create(`
            <div class="auth-modal">
                <button class="close-btn" onclick="Modal.close()">&times;</button>
                <h2>Kayıt Ol</h2>
                <div id="registerError"></div>
                <form id="registerForm">
                    <div class="form-group">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="regUsername" maxlength="15" required>
                        <small>Maksimum 15 karakter</small>
                    </div>
                    <div class="form-group">
                        <label>Şifre</label>
                        <input type="password" id="regPassword" maxlength="15" required>
                        <small>Maksimum 15 karakter</small>
                    </div>
                    <button type="submit" class="submit-btn">Kayıt Ol</button>
                </form>
            </div>
        `);
        
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const error = AuthLogic.handleRegister(username, password);
            
            if (error) {
                document.getElementById('registerError').innerHTML = `<div class="error-message">${error}</div>`;
            }
        });
    },
    
    showLoginModal() {
        Modal.create(`
            <div class="auth-modal">
                <button class="close-btn" onclick="Modal.close()">&times;</button>
                <h2>Giriş Yap</h2>
                <div id="loginError"></div>
                <form id="loginForm">
                    <div class="form-group">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="loginUsername" required>
                    </div>
                    <div class="form-group">
                        <label>Şifre</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="submit-btn">Giriş Yap</button>
                </form>
            </div>
        `);
        
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const error = AuthLogic.handleLogin(username, password);
            
            if (error) {
                document.getElementById('loginError').innerHTML = `<div class="error-message">${error}</div>`;
            }
        });
    },
    
    showAdminSecondStage() {
        Modal.close();
        
        Modal.create(`
            <div class="admin-second-stage">
                <button class="close-btn" onclick="Modal.close()">&times;</button>
                <h2>Admin Girişi - 2. Aşama</h2>
                <p>Admin yetkisi için ikinci doğrulamayı tamamlayın</p>
                <div id="adminError"></div>
                <form id="adminForm">
                    <div class="form-group">
                        <label>Kullanıcı Adı</label>
                        <input type="text" id="adminUsername" required>
                    </div>
                    <div class="form-group">
                        <label>Şifre</label>
                        <input type="password" id="adminPassword" required>
                    </div>
                    <button type="submit" class="submit-btn">Admin Girişi Yap</button>
                </form>
            </div>
        `);
        
        document.getElementById('adminForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('adminUsername').value;
            const password = document.getElementById('adminPassword').value;
            const error = AuthLogic.handleAdminSecondStage(username, password);
            
            if (error) {
                document.getElementById('adminError').innerHTML = `<div class="error-message">${error}</div>`;
            }
        });
    },
    
    showProfileModal() {
        const user = AuthService.currentUser;
        if (!user) return;
        
        const stats = AuthLogic.getUserStats(user.username);
        
        Modal.create(`
            <div class="profile-modal">
                <button class="close-btn" onclick="Modal.close()">&times;</button>
                <div class="profile-header">
                    <h2>${user.username}</h2>
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-top: 15px;
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 8px;
                        color: white;
                    ">
                        <span style="font-size: 24px;">${stats.rank.icon}</span>
                        <span style="font-size: 16px; font-weight: 600;">${stats.rank.name}</span>
                    </div>
                </div>
                
                <div class="username-edit">
                    <input type="text" id="newUsername" maxlength="15" placeholder="Yeni kullanıcı adı">
                    <button onclick="AuthUI.changeUsername()">Değiştir</button>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-box">
                        <div class="label">Açtığı Konular</div>
                        <div class="value">${stats.topicCount}</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Yazdığı Yanıtlar</div>
                        <div class="value">${stats.replyCount}</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Toplam Mesaj</div>
                        <div class="value">${stats.totalMessages}</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Profil Ziyareti</div>
                        <div class="value">${stats.profileViews}</div>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <button onclick="AuthUI.showUserTopics('${user.username}')" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                    ">📝 Konularını Gör</button>
                </div>
                
                <div class="profile-signature">
                    <label>İmza Sözü</label>
                    <textarea id="userSignature" maxlength="200">${user.signature || ''}</textarea>
                </div>
                
                <div class="profile-actions">
                    <button class="save-btn" onclick="AuthUI.saveProfile()">Kaydet</button>
                    <button class="logout-btn" onclick="AuthUI.logout()">Çıkış Yap</button>
                </div>
            </div>
        `);
    },
    
    showPublicProfile(username) {
        const user = API.getUserByUsername(username);
        if (!user) {
            Toast.error('Kullanıcı bulunamadı.');
            return;
        }
        
        const stats = AuthLogic.getUserStats(username);
        
        Modal.create(`
            <div class="profile-modal">
                <button class="close-btn" onclick="Modal.close()">&times;</button>
                <div class="profile-header">
                    <h2>${user.username}</h2>
                    <div style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-top: 15px;
                        padding: 12px 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 8px;
                        color: white;
                    ">
                        <span style="font-size: 24px;">${stats.rank.icon}</span>
                        <span style="font-size: 16px; font-weight: 600;">${stats.rank.name}</span>
                    </div>
                </div>
                
                <div class="profile-stats">
                    <div class="stat-box">
                        <div class="label">Açtığı Konular</div>
                        <div class="value">${stats.topicCount}</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Yazdığı Yanıtlar</div>
                        <div class="value">${stats.replyCount}</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Toplam Mesaj</div>
                        <div class="value">${stats.totalMessages}</div>
                    </div>
                    <div class="stat-box">
                        <div class="label">Profil Ziyareti</div>
                        <div class="value">${stats.profileViews}</div>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <button onclick="AuthUI.showUserTopics('${username}')" style="
                        width: 100%;
                        padding: 12px;
                        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                    ">📝 Konularını Gör</button>
                </div>
                
                ${user.signature ? `
                    <div style="
                        margin-top: 20px;
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                    ">
                        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">İmza:</div>
                        <div style="font-size: 14px; color: #333; font-style: italic;">${user.signature}</div>
                    </div>
                ` : ''}
            </div>
        `);
    },
    
    showUserTopics(username) {
        Modal.close();
        Topics.showUserTopics(username);
    },
    
    changeUsername() {
        const newUsername = document.getElementById('newUsername').value;
        AuthLogic.handleUsernameChange(newUsername);
    },
    
    saveProfile() {
        const signature = document.getElementById('userSignature').value;
        AuthLogic.handleProfileSave(signature);
    },
    
    logout() {
        AuthLogic.handleLogout();
    }
};