/**
 * Keyboard Shortcuts Manager
 */

class ShortcutsManager {
    static init() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New File
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                ui.createNewFile();
            }

            // Ctrl/Cmd + Shift + N: New Folder
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                ui.createNewFolder();
            }

            // Ctrl/Cmd + K: Search/Quick Open
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }

            // Ctrl/Cmd + ,: Settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                ui.toggleSettings();
            }

            // Ctrl/Cmd + Shift + E: Export
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
                e.preventDefault();
                ui.showExportMenu();
            }

            // Ctrl/Cmd + Shift + I: Import
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                ui.handleImport();
            }
        });
    }
}
