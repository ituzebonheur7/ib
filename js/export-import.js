/**
 * Export/Import Manager
 * Handles ZIP export and import of projects
 */

class ExportImportManager extends EventEmitter {
    constructor() {
        super();
    }

    /**
     * Export project as ZIP
     */
    async exportAsZip(projectName = 'ituze-project') {
        try {
            const zip = new JSZip();
            const files = filesystem.getAllFiles();

            // Add files to ZIP
            for (const file of files) {
                zip.file(file.path, file.content);
            }

            // Generate ZIP blob
            const blob = await zip.generateAsync({ type: 'blob' });

            // Download ZIP
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectName}.zip`;
            link.click();
            URL.revokeObjectURL(url);

            this.emit('exported', { projectName });
            Toast.success('Project exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            Toast.error('Failed to export project');
            this.emit('error', { error });
        }
    }

    /**
     * Import project from ZIP
     */
    async importFromZip(file) {
        try {
            const zip = await JSZip.loadAsync(file);
            const newFiles = {};

            // Extract files from ZIP
            for (const [path, zipEntry] of Object.entries(zip.files)) {
                if (!zipEntry.dir) {
                    const content = await zipEntry.async('string');
                    this.addFileToStructure(newFiles, path, content);
                }
            }

            // Merge with existing files
            filesystem.files = Utils.deepMerge(filesystem.files, newFiles);
            filesystem.emit('files-imported', {});

            this.emit('imported', { files: Object.keys(newFiles) });
            Toast.success('Project imported successfully');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            Toast.error('Failed to import project');
            this.emit('error', { error });
            return false;
        }
    }

    /**
     * Add file to structure
     */
    addFileToStructure(obj, path, content) {
        const parts = path.split('/').filter(p => p);
        const filename = parts.pop();

        let current = obj;
        for (const part of parts) {
            if (!current[part]) {
                current[part] = {
                    type: 'folder',
                    children: {},
                    created: Date.now(),
                    modified: Date.now()
                };
            }
            if (current[part].type === 'folder') {
                current = current[part].children;
            }
        }

        current[filename] = {
            type: 'file',
            content: content,
            created: Date.now(),
            modified: Date.now()
        };
    }

    /**
     * Export as JSON
     */
    exportAsJson(projectName = 'ituze-project') {
        try {
            const data = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                files: filesystem.files
            };

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${projectName}.json`;
            link.click();
            URL.revokeObjectURL(url);

            Toast.success('Project exported as JSON');
        } catch (error) {
            console.error('Export error:', error);
            Toast.error('Failed to export project');
        }
    }

    /**
     * Import from JSON
     */
    async importFromJson(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            filesystem.files = Utils.deepMerge(filesystem.files, data.files);
            filesystem.emit('files-imported', {});

            Toast.success('Project imported from JSON');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            Toast.error('Failed to import project');
            return false;
        }
    }

    /**
     * Handle file drop
     */
    async handleFileDrop(files) {
        for (const file of files) {
            if (file.name.endsWith('.zip')) {
                await this.importFromZip(file);
            } else if (file.name.endsWith('.json')) {
                await this.importFromJson(file);
            }
        }
    }
}

// Global export/import instance
const exportImport = new ExportImportManager();
