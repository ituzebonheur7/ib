/**
 * File System Manager
 * Handles file and folder operations
 */

class FileSystem extends EventEmitter {
    constructor() {
        super();
        this.files = {};
    }

    /**
     * Initialize filesystem with default files
     */
    initializeDefaults() {
        this.files = {
            'index.html': {
                type: 'file',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ituze IDE Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to Ituze IDE</h1>
        <p>Start editing your code to see changes in real-time.</p>
        <button class="btn-primary" id="myButton">Click Me</button>
    </div>
    <script src="script.js"><\/script>
</body>
</html>`,
                created: Date.now(),
                modified: Date.now()
            },
            'style.css': {
                type: 'file',
                content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    text-align: center;
    background: rgba(0, 0, 0, 0.2);
    padding: 3rem;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.btn-primary {
    background: #667eea;
    color: white;
    border: none;
    padding: 12px 32px;
    font-size: 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover {
    background: #764ba2;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.6);
}

.btn-primary:active {
    transform: translateY(0);
}`,
                created: Date.now(),
                modified: Date.now()
            },
            'script.js': {
                type: 'file',
                content: `document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('myButton');
    if (button) {
        button.addEventListener('click', function() {
            alert('✨ JavaScript is working!\\n\\nEdit the files to see changes in real-time.');
        });
    }
});`,
                created: Date.now(),
                modified: Date.now()
            },
            'assets': {
                type: 'folder',
                children: {},
                created: Date.now(),
                modified: Date.now()
            }
        };
    }

    /**
     * Get all files tree
     */
    getFiles() {
        return this.files;
    }

    /**
     * Get file by path
     */
    getFile(path) {
        const parts = Utils.parsePath(path);
        let current = this.files;

        for (const part of parts) {
            if (current[part]) {
                current = current[part];
                if (current.type === 'folder') {
                    current = current.children;
                }
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * Create new file
     */
    createFile(path, content = '') {
        const parts = Utils.parsePath(path);
        const filename = parts.pop();
        let current = this.files;

        // Navigate to parent folder
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

        // Check for duplicates
        if (current[filename]) {
            throw new Error(`File "${filename}" already exists`);
        }

        current[filename] = {
            type: 'file',
            content: content,
            created: Date.now(),
            modified: Date.now()
        };

        this.emit('file-created', { path, type: 'file' });
        return current[filename];
    }

    /**
     * Create new folder
     */
    createFolder(path) {
        const parts = Utils.parsePath(path);
        const foldername = parts.pop();
        let current = this.files;

        // Navigate to parent folder
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

        // Check for duplicates
        if (current[foldername]) {
            throw new Error(`Folder "${foldername}" already exists`);
        }

        current[foldername] = {
            type: 'folder',
            children: {},
            created: Date.now(),
            modified: Date.now()
        };

        this.emit('folder-created', { path, type: 'folder' });
        return current[foldername];
    }

    /**
     * Delete file or folder
     */
    deleteItem(path) {
        const parts = Utils.parsePath(path);
        const name = parts.pop();
        let current = this.files;

        // Navigate to parent
        for (const part of parts) {
            if (current[part] && current[part].type === 'folder') {
                current = current[part].children;
            }
        }

        if (current[name]) {
            delete current[name];
            this.emit('item-deleted', { path });
            return true;
        }

        return false;
    }

    /**
     * Rename file or folder
     */
    renameItem(oldPath, newName) {
        const parts = Utils.parsePath(oldPath);
        const oldName = parts.pop();
        let current = this.files;

        // Navigate to parent
        for (const part of parts) {
            if (current[part] && current[part].type === 'folder') {
                current = current[part].children;
            }
        }

        if (current[oldName]) {
            if (current[newName]) {
                throw new Error(`"${newName}" already exists`);
            }

            current[newName] = current[oldName];
            current[newName].modified = Date.now();
            delete current[oldName];

            const newPath = [...parts, newName].join('/');
            this.emit('item-renamed', { oldPath, newPath });
            return newPath;
        }

        return null;
    }

    /**
     * Update file content
     */
    updateFileContent(path, content) {
        const file = this.getFile(path);
        if (file && file.type === 'file') {
            file.content = content;
            file.modified = Date.now();
            this.emit('file-updated', { path });
            return true;
        }
        return false;
    }

    /**
     * Get file content
     */
    getFileContent(path) {
        const file = this.getFile(path);
        return file && file.type === 'file' ? file.content : '';
    }

    /**
     * Search files
     */
    searchFiles(query) {
        const results = [];
        const searchRec = (obj, basePath = '') => {
            for (const key in obj) {
                const fullPath = basePath ? `${basePath}/${key}` : key;
                if (key.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        path: fullPath,
                        name: key,
                        type: obj[key].type
                    });
                }

                if (obj[key].type === 'folder') {
                    searchRec(obj[key].children, fullPath);
                }
            }
        };

        searchRec(this.files);
        return results;
    }

    /**
     * Get all files (flat list)
     */
    getAllFiles() {
        const files = [];
        const traverse = (obj, basePath = '') => {
            for (const key in obj) {
                const fullPath = basePath ? `${basePath}/${key}` : key;
                if (obj[key].type === 'file') {
                    files.push({
                        path: fullPath,
                        name: key,
                        type: 'file',
                        content: obj[key].content
                    });
                } else if (obj[key].type === 'folder') {
                    traverse(obj[key].children, fullPath);
                }
            }
        };

        traverse(this.files);
        return files;
    }

    /**
     * Get HTML files only
     */
    getHtmlFiles() {
        return this.getAllFiles().filter(f => f.name.endsWith('.html'));
    }

    /**
     * Export files as JSON
     */
    toJSON() {
        return JSON.stringify(this.files);
    }

    /**
     * Import files from JSON
     */
    fromJSON(jsonString) {
        try {
            this.files = JSON.parse(jsonString);
            this.emit('files-imported', {});
            return true;
        } catch (e) {
            console.error('Failed to import files:', e);
            return false;
        }
    }
}

// Global filesystem instance
const filesystem = new FileSystem();
