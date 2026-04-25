/**
 * Preview Engine Manager
 * Handles HTML/CSS/JS preview rendering
 */

class PreviewManager extends EventEmitter {
    constructor() {
        super();
        this.frame = null;
        this.lastPreview = '';
    }

    /**
     * Initialize preview iframe
     */
    init(frameId) {
        this.frame = document.getElementById(frameId);
        if (!this.frame) {
            console.error('Preview frame not found');
        }
    }

    /**
     * Get base tag for assets
     */
    getBaseTag(baseUrl = '') {
        if (!baseUrl) return '';
        const url = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
        return `<base href="${url}">`;
    }

    /**
     * Compile and render preview
     */
    render(htmlPath = 'index.html', cssPath = 'style.css', jsPath = 'script.js', baseUrl = '') {
        try {
            // Get file contents
            const htmlContent = filesystem.getFileContent(htmlPath) || '<h1>No HTML file found</h1>';
            const cssContent = filesystem.getFileContent(cssPath) || '';
            const jsContent = filesystem.getFileContent(jsPath) || '';

            // Inject styles and scripts
            let compiled = htmlContent;

            // Add base tag
            const baseTag = this.getBaseTag(baseUrl);
            if (baseTag) {
                if (compiled.includes('</head>')) {
                    compiled = compiled.replace('</head>', `${baseTag}\n</head>`);
                } else {
                    compiled = baseTag + compiled;
                }
            }

            // Inject CSS
            if (cssContent) {
                if (compiled.includes('</head>')) {
                    compiled = compiled.replace(
                        '</head>',
                        `<style>${cssContent}</style>\n</head>`
                    );
                } else {
                    compiled = `<style>${cssContent}</style>${compiled}`;
                }
            }

            // Inject JS
            if (jsContent) {
                if (compiled.includes('</body>')) {
                    compiled = compiled.replace(
                        '</body>',
                        `<script>${jsContent}<\/script>\n</body>`
                    );
                } else {
                    compiled += `<script>${jsContent}<\/script>`;
                }
            }

            // Create blob and set frame src
            const blob = new Blob([compiled], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            this.frame.src = url;
            this.lastPreview = compiled;

            this.emit('rendered', { htmlPath });
        } catch (error) {
            console.error('Preview render error:', error);
            this.renderError(error.message);
            this.emit('error', { error });
        }
    }

    /**
     * Render error in iframe
     */
    renderError(message) {
        const errorHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 20px;
                        background: #0d1117;
                        color: #f85149;
                        font-family: monospace;
                    }
                    .error {
                        background: rgba(248, 81, 73, 0.1);
                        border: 1px solid #f85149;
                        padding: 16px;
                        border-radius: 8px;
                    }
                    h3 { margin-top: 0; }
                </style>
            </head>
            <body>
                <div class="error">
                    <h3>Preview Error</h3>
                    <p>${Utils.escapeHtml(message)}</p>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([errorHtml], { type: 'text/html' });
        this.frame.src = URL.createObjectURL(blob);
    }

    /**
     * Get current HTML content
     */
    getHtml() {
        return this.lastPreview;
    }

    /**
     * Open in new tab
     */
    openInNewTab() {
        if (this.frame && this.frame.src) {
            window.open(this.frame.src, '_blank');
        }
    }

    /**
     * Export as HTML file
     */
    exportAsHtml(filename = 'index.html') {
        const html = this.getHtml();
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Resize preview
     */
    resizePreview(device) {
        if (!this.frame) return;

        this.frame.classList.remove('mobile', 'tablet');
        if (device === 'mobile') {
            this.frame.classList.add('mobile');
        } else if (device === 'tablet') {
            this.frame.classList.add('tablet');
        }
    }
}

// Global preview instance
const preview = new PreviewManager();
