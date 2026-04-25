/**
 * UI Manager
 * Handles file tree, tabs, and sidebar rendering
 */

class UIManager extends EventEmitter {
    constructor() {
        super();
        this.openTabs = [];
        this.activeFile = null;
        this.contextMenuTarget = null;
    }

    /**
     * Initialize UI
     */
    init() {
        this.setupEventListeners();
        this.renderFileTree();
        this.renderTabs();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Header buttons
        document.getElementById('btnNewFile').addEventListener('click', () => this.createNewFile());
        document.getElementById('btnNewFolder').addEventListener('click', () => this.createNewFolder());
        document.getElementById('btnSettings').addEventListener('click', () => this.toggleSettings());
        document.getElementById('btnExport').addEventListener('click', () => this.showExportMenu());
        document.getElementById('btnImport').addEventListener('click', () => this.handleImport());
        document.getElementById('btnRun').addEventListener('click', () => this.runCode());

        // Preview buttons
        document.getElementById('btnDesktop').addEventListener('click', () => preview.resizePreview('desktop'));
        document.getElementById('btnTablet').addEventListener('click', () => preview.resizePreview('tablet'));
        document.getElementById('btnMobile').addEventListener('click', () => preview.resizePreview('mobile'));

        // Settings
        document.getElementById('btnCloseSettings').addEventListener('click', () => this.toggleSettings());
        document.getElementById('settingTheme').addEventListener('change', (e) => this.changeSetting('theme', e.target.value));
        document.getElementById('settingFont').addEventListener('change', (e) => this.changeSetting('font', e.target.value));
        document.getElementById('settingFontSize').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('fontSizeValue').textContent = value + 'px';
            this.changeSetting('fontSize', parseInt(value));
        });
        document.getElementById('settingLineHeight').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('lineHeightValue').textContent = value;
            this.changeSetting('lineHeight', parseFloat(value));
        });
        document.getElementById('settingLineNumbers').addEventListener('change', (e) => this.changeSetting('lineNumbers', e.target.checked));
        document.getElementById('settingWordWrap').addEventListener('change', (e) => this.changeSetting('wordWrap', e.target.checked ? 'on' : 'off'));
        document.getElementById('settingAutoRun').addEventListener('change', (e) => this.changeSetting('autoRun', e.target.checked));
        document.getElementById('settingMinimap').addEventListener('change', (e) => this.changeSetting('minimap', e.target.checked));
        document.getElementById('settingBaseUrl').addEventListener('change', (e) => this.changeSetting('baseUrl', e.target.value));
        document.getElementById('btnClearStorage').addEventListener('click', () => this.clearAllData());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Context menu
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        document.addEventListener('click', () => this.hideContextMenu());

        // File tree
        document.getElementById('fileTree').addEventListener('click', (e) => this.handleFileTreeClick(e));

        // Resizer
        this.setupResizer();

        // Drag and drop
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => this.handleFileDrop(e));
    }

    /**
     * Render file tree
     */
    renderFileTree() {
        const container = document.getElementById('fileTree');
        container.innerHTML = '';

        const buildTree = (obj, parent, basePath = '') => {
            const items = Object.keys(obj)
                .sort((a, b) => {
                    if (obj[a].type === obj[b].type) return a.localeCompare(b);
                    return obj[a].type === 'folder' ? -1 : 1;
                });

            for (const key of items) {
                const fullPath = basePath ? `${basePath}/${key}` : key;
                const isActive = fullPath === this.activeFile;

                const itemEl = document.createElement('div');
                itemEl.className = `tree-item ${isActive ? 'active' : ''} file-${obj[key].type}`;
                if (obj[key].type === 'folder') {
                    itemEl.classList.add('folder-icon');
                } else {
                    const ext = Utils.getFileExtension(key).toLowerCase();
                    itemEl.classList.add(`file-${ext}`);
                }
                itemEl.setAttribute('data-path', fullPath);
                itemEl.setAttribute('data-type', obj[key].type);

                const icon = Utils.getFileIcon(key);
                itemEl.innerHTML = `
                    <i data-lucide="${icon}"></i>
                    <span>${key}</span>
                `;

                itemEl.addEventListener('click', () => {
                    if (obj[key].type === 'file') {
                        this.openFile(fullPath);
                    }
                });

                itemEl.addEventListener('dblclick', () => {
                    if (obj[key].type === 'folder') {
                        itemEl.classList.toggle('expanded');
                        const childrenContainer = itemEl.nextElementSibling;
                        if (childrenContainer && childrenContainer.classList.contains('tree-item-children')) {
                            childrenContainer.classList.toggle('expanded');
                        }
                    }
                });

                parent.appendChild(itemEl);

                // Render folder children
                if (obj[key].type === 'folder') {
                    const childContainer = document.createElement('div');
                    childContainer.className = 'tree-item-children';
                    const indent = document.createElement('div');
                    indent.className = 'tree-indent';
                    childContainer.appendChild(indent);
                    parent.appendChild(childContainer);

                    buildTree(obj[key].children, indent, fullPath);
                }
            }
        };

        buildTree(filesystem.getFiles(), container);
        lucide.createIcons();
    }

    /**
     * Render tabs
     */
    renderTabs() {
        const bar = document.getElementById('tabBar');
        bar.innerHTML = '';

        for (const path of this.openTabs) {
            const name = Utils.getFileName(path);
            const isActive = path === this.activeFile;

            const tab = document.createElement('div');
            tab.className = `tab ${isActive ? 'active' : ''}`;
            tab.setAttribute('data-path', path);

            const ext = Utils.getFileExtension(path);
            const icon = Utils.getFileIcon(path);

            tab.innerHTML = `
                <i data-lucide="${icon}" style="width: 14px; height: 14px;"></i>
                <div class="tab-name">${name}</div>
                <div class="tab-close">
                    <i data-lucide="x"></i>
                </div>
            `;

            tab.addEventListener('click', () => this.openFile(path));
            const closeBtn = tab.querySelector('.tab-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(path);
            });

            bar.appendChild(tab);
        }

        lucide.createIcons();
    }

    /**
     * Open file
     */
    openFile(path) {
        this.activeFile = path;

        if (!this.openTabs.includes(path)) {
            this.openTabs.push(path);
        }

        const language = EditorManager.getLanguageFromFilename(path);
        editor.openFile(path, language);
        this.renderTabs();
        this.renderFileTree();
        this.runCode();
    }

    /**
     * Close tab
     */
    closeTab(path) {
        this.openTabs = this.openTabs.filter(p => p !== path);
        editor.closeFile(path);

        if (this.activeFile === path) {
            if (this.openTabs.length > 0) {
                this.openFile(this.openTabs[0]);
            } else {
                this.activeFile = null;
            }
        }

        this.renderTabs();
    }

    /**
     * Create new file
     */
    async createNewFile() {
        const name = await Modal.prompt('New File', 'Enter file name:', 'index.html', '');
        if (name && name.trim()) {
            try {
                filesystem.createFile(name.trim(), '');
                await storage.saveProject('default-project', filesystem.getFiles());
                this.renderFileTree();
                this.openFile(name.trim());
                Toast.success(`File "${name}" created`);
            } catch (error) {
                Toast.error(error.message);
            }
        }
    }

    /**
     * Create new folder
     */
    async createNewFolder() {
        const name = await Modal.prompt('New Folder', 'Enter folder name:', 'assets', '');
        if (name && name.trim()) {
            try {
                filesystem.createFolder(name.trim());
                await storage.saveProject('default-project', filesystem.getFiles());
                this.renderFileTree();
                Toast.success(`Folder "${name}" created`);
            } catch (error) {
                Toast.error(error.message);
            }
        }
    }

    /**
     * Handle file tree click
     */
    handleFileTreeClick(e) {
        const item = e.target.closest('.tree-item');
        if (item) {
            const path = item.getAttribute('data-path');
            const type = item.getAttribute('data-type');

            if (type === 'file') {
                this.openFile(path);
            }
        }
    }

    /**
     * Handle context menu
     */
    handleContextMenu(e) {
        const item = e.target.closest('.tree-item');
        if (!item) return;

        e.preventDefault();
        this.contextMenuTarget = item.getAttribute('data-path');

        const menu = document.getElementById('contextMenu');
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';
        menu.classList.add('show');

        // Setup menu items
        const menuItems = menu.querySelectorAll('.menu-item');
        menuItems.forEach(menuItem => {
            menuItem.onclick = (e) => {
                e.stopPropagation();
                this.handleMenuAction(menuItem.getAttribute('data-action'));
                this.hideContextMenu();
            };
        });
    }

    /**
     * Hide context menu
     */
    hideContextMenu() {
        const menu = document.getElementById('contextMenu');
        menu.classList.remove('show');
    }

    /**
     * Handle menu action
     */
    async handleMenuAction(action) {
        if (!this.contextMenuTarget) return;

        const path = this.contextMenuTarget;

        if (action === 'new-file') {
            const name = await Modal.prompt('New File', 'Enter file name:');
            if (name) {
                try {
                    const newPath = `${path}/${name}`;
                    filesystem.createFile(newPath, '');
                    await storage.saveProject('default-project', filesystem.getFiles());
                    this.renderFileTree();
                } catch (error) {
                    Toast.error(error.message);
                }
            }
        } else if (action === 'new-folder') {
            const name = await Modal.prompt('New Folder', 'Enter folder name:');
            if (name) {
                try {
                    const newPath = `${path}/${name}`;
                    filesystem.createFolder(newPath);
                    await storage.saveProject('default-project', filesystem.getFiles());
                    this.renderFileTree();
                } catch (error) {
                    Toast.error(error.message);
                }
            }
        } else if (action === 'rename') {
            const newName = await Modal.prompt('Rename', 'Enter new name:', '', Utils.getFileName(path));
            if (newName && newName !== Utils.getFileName(path)) {
                try {
                    const newPath = filesystem.renameItem(path, newName);
                    if (this.activeFile === path) {
                        this.activeFile = newPath;
                    }
                    this.openTabs = this.openTabs.map(p => p === path ? newPath : p);
                    await storage.saveProject('default-project', filesystem.getFiles());
                    this.renderFileTree();
                    this.renderTabs();
                } catch (error) {
                    Toast.error(error.message);
                }
            }
        } else if (action === 'delete') {
            const confirmed = await Modal.confirm('Delete Item', `Are you sure you want to delete "${Utils.getFileName(path)}"?`);
            if (confirmed) {
                try {
                    filesystem.deleteItem(path);
                    this.openTabs = this.openTabs.filter(p => !p.startsWith(path));
                    if (this.activeFile === path || this.activeFile.startsWith(path + '/')) {
                        if (this.openTabs.length > 0) {
                            this.openFile(this.openTabs[0]);
                        } else {
                            this.activeFile = null;
                        }
                    }
                    await storage.saveProject('default-project', filesystem.getFiles());
                    this.renderFileTree();
                    this.renderTabs();
                    Toast.success('Item deleted');
                } catch (error) {
                    Toast.error(error.message);
                }
            }
        }
    }

    /**
     * Toggle settings panel
     */
    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        panel.classList.toggle('show');
    }

    /**
     * Change setting
     */
    async changeSetting(key, value) {
        const settings = await this.loadSettings();
        settings[key] = value;
        await storage.saveSettings(settings);

        // Apply settings
        this.applySettings(settings);
    }

    /**
     * Load settings
     */
    async loadSettings() {
        const stored = await storage.loadSettings();
        return stored || this.getDefaultSettings();
    }

    /**
     * Get default settings
     */
    getDefaultSettings() {
        return {
            theme: 'vs-dark',
            font: "'Fira Code', 'JetBrains Mono', monospace",
            fontSize: 14,
            lineHeight: 1.5,
            lineNumbers: true,
            wordWrap: 'on',
            autoRun: true,
            minimap: false,
            baseUrl: ''
        };
    }

    /**
     * Apply settings
     */
    applySettings(settings) {
        // Apply editor settings
        editor.updateOptions({
            theme: settings.theme,
            fontFamily: settings.font,
            fontSize: settings.fontSize,
            lineHeight: settings.lineHeight * 14,
            lineNumbers: settings.lineNumbers ? 'on' : 'off',
            wordWrap: settings.wordWrap,
            minimap: { enabled: settings.minimap }
        });

        monaco.editor.setTheme(settings.theme);

        // Update auto-run indicator
        const indicator = document.getElementById('autoRunStatus');
        const text = document.getElementById('autoRunText');
        if (settings.autoRun) {
            indicator.classList.remove('off');
            text.textContent = 'Auto-run: ON';
        } else {
            indicator.classList.add('off');
            text.textContent = 'Auto-run: OFF';
        }
    }

    /**
     * Handle search
     */
    handleSearch(query) {
        if (!query.trim()) {
            this.renderFileTree();
            return;
        }

        const results = filesystem.searchFiles(query);
        const container = document.getElementById('fileTree');
        container.innerHTML = '';

        if (results.length === 0) {
            container.innerHTML = '<div class="tree-item" style="color: var(--text-secondary);">No results found</div>';
            return;
        }

        for (const result of results) {
            const item = document.createElement('div');
            item.className = `tree-item file-${result.type}`;
            item.setAttribute('data-path', result.path);

            const icon = Utils.getFileIcon(result.name);
            item.innerHTML = `
                <i data-lucide="${icon}"></i>
                <span>${result.name}</span>
            `;

            item.addEventListener('click', () => {
                if (result.type === 'file') {
                    this.openFile(result.path);
                }
            });

            container.appendChild(item);
        }

        lucide.createIcons();
    }

    /**
     * Run code
     */
    runCode() {
        const settings = document.getElementById('settingAutoRun').checked;
        if (!settings) return;

        // Find first HTML file
        const htmlFiles = filesystem.getHtmlFiles();
        const mainHtmlFile = htmlFiles.length > 0 ? htmlFiles[0].path : 'index.html';
        const baseUrl = document.getElementById('settingBaseUrl').value;

        preview.render(mainHtmlFile, 'style.css', 'script.js', baseUrl);
    }

    /**
     * Show export menu
     */
    async showExportMenu() {
        const choice = await Modal.confirm('Export Project', 'Choose format:\n\nZIP - Compressed archive\nJSON - Text format');
        if (choice) {
            exportImport.exportAsZip('ituze-project');
        } else {
            exportImport.exportAsJson('ituze-project');
        }
    }

    /**
     * Handle import
     */
    handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await exportImport.handleFileDrop([file]);
                this.renderFileTree();
            }
        };
        input.click();
    }

    /**
     * Handle file drop
     */
    async handleFileDrop(e) {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        await exportImport.handleFileDrop(files);
        this.renderFileTree();
    }

    /**
     * Setup resizer
     */
    setupResizer() {
        const resizer = document.getElementById('resizer');
        const editorContainer = document.getElementById('editorContainer');
        const previewSection = document.getElementById('previewSection');
        let isResizing = false;

        resizer.addEventListener('mousedown', () => {
            isResizing = true;
            resizer.classList.add('active');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const main = document.getElementById('main');
            const mainRect = main.getBoundingClientRect();
            const newWidth = e.clientX - mainRect.left;
            const totalWidth = mainRect.width;
            const sidebarWidth = document.getElementById('sidebar').offsetWidth;
            const minEditorWidth = 300;
            const minPreviewWidth = 300;

            const editorWidth = newWidth - sidebarWidth;
            if (editorWidth >= minEditorWidth && totalWidth - newWidth >= minPreviewWidth) {
                editorContainer.style.flex = `0 0 ${editorWidth}px`;
                previewSection.style.width = `${totalWidth - newWidth}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            resizer.classList.remove('active');
        });
    }

    /**
     * Clear all data
     */
    async clearAllData() {
        const confirmed = await Modal.confirm('Clear All Data', 'This will delete all files and settings. This cannot be undone.');
        if (confirmed) {
            await storage.clearAll();
            filesystem.initializeDefaults();
            this.openTabs = [];
            this.activeFile = null;
            this.renderFileTree();
            this.renderTabs();
            Toast.success('All data cleared');
        }
    }
}

// Global UI instance
const ui = new UIManager();
