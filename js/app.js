/* app.js - Application Bootstrapper and Control Panel event listeners */

// Mockup Sample Professional Resume Details
const SAMPLE_RESUME_DATA = {
    personal: {
        name: 'Alexander Mercer',
        title: 'Lead Full Stack Engineer',
        email: 'alexander.mercer@gmail.com',
        phone: '+1 (555) 382-9012',
        address: 'Austin, TX',
        linkedin: 'linkedin.com/in/alexander-mercer',
        github: 'github.com/alex-mercer',
        portfolio: 'alexmercer.dev',
        website: 'techblog.alexmercer.dev',
        photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23cbd5e1"><circle cx="50" cy="35" r="20" fill="%2394a3b8"/><path d="M15,85 C15,65 30,55 50,55 C70,55 85,65 85,85 Z" fill="%2394a3b8"/></svg>'
    },
    summary: 'Innovative and detail-oriented Lead Full Stack Engineer with over 8 years of experience designing, building, and deploying robust web applications. Expert in modern JavaScript ecosystems, responsive UI layouts, and cloud infrastructures. Proven track record of leading cross-functional teams to deliver scale-ready software solutions that drive business efficiency.',
    experience: [
        {
            role: 'Lead Software Engineer',
            company: 'TechCorp Solutions',
            location: 'Austin, TX',
            start: 'Mar 2021',
            end: 'Present',
            details: '- Spearheaded development of a cloud-based analytics dashboard, improving data query speeds by 40%.\n- Mentored a team of 6 engineers and established agile development pipelines and testing coverages.\n- Architected microservices architectures using Node.js and AWS, reducing hosting expenses by 25%.',
            _collapsed: true
        },
        {
            role: 'Senior Developer',
            company: 'Innovate Web LLC',
            location: 'Austin, TX',
            start: 'Jun 2018',
            end: 'Feb 2021',
            details: '- Developed responsive client web apps using modern frameworks and standard vanilla CSS grids.\n- Integrated REST and GraphQL API services and managed relational database schema migrations.\n- Contributed to open-source libraries and coordinated with design teams to define pattern styles.',
            _collapsed: true
        }
    ],
    education: [
        {
            degree: 'M.S. Computer Science',
            school: 'University of Texas',
            location: 'Austin, TX',
            start: '2016',
            end: '2018',
            details: 'Focused on distributed systems and software architecture. GPA: 3.9/4.0.',
            _collapsed: true
        },
        {
            degree: 'B.S. Software Engineering',
            school: 'Texas A&M University',
            location: 'College Station, TX',
            start: '2012',
            end: '2016',
            details: 'Graduated with honors.',
            _collapsed: true
        }
    ],
    projects: [
        {
            title: 'ForgeCommerce',
            role: 'Lead Architect',
            link: 'https://github.com/alex-mercer/forgecommerce',
            start: '2025',
            end: '2025',
            details: '- Designed an open-source static checkout module serving 10,000+ monthly active requests.\n- Achieved 98% Lighthouse performance ratings by optimizing asset bundles.',
            _collapsed: true
        }
    ],
    skills: [
        { name: 'JavaScript (ES6+)', level: 'Expert', _collapsed: true },
        { name: 'HTML5 & CSS3', level: 'Expert', _collapsed: true },
        { name: 'Node.js', level: 'Advanced', _collapsed: true },
        { name: 'React / Next.js', level: 'Advanced', _collapsed: true },
        { name: 'AWS & Docker', level: 'Intermediate', _collapsed: true },
        { name: 'Git & CI/CD', level: 'Advanced', _collapsed: true }
    ],
    languages: [
        { name: 'English', level: 'Native', _collapsed: true },
        { name: 'Spanish', level: 'Conversational', _collapsed: true }
    ],
    certificates: [
        { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2024', link: '', _collapsed: true }
    ],
    achievements: [
        { title: 'First Place Austin Tech Hackathon', date: '2023', details: 'Designed a static map routes visualizer in 24 hours.', _collapsed: true }
    ],
    volunteer: [
        { role: 'Technical Mentor', organization: 'Code Class Texas', start: '2022', end: 'Present', details: 'Teaching basic programming fundamentals to local high school students.', _collapsed: true }
    ],
    interests: [
        { name: 'Technical Blogging', _collapsed: true },
        { name: 'Marathon Running', _collapsed: true }
    ],
    references: [
        { name: 'Sarah Jenkins', position: 'VP of Product', company: 'TechCorp Solutions', contact: 'sarah.j@techcorp.com', details: 'Alexander is an exceptional leader who balances technical rigor with clean code craftsmanship.', _collapsed: true }
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial State Loading
    const hasDraft = localStorage.getItem('resumeforge_data');
    let resume = StorageUtil.getResumeData();
    let config = StorageUtil.getConfigData();

    // Auto-load default professional sample data if no prior draft exists
    if (!hasDraft) {
        resume = JSON.parse(JSON.stringify(SAMPLE_RESUME_DATA));
        StorageUtil.saveResumeData(resume);
    }

    // Check if landing page pre-selected a template
    const preselectedTemplate = localStorage.getItem('selected_template');
    if (preselectedTemplate) {
        config.template = preselectedTemplate;
        StorageUtil.saveConfigData(config);
        localStorage.removeItem('selected_template'); // clear cache
    }

    // Apply global UI dark/light theme
    const themeBtn = document.getElementById('theme-toggle');
    document.documentElement.setAttribute('data-theme', config.theme);
    updateThemeIcon(config.theme);

    // Check if redirect parameters request sample loading
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sample') === '1') {
        resume = JSON.parse(JSON.stringify(SAMPLE_RESUME_DATA));
        StorageUtil.saveResumeData(resume);
        // Clean URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Initialize Subsystems
    BuilderSystem.init(resume, config);
    PreviewSystem.updatePreview(resume, config);

    // ==========================================================================
    // UNDO / REDO HISTORY ENGINE
    // ==========================================================================
    const HistorySystem = {
        stack: [],
        pointer: -1,
        maxStates: 20,
        
        init(initialState) {
            this.stack = [JSON.parse(JSON.stringify(initialState))];
            this.pointer = 0;
            this.updateUndoRedoUI();
        },
        
        pushState(data) {
            if (this.pointer < this.stack.length - 1) {
                this.stack = this.stack.slice(0, this.pointer + 1);
            }
            
            const clone = JSON.parse(JSON.stringify(data));
            if (this.stack.length > 0 && JSON.stringify(this.stack[this.pointer]) === JSON.stringify(clone)) {
                return;
            }
            
            this.stack.push(clone);
            if (this.stack.length > this.maxStates) {
                this.stack.shift();
            } else {
                this.pointer++;
            }
            this.updateUndoRedoUI();
        },
        
        undo() {
            if (this.pointer > 0) {
                this.pointer--;
                const state = JSON.parse(JSON.stringify(this.stack[this.pointer]));
                
                // Clear existing keys to preserve the object reference
                for (let key in resumeData) {
                    delete resumeData[key];
                }
                Object.assign(resumeData, state);
                
                this.syncStateToForm();
                ExportSystem.showToast('Undo performed');
            } else {
                ExportSystem.showToast('Nothing to undo', 'info');
            }
        },
        
        redo() {
            if (this.pointer < this.stack.length - 1) {
                this.pointer++;
                const state = JSON.parse(JSON.stringify(this.stack[this.pointer]));
                
                // Clear existing keys to preserve the object reference
                for (let key in resumeData) {
                    delete resumeData[key];
                }
                Object.assign(resumeData, state);
                
                this.syncStateToForm();
                ExportSystem.showToast('Redo performed');
            } else {
                ExportSystem.showToast('Nothing to redo', 'info');
            }
        },
        
        syncStateToForm() {
            StorageUtil.saveResumeData(resumeData);
            
            // Map static inputs
            const fields = document.querySelectorAll('.resume-field');
            fields.forEach(field => {
                const path = field.getAttribute('data-path');
                const val = BuilderSystem.getNestedValue(resumeData, path);
                field.value = val || '';
            });
            
            // Photo state
            const avatarPreview = document.getElementById('avatar-preview');
            const avatarPlaceholder = document.getElementById('avatar-placeholder');
            const removePhotoBtn = document.getElementById('btn-remove-photo');
            if (resumeData.personal && resumeData.personal.photo) {
                if (avatarPreview) {
                    avatarPreview.src = resumeData.personal.photo;
                    avatarPreview.classList.remove('hidden');
                }
                if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
                if (removePhotoBtn) removePhotoBtn.classList.remove('hidden');
            } else {
                if (avatarPreview) {
                    avatarPreview.src = '';
                    avatarPreview.classList.add('hidden');
                }
                if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
                if (removePhotoBtn) removePhotoBtn.classList.add('hidden');
            }
            
            // Dynamic Lists
            BuilderSystem.renderAllDynamicLists();
            
            // Live preview
            PreviewSystem.updatePreview(resumeData, configData);
            BuilderSystem.runEvaluation();
            
            this.updateUndoRedoUI();
        },
        
        updateUndoRedoUI() {
            // UI elements status checks can go here
        }
    };
    window.HistorySystem = HistorySystem;
    HistorySystem.init(resume);

    // ==========================================================================
    // AUTOSAVE INDICATOR CONTROLLER
    // ==========================================================================
    window.triggerAutosaveIndicator = function() {
        const container = document.getElementById('autosave-status');
        if (!container) return;
        
        const textSpan = document.getElementById('autosave-text');
        const icon = container.querySelector('i') || container.querySelector('svg');
        
        container.className = 'autosave-status saving';
        if (textSpan) textSpan.innerText = 'Saving changes...';
        
        if (icon) {
            const newIcon = document.createElement('i');
            newIcon.setAttribute('data-lucide', 'refresh-cw');
            newIcon.style.animation = 'spin 1.5s linear infinite';
            icon.replaceWith(newIcon);
            if (window.lucide) window.lucide.createIcons();
        }
        
        if (window.autosaveTimeout) clearTimeout(window.autosaveTimeout);
        window.autosaveTimeout = setTimeout(() => {
            container.className = 'autosave-status';
            if (textSpan) textSpan.innerText = 'Saved just now';
            
            const currentIcon = container.querySelector('i') || container.querySelector('svg');
            if (currentIcon) {
                const checkIcon = document.createElement('i');
                checkIcon.setAttribute('data-lucide', 'check-circle-2');
                currentIcon.replaceWith(checkIcon);
                if (window.lucide) window.lucide.createIcons();
            }
        }, 700);
    };

    // ==========================================================================
    // COMMAND PALETTE SEARCH ENGINE
    // ==========================================================================
    const paletteModal = document.getElementById('modal-command-palette');
    const paletteInput = document.getElementById('command-palette-input');
    const paletteResults = document.getElementById('command-palette-results');
    
    let selectedIndex = 0;
    let filteredCommands = [];

    const COMMANDS = [
        // Navigation Options
        { name: 'Go to Personal Details', category: 'Navigation', action: () => jumpToSection('personal') },
        { name: 'Go to Professional Summary', category: 'Navigation', action: () => jumpToSection('summary') },
        { name: 'Go to Work Experience', category: 'Navigation', action: () => jumpToSection('experience') },
        { name: 'Go to Education', category: 'Navigation', action: () => jumpToSection('education') },
        { name: 'Go to Projects', category: 'Navigation', action: () => jumpToSection('projects') },
        { name: 'Go to Skills', category: 'Navigation', action: () => jumpToSection('skills') },
        { name: 'Go to Languages', category: 'Navigation', action: () => jumpToSection('languages') },
        { name: 'Go to Certificates', category: 'Navigation', action: () => jumpToSection('certificates') },
        { name: 'Go to Achievements', category: 'Navigation', action: () => jumpToSection('achievements') },
        { name: 'Go to Volunteer Experience', category: 'Navigation', action: () => jumpToSection('volunteer') },
        { name: 'Go to Interests', category: 'Navigation', action: () => jumpToSection('interests') },
        { name: 'Go to References', category: 'Navigation', action: () => jumpToSection('references') },
        
        // Layout Settings presets
        { name: 'Switch to Modern Template', category: 'Template', action: () => selectTemplate('modern') },
        { name: 'Switch to Classic Template', category: 'Template', action: () => selectTemplate('classic') },
        { name: 'Switch to Professional Template', category: 'Template', action: () => selectTemplate('professional') },
        { name: 'Switch to Minimal Template', category: 'Template', action: () => selectTemplate('minimal') },
        { name: 'Toggle Dark Mode / Light Mode', category: 'Theme', action: () => themeBtn.click() },
        
        // Format layout config selectors
        { name: 'Page Size: A4 (Standard)', category: 'Layout', action: () => changePageLayoutSetting('settings-page-size', 'a4') },
        { name: 'Page Size: Letter (US Format)', category: 'Layout', action: () => changePageLayoutSetting('settings-page-size', 'letter') },
        { name: 'Margins: Small (10mm)', category: 'Layout', action: () => changePageLayoutSetting('settings-page-margins-select', '10') },
        { name: 'Margins: Normal (20mm)', category: 'Layout', action: () => changePageLayoutSetting('settings-page-margins-select', '20') },
        { name: 'Margins: Large (30mm)', category: 'Layout', action: () => changePageLayoutSetting('settings-page-margins-select', '30') },
        { name: 'Line Spacing: Compact (1.2)', category: 'Layout', action: () => changePageLayoutSetting('settings-line-height', 'line-height-compact') },
        { name: 'Line Spacing: Comfortable (1.5)', category: 'Layout', action: () => changePageLayoutSetting('settings-line-height', 'line-height-comfortable') },
        { name: 'Line Spacing: Relaxed (1.85)', category: 'Layout', action: () => changePageLayoutSetting('settings-line-height', 'line-height-relaxed') },

        // Actions callbacks
        { name: 'Export A4 / Letter PDF Document', category: 'File', action: () => ExportSystem.exportPDF(resumeData.personal.name) },
        { name: 'Print Resume Document', category: 'File', action: () => ExportSystem.printResume() },
        { name: 'Export JSON Draft', category: 'File', action: () => ExportSystem.exportJSON(resumeData) },
        { name: 'Import JSON Draft', category: 'File', action: () => importInput.click() },
        { name: 'Load Sample Data', category: 'Data', action: () => loadSampleData() },
        { name: 'Start Over (Clear Resume)', category: 'Danger', action: () => document.getElementById('btn-clear').click() }
    ];

    function toggleCommandPalette() {
        if (!paletteModal) return;
        
        if (paletteModal.classList.contains('hidden')) {
            paletteModal.classList.remove('hidden');
            paletteInput.value = '';
            selectedIndex = 0;
            renderPaletteResults('');
            setTimeout(() => {
                paletteInput.focus();
            }, 100);
        } else {
            paletteModal.classList.add('hidden');
        }
    }

    function closeAllModals() {
        if (paletteModal) paletteModal.classList.add('hidden');
        const confirmModal = document.getElementById('modal-clear-confirm');
        if (confirmModal) confirmModal.classList.add('hidden');
        const pdfLoader = document.getElementById('modal-pdf-loading');
        if (pdfLoader) pdfLoader.classList.add('hidden');
    }

    function renderPaletteResults(query) {
        if (!paletteResults) return;
        paletteResults.innerHTML = '';
        
        const q = query.toLowerCase().trim();
        filteredCommands = COMMANDS.filter(cmd => 
            cmd.name.toLowerCase().includes(q) || 
            cmd.category.toLowerCase().includes(q)
        );
        
        if (filteredCommands.length === 0) {
            paletteResults.innerHTML = `<div style="padding:16px; color:var(--text-muted); text-align:center; font-size:0.9rem;">No commands found matching "${query}"</div>`;
            return;
        }

        filteredCommands.forEach((cmd, idx) => {
            const item = document.createElement('div');
            item.className = `command-palette-item ${idx === selectedIndex ? 'selected' : ''}`;
            item.innerHTML = `
                <span>${cmd.name}</span>
                <span class="command-palette-item-meta">${cmd.category}</span>
            `;
            
            item.addEventListener('click', () => {
                cmd.action();
                toggleCommandPalette();
            });
            
            if (idx === selectedIndex) {
                setTimeout(() => {
                    item.scrollIntoView({ block: 'nearest' });
                }, 10);
            }
            
            paletteResults.appendChild(item);
        });
    }

    if (paletteInput) {
        paletteInput.addEventListener('input', () => {
            selectedIndex = 0;
            renderPaletteResults(paletteInput.value);
        });
        
        paletteInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = (selectedIndex + 1) % filteredCommands.length;
                renderPaletteResults(paletteInput.value);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
                renderPaletteResults(paletteInput.value);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    filteredCommands[selectedIndex].action();
                    toggleCommandPalette();
                }
            }
        });
    }

    if (paletteModal) {
        paletteModal.addEventListener('click', (e) => {
            if (e.target === paletteModal) {
                toggleCommandPalette();
            }
        });
    }

    // Scroll accordion sections helper
    function jumpToSection(sectionKey) {
        const items = document.querySelectorAll('.accordion-item');
        let targetItem = null;
        
        items.forEach(item => {
            const header = item.querySelector('.accordion-header');
            if (header && header.getAttribute('data-section') === sectionKey) {
                targetItem = item;
            }
        });
        
        if (targetItem) {
            items.forEach(el => {
                el.classList.remove('active');
                const h = el.querySelector('.accordion-header');
                if (h) h.setAttribute('aria-expanded', 'false');
            });
            
            targetItem.classList.add('active');
            const targetHeader = targetItem.querySelector('.accordion-header');
            if (targetHeader) targetHeader.setAttribute('aria-expanded', 'true');
            
            const tabSectionsBtn = document.querySelector('[data-tab="fields-tab"]');
            if (tabSectionsBtn) tabSectionsBtn.click();
            
            setTimeout(() => {
                targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }

    function selectTemplate(templateName) {
        const choice = document.querySelector(`.template-choice[data-template="${templateName}"]`);
        if (choice) {
            choice.click();
            ExportSystem.showToast(`Switched to ${templateName.toUpperCase()} template`);
        }
    }

    function changePageLayoutSetting(elementId, val) {
        const select = document.getElementById(elementId);
        if (select) {
            select.value = val;
            select.dispatchEvent(new Event('change'));
            ExportSystem.showToast('Page layout updated!');
        }
    }

    function loadSampleData() {
        const freshSample = JSON.parse(JSON.stringify(SAMPLE_RESUME_DATA));
        for (let key in resumeData) {
            delete resumeData[key];
        }
        Object.assign(resumeData, freshSample);
        StorageUtil.saveResumeData(resumeData);
        HistorySystem.syncStateToForm();
        ExportSystem.showToast('Sample resume loaded!');
    }

    // ==========================================================================
    // KEYBOARD SHORTCUTS MAPPING
    // ==========================================================================
    document.addEventListener('keydown', (e) => {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        const isTyping = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT');

        // Ctrl + K (Search / Command Palette) – works even while typing
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            toggleCommandPalette();
            return;
        }

        // ESC (Close all Modals) – works everywhere
        if (e.key === 'Escape') {
            closeAllModals();
            return;
        }

        // All remaining shortcuts should NOT fire when user is typing in form fields
        if (isTyping) return;

        // Ctrl + S (Save Draft)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            StorageUtil.saveResumeData(resumeData);
            StorageUtil.saveConfigData(configData);
            window.triggerAutosaveIndicator();
            ExportSystem.showToast('Draft manually saved!');
        }
        
        // Ctrl + P (Print Preview)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            ExportSystem.printResume();
        }
        
        // Ctrl + D (Export PDF)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            ExportSystem.exportPDF(resumeData.personal.name);
        }
        
        // Ctrl + Z (Undo History)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            HistorySystem.undo();
        }
        
        // Ctrl + Y (Redo History)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            HistorySystem.redo();
        }
    });

    // ==========================================================================
    // STANDARD BUTTONS EVENT BINDINGS
    // ==========================================================================

    // 3. Top Action controls listeners
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', nextTheme);
        config.theme = nextTheme;
        StorageUtil.saveConfigData(config);
        updateThemeIcon(nextTheme);
    });

    function updateThemeIcon(theme) {
        const icon = themeBtn.querySelector('i') || themeBtn.querySelector('svg');
        if (!icon) return;
        
        const newIcon = document.createElement('i');
        newIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
        icon.replaceWith(newIcon);
        
        if (window.lucide) window.lucide.createIcons();
    }

    // Load Sample Button
    document.getElementById('btn-sample').addEventListener('click', () => {
        if (confirm('Load sample resume? This will overwrite your current progress.')) {
            loadSampleData();
        }
    });

    // Clear All / Modal logic
    const modal = document.getElementById('modal-clear-confirm');
    document.getElementById('btn-clear').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    modal.querySelector('.btn-close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    document.getElementById('btn-modal-cancel').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    document.getElementById('btn-modal-confirm').addEventListener('click', () => {
        // Reset resume data in-place to defaults
        for (let key in resumeData) {
            delete resumeData[key];
        }
        Object.assign(resumeData, JSON.parse(JSON.stringify(DEFAULT_RESUME_DATA)));
        StorageUtil.clearAllData();

        // Reset config to defaults
        const freshConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG_DATA));
        for (let key in configData) {
            delete configData[key];
        }
        Object.assign(configData, freshConfig);
        StorageUtil.saveConfigData(configData);

        // Apply fresh theme
        document.documentElement.setAttribute('data-theme', configData.theme);
        updateThemeIcon(configData.theme);

        // Re-init history with clean state
        HistorySystem.init(resumeData);

        // Re-sync all UI elements
        HistorySystem.syncStateToForm();

        // Re-apply config controls (template selector, font, colors, etc.)
        BuilderSystem.setupCustomizationControls();

        modal.classList.add('hidden');
        ExportSystem.showToast('Resume cleared. Starting fresh!');
    });

    // Import / Export JSON Buttons
    const importInput = document.getElementById('import-json');
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            ExportSystem.importJSON(file, (importedData) => {
                // Merge imported data with defaults to ensure all arrays exist
                const merged = JSON.parse(JSON.stringify(DEFAULT_RESUME_DATA));
                // Deep-copy imported keys over defaults
                for (let key in importedData) {
                    if (importedData.hasOwnProperty(key)) {
                        if (key === 'personal' && typeof importedData[key] === 'object') {
                            Object.assign(merged.personal, importedData.personal);
                        } else {
                            merged[key] = importedData[key];
                        }
                    }
                }

                // Update state in-place
                for (let key in resumeData) {
                    delete resumeData[key];
                }
                Object.assign(resumeData, merged);

                StorageUtil.saveResumeData(resumeData);
                HistorySystem.init(resumeData);
                HistorySystem.syncStateToForm();

                ExportSystem.showToast('Resume imported successfully!');
            });
            // Reset file input so the same file can be re-imported
            importInput.value = '';
        }
    });

    document.getElementById('btn-export-json').addEventListener('click', () => {
        ExportSystem.exportJSON(resumeData);
    });

    // PDF and Print Buttons
    document.getElementById('btn-print').addEventListener('click', () => {
        ExportSystem.printResume();
    });

    document.getElementById('btn-pdf').addEventListener('click', () => {
        ExportSystem.exportPDF(resumeData.personal.name);
    });

    // Zoom handlers
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        PreviewSystem.zoomIn();
    });

    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        PreviewSystem.zoomOut();
    });

    document.getElementById('btn-zoom-reset').addEventListener('click', () => {
        PreviewSystem.zoomReset();
    });

    // Fullscreen Viewport toggle
    const previewPanel = document.getElementById('panel-preview');
    const fullscreenBtn = document.getElementById('btn-fullscreen');
    fullscreenBtn.addEventListener('click', () => {
        const isFullscreen = previewPanel.classList.contains('fullscreen-mode');
        if (isFullscreen) {
            previewPanel.classList.remove('fullscreen-mode');
            fullscreenBtn.querySelector('i').setAttribute('data-lucide', 'expand');
        } else {
            previewPanel.classList.add('fullscreen-mode');
            fullscreenBtn.querySelector('i').setAttribute('data-lucide', 'minimize');
        }
        if (window.lucide) window.lucide.createIcons();
        PreviewSystem.scalePreview();
    });

    // Floating mobile tab togglers
    const btnMobEdit = document.getElementById('btn-mob-edit');
    const btnMobPreview = document.getElementById('btn-mob-preview');
    const inputPanel = document.getElementById('panel-inputs');
    const displayPanel = document.getElementById('panel-preview');

    btnMobEdit.addEventListener('click', () => {
        btnMobEdit.classList.add('active');
        btnMobPreview.classList.remove('active');
        inputPanel.classList.remove('hidden');
        displayPanel.classList.remove('active');
    });

    btnMobPreview.addEventListener('click', () => {
        btnMobEdit.classList.remove('active');
        btnMobPreview.classList.add('active');
        inputPanel.classList.add('hidden');
        displayPanel.classList.add('active');
        // Recalculate zoom fitting when elements become visible
        setTimeout(() => {
            PreviewSystem.scalePreview();
        }, 100);
    });

    // Wires PDF export on mobile floating trigger
    const mobPdfBtn = document.getElementById('btn-mob-pdf');
    if (mobPdfBtn) {
        mobPdfBtn.addEventListener('click', () => {
            ExportSystem.exportPDF(resumeData.personal.name);
        });
    }

    // Set initial scale fitting
    setTimeout(() => {
        PreviewSystem.scalePreview();
    }, 150);
});
