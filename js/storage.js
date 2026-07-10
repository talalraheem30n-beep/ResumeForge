/* storage.js - Local Storage State Synchronization */

const RESUME_STORAGE_KEY = 'resumeforge_data';
const CONFIG_STORAGE_KEY = 'resumeforge_config';

const DEFAULT_RESUME_DATA = {
    personal: {
        name: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        linkedin: '',
        github: '',
        portfolio: '',
        website: '',
        photo: ''
    },
    summary: '',
    experience: [],
    education: [],
    projects: [],
    skills: [],
    languages: [],
    certificates: [],
    achievements: [],
    volunteer: [],
    interests: [],
    references: []
};

const DEFAULT_CONFIG_DATA = {
    template: 'modern',
    color: '#6366f1',
    font: 'font-sans-inter',
    fontSize: 'font-size-md',
    spacing: '16',
    margins: '20',
    pageSize: 'a4',
    lineHeight: 'line-height-comfortable',
    showPhoto: true,
    theme: 'light'
};

const StorageUtil = {
    /**
     * Get resume details from localStorage
     * @returns {Object} Resume data
     */
    getResumeData() {
        try {
            const data = localStorage.getItem(RESUME_STORAGE_KEY);
            return data ? JSON.parse(data) : JSON.parse(JSON.stringify(DEFAULT_RESUME_DATA));
        } catch (e) {
            console.error('Error reading resume data from storage', e);
            return JSON.parse(JSON.stringify(DEFAULT_RESUME_DATA));
        }
    },

    /**
     * Save resume details to localStorage
     * @param {Object} data Resume data
     */
    saveResumeData(data) {
        try {
            localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving resume data to storage', e);
        }
    },

    /**
     * Get customization settings from localStorage
     * @returns {Object} Config data
     */
    getConfigData() {
        try {
            const data = localStorage.getItem(CONFIG_STORAGE_KEY);
            const parsed = data ? JSON.parse(data) : {};
            // Merge with defaults to guarantee all keys exist
            return { ...DEFAULT_CONFIG_DATA, ...parsed };
        } catch (e) {
            console.error('Error reading config from storage', e);
            return { ...DEFAULT_CONFIG_DATA };
        }
    },

    /**
     * Save configuration options to localStorage
     * @param {Object} config Config data
     */
    saveConfigData(config) {
        try {
            localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
        } catch (e) {
            console.error('Error saving config to storage', e);
        }
    },

    clearAllData() {
        try {
            localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(DEFAULT_RESUME_DATA));
            localStorage.removeItem(CONFIG_STORAGE_KEY);
        } catch (e) {
            console.error('Error clearing storage data', e);
        }
    }
};
