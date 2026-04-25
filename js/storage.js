/**
 * IndexedDB Storage Manager
 * Handles persistent file storage with IndexedDB for reliability
 */

class StorageManager {
    constructor() {
        this.dbName = 'ItuzeIDEDB';
        this.storeName = 'files';
        this.settingsStore = 'settings';
        this.db = null;
        this.isReady = false;
    }

    /**
     * Initialize IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);

            request.onerror = () => {
                console.error('IndexedDB initialization failed');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isReady = true;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains(this.settingsStore)) {
                    db.createObjectStore(this.settingsStore, { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Save project files
     */
    async saveProject(projectName, files) {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const data = {
                id: projectName || 'default-project',
                files: files,
                timestamp: Date.now(),
                version: 1
            };

            const request = store.put(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Load project files
     */
    async loadProject(projectName = 'default-project') {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(projectName);

            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all projects
     */
    async getAllProjects() {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete project
     */
    async deleteProject(projectName) {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(projectName);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save settings
     */
    async saveSettings(settings) {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.settingsStore], 'readwrite');
            const store = transaction.objectStore(this.settingsStore);

            const data = {
                key: 'ide-settings',
                value: settings,
                timestamp: Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => resolve(data);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Load settings
     */
    async loadSettings() {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.settingsStore], 'readonly');
            const store = transaction.objectStore(this.settingsStore);
            const request = store.get('ide-settings');

            request.onsuccess = () => {
                const result = request.result;
                resolve(result ? result.value : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all data
     */
    async clearAll() {
        if (!this.isReady) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(
                [this.storeName, this.settingsStore],
                'readwrite'
            );

            const stores = [
                transaction.objectStore(this.storeName).clear(),
                transaction.objectStore(this.settingsStore).clear()
            ];

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Export data as JSON
     */
    async exportData() {
        const projects = await this.getAllProjects();
        const settings = await this.loadSettings();

        return {
            projects: projects,
            settings: settings,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data from JSON
     */
    async importData(data) {
        if (!this.isReady) await this.init();

        if (data.projects && Array.isArray(data.projects)) {
            for (const project of data.projects) {
                await this.saveProject(project.id, project.files);
            }
        }

        if (data.settings) {
            await this.saveSettings(data.settings);
        }

        return true;
    }
}

// Global storage instance
const storage = new StorageManager();
