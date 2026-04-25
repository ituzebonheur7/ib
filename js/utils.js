/**
 * Utility functions for the IDE
 */

const Utils = {
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => (inThrottle = false), limit);
            }
        };
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = Utils.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },

    /**
     * Merge objects deeply
     */
    deepMerge(target, source) {
        const output = Utils.deepClone(target);
        if (Utils.isObject(target) && Utils.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (Utils.isObject(source[key])) {
                    if (!(key in output)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = Utils.deepMerge(output[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    },

    /**
     * Check if object
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    },

    /**
     * Get file extension
     */
    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    },

    /**
     * Get file icon name
     */
    getFileIcon(filename) {
        const ext = Utils.getFileExtension(filename).toLowerCase();
        const iconMap = {
            'html': 'layout-template',
            'htm': 'layout-template',
            'css': 'paintbrush',
            'scss': 'paintbrush',
            'sass': 'paintbrush',
            'less': 'paintbrush',
            'js': 'file-json-2',
            'jsx': 'file-json-2',
            'ts': 'file-json-2',
            'tsx': 'file-json-2',
            'json': 'braces',
            'xml': 'file-text',
            'svg': 'image',
            'png': 'image',
            'jpg': 'image',
            'jpeg': 'image',
            'gif': 'image',
            'md': 'file-text',
            'txt': 'file-text',
            'pdf': 'file-text',
            'zip': 'archive',
            'folder': 'folder'
        };
        return iconMap[ext] || 'file-code';
    },

    /**
     * Highlight syntax in plain text (basic)
     */
    highlightCode(code, language) {
        // This is a basic implementation
        // In production, you'd use a library like Prism or Highlight.js
        const keywords = {
            'javascript': ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class'],
            'html': ['div', 'span', 'p', 'h1', 'h2', 'h3', 'button', 'input', 'form'],
            'css': ['color', 'background', 'font', 'margin', 'padding', 'border', 'width', 'height']
        };
        return code;
    },

    /**
     * Format timestamp
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    },

    /**
     * Format file size
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    },

    /**
     * Parse nested path
     */
    parsePath(path) {
        const parts = path.split('/').filter(p => p);
        return parts;
    },

    /**
     * Get parent path
     */
    getParentPath(path) {
        const parts = Utils.parsePath(path);
        parts.pop();
        return parts.join('/');
    },

    /**
     * Get file name from path
     */
    getFileName(path) {
        return path.split('/').pop();
    },

    /**
     * Check if path is file (has extension)
     */
    isFilePath(path) {
        const name = Utils.getFileName(path);
        return name.includes('.');
    }
};

/**
 * Custom Event Emitter for internal communication
 */
class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event, listener) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
    }

    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }

    once(event, listener) {
        const onceWrapper = (data) => {
            listener(data);
            this.off(event, onceWrapper);
        };
        this.on(event, onceWrapper);
    }
}
