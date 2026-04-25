/**
 * Modal Dialog Manager
 * Handles all modal dialogs and notifications
 */

class Modal {
    /**
     * Show prompt dialog
     */
    static prompt(title, message, placeholder = '', defaultValue = '') {
        return new Promise((resolve) => {
            const modalId = `modal-${Utils.generateId()}`;
            const html = `
                <div class="modal-overlay" id="${modalId}">
                    <div class="modal-content animate-slideUp">
                        <div class="modal-header">
                            <h2>${title}</h2>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                            <input type="text" id="modalInput" placeholder="${placeholder}" value="${defaultValue}" class="input" style="margin-top: 12px;">
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="modalCancel">Cancel</button>
                            <button class="btn btn-primary" id="modalConfirm">OK</button>
                        </div>
                    </div>
                </div>
            `;

            const container = document.getElementById('modalContainer');
            container.insertAdjacentHTML('beforeend', html);

            const modal = document.getElementById(modalId);
            const input = document.getElementById('modalInput');
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');

            input.focus();

            const cleanup = () => {
                modal.remove();
            };

            const handleConfirm = () => {
                resolve(input.value);
                cleanup();
            };

            const handleCancel = () => {
                resolve(null);
                cleanup();
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleConfirm();
                if (e.key === 'Escape') handleCancel();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleCancel();
            });

            lucide.createIcons();
        });
    }

    /**
     * Show confirm dialog
     */
    static confirm(title, message) {
        return new Promise((resolve) => {
            const modalId = `modal-${Utils.generateId()}`;
            const html = `
                <div class="modal-overlay" id="${modalId}">
                    <div class="modal-content animate-slideUp">
                        <div class="modal-header">
                            <h2>${title}</h2>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" id="modalCancel">Cancel</button>
                            <button class="btn btn-danger" id="modalConfirm">Confirm</button>
                        </div>
                    </div>
                </div>
            `;

            const container = document.getElementById('modalContainer');
            container.insertAdjacentHTML('beforeend', html);

            const modal = document.getElementById(modalId);
            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');

            const cleanup = () => {
                modal.remove();
            };

            const handleConfirm = () => {
                resolve(true);
                cleanup();
            };

            const handleCancel = () => {
                resolve(false);
                cleanup();
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) handleCancel();
            });

            lucide.createIcons();
        });
    }

    /**
     * Show alert dialog
     */
    static alert(title, message) {
        return new Promise((resolve) => {
            const modalId = `modal-${Utils.generateId()}`;
            const html = `
                <div class="modal-overlay" id="${modalId}">
                    <div class="modal-content animate-slideUp">
                        <div class="modal-header">
                            <h2>${title}</h2>
                        </div>
                        <div class="modal-body">
                            <p>${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="modalOk">OK</button>
                        </div>
                    </div>
                </div>
            `;

            const container = document.getElementById('modalContainer');
            container.insertAdjacentHTML('beforeend', html);

            const modal = document.getElementById(modalId);
            const okBtn = document.getElementById('modalOk');

            const cleanup = () => {
                modal.remove();
            };

            okBtn.addEventListener('click', () => {
                resolve();
                cleanup();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    resolve();
                    cleanup();
                }
            });

            lucide.createIcons();
        });
    }
}

/**
 * Toast Notification Manager
 */
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const toastId = `toast-${Utils.generateId()}`;
        const typeClass = `toast-${type}`;

        const html = `
            <div class="toast ${typeClass} animate-slideUp" id="${toastId}">
                <div class="toast-content">
                    <i data-lucide="${this.getIcon(type)}"></i>
                    <span>${message}</span>
                </div>
                <button class="toast-close" id="toastClose-${toastId}">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        const container = document.getElementById('toastContainer');
        container.insertAdjacentHTML('beforeend', html);

        const toast = document.getElementById(toastId);
        const closeBtn = document.getElementById(`toastClose-${toastId}`);

        lucide.createIcons();

        const remove = () => {
            toast.classList.add('animate-slideOutRight');
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.addEventListener('click', remove);

        if (duration > 0) {
            setTimeout(remove, duration);
        }

        return toastId;
    }

    static success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    static getIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }
}

// Add styles for modals and toasts
const modalStyles = `
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    backdrop-filter: blur(2px);
}

.modal-content {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    width: 90%;
    max-width: 450px;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid var(--border);
}

.modal-header h2 {
    margin: 0;
    font-size: 18px;
    color: var(--text);
}

.modal-body {
    padding: 20px;
    color: var(--text-secondary);
    line-height: 1.6;
}

.modal-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.toast {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    min-width: 300px;
}

.toast-content {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text);
}

.toast-content i {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.toast-success {
    border-color: var(--success);
    color: var(--success);
}

.toast-error {
    border-color: var(--danger);
    color: var(--danger);
}

.toast-warning {
    border-color: var(--warning);
    color: var(--warning);
}

.toast-info {
    border-color: var(--accent);
    color: var(--accent);
}

.toast-close {
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity var(--transition);
    color: var(--text-secondary);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.toast-close:hover {
    opacity: 1;
}

.toast-close i {
    width: 16px;
    height: 16px;
}
`;

const style = document.createElement('style');
style.textContent = modalStyles;
document.head.appendChild(style);
