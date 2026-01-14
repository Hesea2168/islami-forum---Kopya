// js/widgets/modal.js - Modal Yönetimi

const Modal = {
    create(content, className = 'modal-overlay') {
        const overlay = document.createElement('div');
        overlay.className = className;
        overlay.innerHTML = content;
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        return overlay;
    },
    
    close() {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.remove();
        }
    },
    
    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const overlay = this.create(`
                <div class="confirm-dialog">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    
                    ${options.choices ? `
                        <div class="confirm-options">
                            ${options.choices.map((choice, idx) => `
                                <label>
                                    <input type="radio" name="confirmChoice" value="${choice.value}" ${idx === 0 ? 'checked' : ''}>
                                    <span>${choice.label}</span>
                                </label>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="confirm-actions">
                        <button class="confirm-btn" id="modalConfirmBtn">${options.confirmText || 'Tamam'}</button>
                        <button class="cancel-btn" id="modalCancelBtn">${options.cancelText || 'İptal'}</button>
                    </div>
                </div>
            `);
            
            document.getElementById('modalConfirmBtn').addEventListener('click', () => {
                let result = true;
                if (options.choices) {
                    const selected = document.querySelector('input[name="confirmChoice"]:checked');
                    result = selected ? selected.value : null;
                }
                this.close();
                resolve(result);
            });
            
            document.getElementById('modalCancelBtn').addEventListener('click', () => {
                this.close();
                resolve(false);
            });
        });
    },
    
    alert(title, message) {
        return new Promise((resolve) => {
            const overlay = this.create(`
                <div class="confirm-dialog">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-actions">
                        <button class="confirm-btn" id="modalOkBtn">Tamam</button>
                    </div>
                </div>
            `);
            
            document.getElementById('modalOkBtn').addEventListener('click', () => {
                this.close();
                resolve(true);
            });
        });
    }
};