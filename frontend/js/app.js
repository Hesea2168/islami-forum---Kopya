// js/app.js - Ana Uygulama Koordinasyonu

const App = {
    currentActivity: {
        category: null,
        topic: null,
        startTime: null,
        activityId: null
    },
    
    visitorSessionId: null,
    activeUsers: new Set(),
    
    async init() {
        Storage.init?.();
        API.init();
        await AuthService.init();
        AuthUI.init();
        Admin.init();
        Categories.init();
        
        this.updateUI();
        this.bindEvents();
        this.bindCalendarButton();
        
        // Ziyaretçi tracking başlat
        this.initVisitorTracking();
        
        if (window.Widgets) {
            Widgets.init();
        }
        
        // Sayfa kapatıldığında temizlik
        window.addEventListener('beforeunload', () => {
            this.cleanupSession();
        });
    },
    
    initVisitorTracking() {
        // Benzersiz session ID oluştur
        this.visitorSessionId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Aktif session'ları kaydet
        let activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '{}');
        activeSessions[this.visitorSessionId] = {
            timestamp: Date.now(),
            isLoggedIn: !!AuthService.currentUser,
            username: AuthService.currentUser?.username || null
        };
        localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
        
        // Toplam ziyaretçi sayısını artır (ilk ziyarette)
        API.incrementVisitors();
        
        // Her 30 saniyede bir session'ı güncelle
        setInterval(() => {
            this.updateSession();
            this.cleanOldSessions();
        }, 30000);
        
        // Kullanıcı aktivitesini takip et
        if (AuthService.currentUser) {
            this.updateUserActivity();
            setInterval(() => this.updateUserActivity(), 60000);
        }
    },
    
    updateSession() {
        let activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '{}');
        if (activeSessions[this.visitorSessionId]) {
            activeSessions[this.visitorSessionId].timestamp = Date.now();
            activeSessions[this.visitorSessionId].isLoggedIn = !!AuthService.currentUser;
            activeSessions[this.visitorSessionId].username = AuthService.currentUser?.username || null;
            localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
        }
    },
    
    cleanOldSessions() {
        // 5 dakikadan eski session'ları temizle
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        let activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '{}');
        
        Object.keys(activeSessions).forEach(sessionId => {
            if (activeSessions[sessionId].timestamp < fiveMinutesAgo) {
                delete activeSessions[sessionId];
            }
        });
        
        localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
    },
    
    cleanupSession() {
        // Sayfa kapatıldığında session'ı kaldır
        let activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '{}');
        delete activeSessions[this.visitorSessionId];
        localStorage.setItem('active_sessions', JSON.stringify(activeSessions));
    },
    
    async updateUserActivity() {
        if (AuthService.currentUser) {
            try {
                const user = await API.getUserByUsername(AuthService.currentUser.username);
                if (user) {
                    await API.updateUser(user.id, { lastActivity: Date.now() });
                }
            } catch (error) {
                console.error('Kullanıcı aktivite güncelleme hatası:', error);
            }
        }
    },
    
    getActiveStats() {
        this.cleanOldSessions();
        const activeSessions = JSON.parse(localStorage.getItem('active_sessions') || '{}');
        
        let loggedInCount = 0;
        let guestCount = 0;
        
        Object.values(activeSessions).forEach(session => {
            if (session.isLoggedIn) {
                loggedInCount++;
            } else {
                guestCount++;
            }
        });
        
        return {
            loggedIn: loggedInCount,
            guests: guestCount,
            total: loggedInCount + guestCount
        };
    },
    
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 150);
            }
        });
    },
    
    bindCalendarButton() {
        document.querySelectorAll('.sistem-btn').forEach(btn => {
            if (btn.textContent.includes('Takvim')) {
                btn.addEventListener('click', () => this.showCalendar());
            }
        });
    },
    
    showCalendar() {
        // Türkiye saat dilimi (UTC+3)
        const now = new Date();
        const turkeyOffset = 3 * 60; // dakika cinsinden
        const localOffset = now.getTimezoneOffset();
        const turkeyTime = new Date(now.getTime() + (turkeyOffset + localOffset) * 60000);
        
        // MİLADİ TAKVİM
        const miladiDate = turkeyTime.toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        });
        
        // HİCRİ TAKVİM HESAPLAMA (Doğru Algoritma)
        const miladiYear = turkeyTime.getFullYear();
        const miladiMonth = turkeyTime.getMonth() + 1; // 1-12
        const miladiDay = turkeyTime.getDate();
        
        // Hicri takvim hesaplama fonksiyonu
        const gregorianToHijri = (year, month, day) => {
            // Jülyen günü hesaplama
            let a = Math.floor((14 - month) / 12);
            let y = year + 4800 - a;
            let m = month + 12 * a - 3;
            let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
            
            // Hicri tarihe çevirme
            let l = jd - 1948440 + 10632;
            let n = Math.floor((l - 1) / 10631);
            l = l - 10631 * n + 354;
            let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
            l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
            
            let hijriMonth = Math.floor((24 * l) / 709);
            let hijriDay = l - Math.floor((709 * hijriMonth) / 24);
            let hijriYear = 30 * n + j - 30;
            
            return { year: hijriYear, month: hijriMonth, day: hijriDay };
        };
        
        const hijri = gregorianToHijri(miladiYear, miladiMonth, miladiDay);
        
        const hijriMonths = [
            'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 
            'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 
            'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'
        ];
        
        const hicriDate = `${hijri.day} ${hijriMonths[hijri.month - 1]} ${hijri.year}`;
        
        // RUMİ TAKVİM HESAPLAMA
        // Rumi takvim Miladi takvimden 584 yıl 13 gün geridedir
        let rumiYear = miladiYear - 584;
        let rumiMonth = miladiMonth;
        let rumiDay = miladiDay - 13;
        
        // Gün düzeltmesi
        if (rumiDay <= 0) {
            rumiMonth--;
            if (rumiMonth <= 0) {
                rumiMonth = 12;
                rumiYear--;
            }
            // Önceki ayın gün sayısı
            const daysInPrevMonth = new Date(miladiYear, rumiMonth, 0).getDate();
            rumiDay += daysInPrevMonth;
        }
        
        const rumiMonths = [
            'Kânûn-i Sânî', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
            'Temmuz', 'Ağustos', 'Eylül', 'Teşrîn-i Evvel', 'Teşrîn-i Sânî', 'Kânûn-i Evvel'
        ];
        
        const rumiDate = `${rumiDay} ${rumiMonths[rumiMonth - 1]} ${rumiYear}`;
        
        // Modal gösterimi
        const overlay = document.createElement('div');
        overlay.className = 'calendar-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        overlay.innerHTML = `
            <div style="
                background: white;
                padding: 45px;
                border-radius: 16px;
                max-width: 600px;
                width: 90%;
                text-align: center;
                position: relative;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.4s ease;
            ">
                <button onclick="this.closest('.calendar-modal-overlay').remove()" style="
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    color: white;
                    border: none;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 12px rgba(245, 87, 108, 0.4);
                " onmouseenter="this.style.transform='rotate(90deg) scale(1.1)'" onmouseleave="this.style.transform='rotate(0) scale(1)'">&times;</button>
                
                <h2 style="
                    color: #667eea; 
                    margin-bottom: 35px; 
                    font-size: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                ">
                    <span style="font-size: 36px;">📅</span>
                    <span>Takvim</span>
                </h2>
                
                <!-- Miladi Takvim -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
                    transform: translateY(0);
                    transition: transform 0.3s ease;
                " onmouseenter="this.style.transform='translateY(-5px)'" onmouseleave="this.style.transform='translateY(0)'">
                    <div style="font-size: 16px; opacity: 0.95; margin-bottom: 8px; font-weight: 600;">🌍 Miladi Tarih</div>
                    <div style="font-size: 22px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${miladiDate}</div>
                </div>
                
                <!-- Hicri Takvim -->
                <div style="
                    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    box-shadow: 0 8px 20px rgba(67, 233, 123, 0.3);
                    transform: translateY(0);
                    transition: transform 0.3s ease;
                " onmouseenter="this.style.transform='translateY(-5px)'" onmouseleave="this.style.transform='translateY(0)'">
                    <div style="font-size: 16px; opacity: 0.95; margin-bottom: 8px; font-weight: 600;">🌙 Hicri Tarih</div>
                    <div style="font-size: 22px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${hicriDate}</div>
                </div>
                
                <!-- Rumi Takvim -->
                <div style="
                    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(250, 112, 154, 0.3);
                    transform: translateY(0);
                    transition: transform 0.3s ease;
                " onmouseenter="this.style.transform='translateY(-5px)'" onmouseleave="this.style.transform='translateY(0)'">
                    <div style="font-size: 16px; opacity: 0.95; margin-bottom: 8px; font-weight: 600;">📜 Rumi Tarih</div>
                    <div style="font-size: 22px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${rumiDate}</div>
                </div>
                
                <div style="
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 2px solid #f0f0f0;
                    color: #999;
                    font-size: 13px;
                ">
                    ⏰ Türkiye Saat Dilimi (UTC+3)
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    },
    
    updateUI() {
        const kayitBtn = document.getElementById('kayitBtn');
        const girisBtn = document.getElementById('girisBtn');
        const profilBtn = document.getElementById('profilBtn');
        const adminPanelBtn = document.getElementById('adminPanelBtn');
        
        if (AuthService.currentUser) {
            kayitBtn.style.display = 'none';
            girisBtn.style.display = 'none';
            profilBtn.style.display = 'inline-block';
            
            if (AuthService.currentUser.role === 'admin') {
                adminPanelBtn.style.display = 'inline-block';
            }
        } else {
            kayitBtn.style.display = 'inline-block';
            girisBtn.style.display = 'inline-block';
            profilBtn.style.display = 'none';
            adminPanelBtn.style.display = 'none';
        }
    },
    
    clearMiddleSection() {
        const ortaAlan = document.getElementById('ortaAlan');
        if (ortaAlan) ortaAlan.innerHTML = '';
    },
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
        
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} gün önce`;
        }
        
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    },
    
    async startCategoryVisit(category, categoryName) {
        if (this.currentActivity.startTime) {
            const duration = Date.now() - this.currentActivity.startTime;
            if (this.currentActivity.activityId) {
                try {
                    await API.updateActivity(this.currentActivity.activityId, duration);
                } catch (error) {
                    console.error('Aktivite güncelleme hatası:', error);
                }
            }
        }
        
        try {
            const activityId = await API.addActivity(
                AuthService.currentUser.username,
                AuthService.currentUser.role,
                'category_visit',
                { category, categoryName }
            );
            
            this.currentActivity = {
                category,
                topic: null,
                startTime: Date.now(),
                activityId
            };
        } catch (error) {
            console.error('Aktivite başlatma hatası:', error);
        }
    },
    
    async startTopicView(topicId, topicTitle, category) {
        if (this.currentActivity.startTime) {
            const duration = Date.now() - this.currentActivity.startTime;
            if (this.currentActivity.activityId) {
                try {
                    await API.updateActivity(this.currentActivity.activityId, duration);
                } catch (error) {
                    console.error('Aktivite güncelleme hatası:', error);
                }
            }
        }
        
        try {
            const activityId = await API.addActivity(
                AuthService.currentUser.username,
                AuthService.currentUser.role,
                'topic_view',
                { topicId, topicTitle, category }
            );
            
            this.currentActivity = {
                category,
                topic: topicId,
                startTime: Date.now(),
                activityId
            };
        } catch (error) {
            console.error('Aktivite başlatma hatası:', error);
        }
    }
};

// CSS animasyonları
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});