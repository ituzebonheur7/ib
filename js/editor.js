/**
 * Monaco Editor Manager
 * Handles editor initialization and operations
 */

class EditorManager extends EventEmitter {
    constructor() {
        super();
        this.editor = null;
        this.models = new Map();
        this.currentPath = null;
        this.isReady = false;
        this.autoSaveTimer = null;
    }

    /**
     * Initialize Monaco Editor
     */
    async init(containerId) {
        return new Promise((resolve) => {
            require.config({
                paths: {
                    vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.53.0/min/vs'
                }
            });

            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(
                    document.getElementById(containerId),
                    {
                        theme: 'vs-dark',
                        language: 'html',
                        value: '',
                        automaticLayout: true,
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineHeight: 21,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        scrollBeyondLastLine: false,
                        formatOnPaste: true,
                        formatOnType: true,
                        autoClosingBrackets: 'always',
                        autoClosingQuotes: 'always',
                        autoIndent: 'full',
                        tabSize: 4,
                        insertSpaces: true,
                        folding: true,
                        foldingStrategy: 'indentation'
                    }
                );

                // Add editor change listener
                this.editor.onDidChangeModelContent(() => {
                    this.emit('content-changed', { path: this.currentPath });
                    this.debouncedAutoSave();
                });

                // Add keyboard shortcuts
                this.setupKeyboardShortcuts();

                this.isReady = true;
                resolve();
            });
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        // Ctrl+S / Cmd+S: Save
        this.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
            () => {
                this.save();
                this.emit('file-saved', { path: this.currentPath });
            }
        );

        // Ctrl+Enter / Cmd+Enter: Run
        this.editor.addCommand(
            monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
            () => {
                this.emit('run-requested', {});
            }
        );
    }

    /**
     * Create or get model
     */
    getOrCreateModel(path, language, content = '') {
        if (this.models.has(path)) {
            return this.models.get(path);
        }

        const uri = monaco.Uri.parse(`file:///${path}`);
        let model = monaco.editor.getModel(uri);

        if (!model) {
            model = monaco.editor.createModel(content, language, uri);
        }

        this.models.set(path, model);
        return model;
    }

    /**
     * Open file in editor
     */
    openFile(path, language) {
        const content = filesystem.getFileContent(path);
        const model = this.getOrCreateModel(path, language, content);

        if (this.editor && model) {
            this.editor.setModel(model);
            this.currentPath = path;
            this.editor.focus();
            this.emit('file-opened', { path });
        }
    }

    /**
     * Get current content
     */
    getContent() {
        return this.editor ? this.editor.getValue() : '';
    }

    /**
     * Set content
     */
    setContent(content) {
        if (this.editor) {
            this.editor.setValue(content);
        }
    }

    /**
     * Save current file
     */
    save() {
        if (this.currentPath && this.editor) {
            const content = this.editor.getValue();
            filesystem.updateFileContent(this.currentPath, content);
            return true;
        }
        return false;
    }

    /**
     * Debounced auto-save
     */
    debouncedAutoSave = Utils.debounce(() => {
        if (this.save()) {
            this.emit('auto-saved', { path: this.currentPath });
        }
    }, 1000);

    /**
     * Update editor options
     */
    updateOptions(options) {
        if (this.editor) {
            this.editor.updateOptions(options);
        }
    }

    /**
     * Change theme
     */
    setTheme(theme) {
        if (this.editor) {
            monaco.editor.setTheme(theme);
        }
    }

    /**
     * Change language
     */
    setLanguage(language) {
        if (this.editor && this.currentPath) {
            const model = this.editor.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
            }
        }
    }

    /**
     * Get language from filename
     */
    static getLanguageFromFilename(filename) {
        const ext = Utils.getFileExtension(filename);
        const langMap = {
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'scss',
            'less': 'less',
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'json': 'json',
            'xml': 'xml',
            'svg': 'xml',
            'md': 'markdown',
            'txt': 'plaintext'
        };
        return langMap[ext] || 'plaintext';
    }

    /**
     * Close file
     */
    closeFile(path) {
        this.models.delete(path);
        if (this.currentPath === path) {
            this.currentPath = null;
            if (this.editor) {
                this.editor.setModel(null);
            }
        }
    }

    /**
     * Clear all
     */
    clear() {
        this.models.forEach((model) => model.dispose());
        this.models.clear();
        this.currentPath = null;
        if (this.editor) {
            this.editor.setModel(null);
        }
    }
}

// Global editor instance
const editor = new EditorManager();
