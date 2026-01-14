// js/widgets/toast.js - Bildirim Mesajları

const Toast = {
    show(message, type = 'info', duration = 3000) {
        const ortaAlan = document.getElementById('ortaAlan');
        if (!ortaAlan) return;
        
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.style.cssText = `
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 500;
            animation: slideDown 0.3s ease;
        `;
        
        switch(type) {
            case 'error':
                toast.style.background = '#fee';
                toast.style.color = '#c33';
                toast.style.border = '2px solid #fcc';
                break;
            case 'success':
                toast.style.background = '#efe';
                toast.style.color = '#3c3';
                toast.style.border = '2px solid #cfc';
                break;
            case 'warning':
                toast.style.background = '#fff3cd';
                toast.style.color = '#856404';
                toast.style.border = '2px solid #ffc107';
                break;
            default:
                toast.style.background = '#e7f3ff';
                toast.style.color = '#0066cc';
                toast.style.border = '2px solid #b3d9ff';
        }
        
        toast.textContent = message;
        ortaAlan.insertBefore(toast, ortaAlan.firstChild);
        
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    error(message) {
        this.show(message, 'error');
    },
    
    success(message) {
        this.show(message, 'success');
    },
    
    warning(message) {
        this.show(message, 'warning');
    },
    
    info(message) {
        this.show(message, 'info');
    }
};