// js/auth/auth.logic.js - Auth İş Mantığı

const AuthLogic = {
    async handleRegister(username, password) {
        const result = await AuthService.register(username.trim(), password);
        
        if (result.success) {
            Toast.success(result.message);
            setTimeout(() => {
                Modal.close();
                AuthUI.showLoginModal();
            }, 1500);
        } else {
            return result.message;
        }
    },
    
    async handleLogin(username, password) {
        const result = await AuthService.login(username.trim(), password);
        
        if (result.success) {
            if (result.requiresSecondStage) {
                AuthUI.showAdminSecondStage();
                return;
            }
            
            Modal.close();
            App.updateUI();
            Toast.success('Giriş başarılı!');
            
            if (window.Widgets) {
                Widgets.updateIcerdekiler();
            }
        } else {
            return result.message;
        }
    },
    
    async handleAdminSecondStage(username, password) {
        const result = await AuthService.adminSecondStage(username.trim(), password);
        
        if (result.success) {
            Modal.close();
            App.updateUI();
            Toast.success('Admin girişi başarılı!');
            
            if (window.Widgets) {
                Widgets.updateIcerdekiler();
            }
        } else {
            return result.message;
        }
    },
    
    async handleLogout() {
        await AuthService.logout();
        Modal.close();
        App.updateUI();
        Toast.info('Çıkış yapıldı.');
        
        if (window.Widgets) {
            Widgets.updateIcerdekiler();
        }
    },
    
    async handleUsernameChange(newUsername) {
        const result = await AuthService.updateUsername(newUsername.trim());
        
        if (result.success) {
            Toast.success(result.message);
            Modal.close();
            App.updateUI();
        } else {
            Toast.error(result.message);
        }
    },
    
    async handleProfileSave(signature) {
        const result = await AuthService.updateSignature(signature);
        
        if (result.success) {
            Toast.success(result.message);
            Modal.close();
        }
    },
    
    async getUserStats(username) {
        try {
            const topicCount = await API.getUserTopicCount(username);
            const replyCount = await API.getUserReplyCount(username);
            const totalMessages = topicCount + replyCount;
            const rank = this.getUserRank(username, totalMessages);
            const user = await API.getUserByUsername(username);
            
            return {
                topicCount,
                replyCount,
                totalMessages,
                rank,
                profileViews: user ? (user.profileViews || 0) : 0
            };
        } catch (error) {
            console.error('Kullanıcı istatistikleri alınırken hata:', error);
            return {
                topicCount: 0,
                replyCount: 0,
                totalMessages: 0,
                rank: this.getUserRank(username, 0),
                profileViews: 0
            };
        }
    },
    
    getUserRank(username, totalMessages) {
        const ranks = [
            { name: 'Yeni Üye', min: 0, max: 9, icon: '🌱' },
            { name: 'Başlangıç Üyesi', min: 10, max: 39, icon: '🌿' },
            { name: 'Katılımcı Üye', min: 40, max: 99, icon: '🍀' },
            { name: 'Aktif Üye', min: 100, max: 199, icon: '🌳' },
            { name: 'Tecrübeli Üye', min: 200, max: 399, icon: '⭐' },
            { name: 'Deneyimli Üye', min: 400, max: 699, icon: '✨' },
            { name: 'Kıdemli Üye', min: 700, max: 1099, icon: '💫' },
            { name: 'Uzman Üye', min: 1100, max: 1599, icon: '🏆' },
            { name: 'Elit Üye', min: 1600, max: 2299, icon: '👑' },
            { name: 'Efsane Üye', min: 2300, max: Infinity, icon: '💎' }
        ];
        
        for (let rank of ranks) {
            if (totalMessages >= rank.min && totalMessages <= rank.max) {
                return rank;
            }
        }
        
        return ranks[0];
    },
    
    async handleProfileView(username) {
        try {
            const user = await API.getUserByUsername(username);
            if (!user) {
                Toast.error('Kullanıcı bulunamadı.');
                return;
            }
            
            // Log kaydı
            if (AuthService.currentUser) {
                const logType = AuthService.currentUser.role === 'moderator' ? 'mod_profile_view' : 'member_profile_view';
                const logAction = AuthService.currentUser.role === 'moderator' ? 'Moderatör Profil Görüntüleme' : 'Üye Profil Görüntüleme';
                await API.addLog(
                    logType, 
                    logAction, 
                    `${AuthService.currentUser.username} adlı ${AuthService.currentUser.role === 'moderator' ? 'moderatörünüz' : 'üye'} "${username}" adlı ${user.role === 'moderator' ? 'moderatörün' : 'üyenin'} profiline baktı.`, 
                    AuthService.currentUser.username, 
                    AuthService.currentUser.role
                );
            }
            
            await AuthService.incrementProfileView(username);
            AuthUI.showPublicProfile(username);
        } catch (error) {
            console.error('Profil görüntüleme hatası:', error);
            Toast.error('Profil yüklenirken hata oluştu.');
        }
    }
};