// js/services/auth.service.js - Authentication Servis Katmanı

const AuthService = {
    currentUser: null,
    
    async init() {
        await this.loadCurrentUser();
    },
    
    async loadCurrentUser() {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            this.currentUser = null;
            return;
        }
        
        try {
            const user = await API.verifyToken();
            if (user) {
                this.currentUser = user;
            } else {
                this.currentUser = null;
            }
        } catch (error) {
            console.error('Token doğrulama hatası:', error);
            this.currentUser = null;
        }
    },
    
    async register(username, password) {
        // Validasyon
        if (username.length < 3) {
            return { success: false, message: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
        }
        if (password.length < 4) {
            return { success: false, message: 'Şifre en az 4 karakter olmalıdır.' };
        }
        
        try {
            // Email olarak username@forum.local kullan
            const email = `${username}@forum.local`;
            const data = await API.register(username, email, password);
            
            return {
                success: true,
                message: 'Kayıt başarılı! Giriş yapabilirsiniz.'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Kayıt sırasında bir hata oluştu.'
            };
        }
    },
    
    async login(username, password) {
        // Admin 1. aşama kontrolü
        if (username === 'seyyidialçıman' && password === '1186sadakat1186') {
            return { success: true, requiresSecondStage: true };
        }
        
        try {
            const data = await API.login(username, password);
            
            if (data.user) {
                this.currentUser = data.user;
                
                // Giriş logu
                const logType = data.user.role === 'moderator' ? 'mod_login' : 'member_login';
                const logAction = data.user.role === 'moderator' ? 'Moderatör Giriş' : 'Üye Giriş';
                await API.addLog(
                    logType,
                    logAction,
                    `${username} adlı ${data.user.role === 'moderator' ? 'moderatörünüz' : 'üye'} foruma giriş yaptı.`,
                    username,
                    data.user.role
                );
                
                return { success: true, user: data.user };
            }
            
            return { success: false, message: 'Giriş başarısız.' };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Kullanıcı adı veya şifre hatalı.'
            };
        }
    },
    
    async adminSecondStage(username, password) {
        if (username === 'Seyyidimalabub1186' && password === '1111muhammedabdülkadir1111') {
            try {
                // Admin kullanıcısını kontrol et, yoksa oluştur
                const users = await API.getUsers();
                let adminUser = users.find(u => u.role === 'admin');
                
                if (!adminUser) {
                    // Admin kullanıcısını backend'de oluştur
                    const email = 'admin@forum.local';
                    await API.register('Admin', email, '1111muhammedabdülkadir1111');
                    
                    // Yeni oluşturulan admin'i al
                    const updatedUsers = await API.getUsers();
                    adminUser = updatedUsers.find(u => u.username === 'Admin');
                    
                    if (adminUser) {
                        // Admin rolüne yükselt
                        await API.promoteToModerator(adminUser.id);
                        // Tekrar al (güncellenmiş haliyle)
                        adminUser = await API.getUserById(adminUser.id);
                    }
                }
                
                // Admin olarak giriş yap
                const loginData = await API.login('Admin', '1111muhammedabdülkadir1111');
                
                if (loginData.user) {
                    this.currentUser = loginData.user;
                    
                    await API.addLog(
                        'admin_action',
                        'Admin Giriş',
                        `${this.currentUser.username} adlı admin foruma giriş yaptı.`,
                        this.currentUser.username,
                        'admin'
                    );
                    
                    return { success: true, user: this.currentUser };
                }
            } catch (error) {
                console.error('Admin giriş hatası:', error);
            }
        }
        
        return { success: false, message: 'Admin bilgileri hatalı.' };
    },
    
    async logout() {
        if (this.currentUser) {
            const logType = this.currentUser.role === 'moderator' ? 'mod_logout' : 'member_logout';
            const logAction = this.currentUser.role === 'moderator' ? 'Moderatör Çıkış' : 'Üye Çıkış';
            
            try {
                await API.addLog(
                    logType,
                    logAction,
                    `${this.currentUser.username} adlı ${this.currentUser.role === 'moderator' ? 'moderatörünüz' : 'üye'} forumdan çıkış yaptı.`,
                    this.currentUser.username,
                    this.currentUser.role
                );
            } catch (error) {
                console.error('Logout log hatası:', error);
            }
        }
        
        await API.logout();
        this.currentUser = null;
    },
    
    getCurrentUser() {
        return this.currentUser;
    },
    
    async updateUsername(newUsername) {
        if (!this.currentUser) {
            return { success: false, message: 'Giriş yapmanız gerekiyor.' };
        }
        
        if (newUsername.length < 3 || newUsername.length > 15) {
            return { success: false, message: 'Kullanıcı adı 3-15 karakter arasında olmalıdır.' };
        }
        
        try {
            const existing = await API.getUserByUsername(newUsername);
            if (existing && existing.id !== this.currentUser.id) {
                return { success: false, message: 'Bu kullanıcı adı zaten kullanılıyor.' };
            }
            
            await API.updateUser(this.currentUser.id, { username: newUsername });
            this.currentUser.username = newUsername;
            API.setCurrentUser(this.currentUser);
            
            return { success: true, message: 'Kullanıcı adı değiştirildi!' };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Kullanıcı adı güncellenemedi.'
            };
        }
    },
    
    async updateSignature(signature) {
        if (!this.currentUser) {
            return { success: false, message: 'Giriş yapmanız gerekiyor.' };
        }
        
        try {
            await API.updateUser(this.currentUser.id, { signature });
            this.currentUser.signature = signature;
            API.setCurrentUser(this.currentUser);
            
            return { success: true, message: 'İmza güncellendi.' };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'İmza güncellenemedi.'
            };
        }
    },
    
    canViewProfile(username) {
        // Kendi profiline herkes bakabilir
        if (this.currentUser && this.currentUser.username === username) {
            return true;
        }
        
        // Admin ve moderatör herkese bakabilir
        if (this.currentUser && (this.currentUser.role === 'admin' || this.currentUser.role === 'moderator')) {
            return true;
        }
        
        // Normal üyeler sadece kendi profillerine bakabilir
        return false;
    },
    
    canUserPost() {
        if (!this.currentUser) {
            return { allowed: false, message: 'Mesaj göndermek için giriş yapmalısınız.' };
        }
        
        // Susturulma kontrolü
        if (this.currentUser.muted_until) {
            const now = Math.floor(Date.now() / 1000);
            if (now < this.currentUser.muted_until) {
                const remainingMinutes = Math.ceil((this.currentUser.muted_until - now) / 60);
                const remainingDays = Math.ceil(remainingMinutes / 1440);
                return { 
                    allowed: false, 
                    message: `Hesabınız susturulmuş. Kalan süre: ${remainingDays} gün` 
                };
            }
        }
        
        return { allowed: true };
    },
    
    async incrementProfileView(username) {
        if (this.currentUser && this.currentUser.username === username) {
            return;
        }
        
        try {
            const user = await API.getUserByUsername(username);
            if (user) {
                const views = (user.profile_views || 0) + 1;
                await API.updateUser(user.id, { profile_views: views });
            }
        } catch (error) {
            console.error('Profil görüntülenme artırma hatası:', error);
        }
    }
};