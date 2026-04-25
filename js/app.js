/**
 * Main Application Entry Point
 */

class ItuzeIDE extends EventEmitter {
    constructor() {
        super();
        this.isInitializing = false;
    }

    /**
     * Initialize the IDE
     */
    async init() {
        try {
            this.isInitializing = true;

            // Initialize storage
            await storage.init();
            console.log('✓ Storage initialized');

            // Load or create default files
            const savedProject = await storage.loadProject('default-project');
            if (savedProject && savedProject.files) {
                filesystem.files = savedProject.files;
            } else {
                filesystem.initializeDefaults();
                await storage.saveProject('default-project', filesystem.getFiles());
            }
            console.log('✓ Filesystem initialized');

            // Load settings
            const settings = await ui.loadSettings();
            console.log('✓ Settings loaded');

            // Initialize Monaco Editor
            await editor.init('monacoEditor');
            console.log('✓ Monaco Editor initialized');

            // Initialize Preview
            preview.init('previewFrame');
            console.log('✓ Preview initialized');

            // Setup UI
            ui.init();
            console.log('✓ UI initialized');

            // Apply settings
            ui.applySettings(settings);

            // Setup keyboard shortcuts
            ShortcutsManager.init();
            console.log('✓ Shortcuts initialized');

            // Open first file
            const htmlFiles = filesystem.getHtmlFiles();
            if (htmlFiles.length > 0) {
                ui.openFile(htmlFiles[0].path);
            } else {
                const firstFile = filesystem.getAllFiles()[0];
                if (firstFile) {
                    ui.openFile(firstFile.path);
                }
            }

            // Setup auto-save
            this.setupAutoSave();

            // Setup auto-run
            this.setupAutoRun();

            // Update preview
            ui.runCode();

            // Mark as ready
            this.isInitializing = false;
            console.log('✓ Ituze IDE initialized successfully');
            Toast.success('Ituze IDE ready');

            // Listen to filesystem changes
            filesystem.on('file-updated', () => {
                ui.runCode();
            });
        } catch (error) {
            console.error('Failed to initialize IDE:', error);
            Toast.error('Failed to initialize IDE');
            this.isInitializing = false;
        }
    }

    /**
     * Setup auto-save
     */
    setupAutoSave() {
        editor.on('content-changed', Utils.debounce(async () => {
            editor.save();
            await storage.saveProject('default-project', filesystem.getFiles());
        }, 2000));
    }

    /**
     * Setup auto-run
     */
    setupAutoRun() {
        editor.on('content-changed', Utils.debounce(() => {
            const autoRunEnabled = document.getElementById('settingAutoRun').checked;
            if (autoRunEnabled) {
                ui.runCode();
            }
        }, 1000));
    }
}

// Initialize IDE when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new ItuzeIDE();
    await app.init();
    
    // Make lucide icons work
    lucide.createIcons();
});

// Handle before unload
window.addEventListener('beforeunload', async (e) => {
    if (editor.editor && editor.getContent().length > 0) {
        editor.save();
        await storage.saveProject('default-project', filesystem.getFiles());
    }
});
