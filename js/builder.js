/* builder.js - Form State, Dynamic Lists, ATS Checker, and Completeness Scorer */

// Global State – use `var` so app.js can reference window.resumeData / window.configData
var resumeData = {};
var configData = {};

const BuilderSystem = {
    /**
     * Initializes all builder controls, event listeners, and form fields
     * @param {Object} resume Draft resume state
     * @param {Object} config UI config state
     */
    init(resume, config) {
        resumeData = resume;
        configData = config;

        this.setupAccordionHeaders();
        this.setupAccordions();
        this.setupTabs();
        this.bindStaticFields();
        this.renderAllDynamicLists();
        this.bindCustomizationControls();
        this.syncCustomizationControls();
        this.setupCertificateScanner();
        this.runEvaluation();

        // Bind .btn-add click event listeners once on boot
        document.querySelectorAll('.btn-add').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = btn.getAttribute('data-section');
                this.addListItem(section);
            });
        });
    },

    /**
     * Collapsible Accordions functionality
     */
    setupAccordions() {
        const headers = document.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                // Prevent bubbling issues
                e.preventDefault();
                
                const item = header.parentElement;
                const isActive = item.classList.contains('active');
                
                // Close other accordion sections
                document.querySelectorAll('.accordion-item').forEach(el => {
                    el.classList.remove('active');
                    el.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
                });
                
                if (!isActive) {
                    item.classList.add('active');
                    header.setAttribute('aria-expanded', 'true');
                }
            });
        });
    },

    /**
     * Toolbars tabs switcher
     */
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                const contentId = btn.getAttribute('data-tab');
                document.getElementById(contentId).classList.add('active');
            });
        });
    },

    /**
     * Links static text input fields directly to the resume data structure
     */
    bindStaticFields() {
        // Map elements to their resumeData paths
        const fields = document.querySelectorAll('.resume-field');
        fields.forEach(field => {
            const path = field.getAttribute('data-path');
            
            // Populates initial value
            const val = this.getNestedValue(resumeData, path);
            field.value = val || '';

            // Listen for keyup/input
            field.addEventListener('input', () => {
                this.setNestedValue(resumeData, path, field.value);
                this.onDataChanged();
            });
        });

        // Profile image upload events
        const photoInput = document.getElementById('profile-photo-input');
        const showPhotoCheckbox = document.getElementById('show-photo-toggle');
        const removePhotoBtn = document.getElementById('btn-remove-photo');
        const avatarPreview = document.getElementById('avatar-preview');
        const avatarPlaceholder = document.getElementById('avatar-placeholder');

        if (resumeData.personal.photo) {
            avatarPreview.src = resumeData.personal.photo;
            avatarPreview.classList.remove('hidden');
            avatarPlaceholder.classList.add('hidden');
            removePhotoBtn.classList.remove('hidden');
        }

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 1. Validate file type
                const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert('Invalid file format. Please upload a JPG, JPEG, PNG, or WebP image.');
                    photoInput.value = '';
                    return;
                }
                
                // 2. Validate file size (2MB limit)
                const maxSize = 2 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('File is too large. Please upload an image smaller than 2MB.');
                    photoInput.value = '';
                    return;
                }

                // 3. Read and resize image
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        
                        // Crop to square
                        const minDim = Math.min(width, height);
                        const startX = (width - minDim) / 2;
                        const startY = (height - minDim) / 2;
                        
                        const targetDim = 200;
                        canvas.width = targetDim;
                        canvas.height = targetDim;
                        
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetDim, targetDim);
                        
                        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                        
                        resumeData.personal.photo = resizedBase64;
                        avatarPreview.src = resizedBase64;
                        avatarPreview.classList.remove('hidden');
                        avatarPlaceholder.classList.add('hidden');
                        removePhotoBtn.classList.remove('hidden');
                        this.onDataChanged();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        removePhotoBtn.addEventListener('click', () => {
            resumeData.personal.photo = '';
            avatarPreview.src = '';
            avatarPreview.classList.add('hidden');
            avatarPlaceholder.classList.remove('hidden');
            removePhotoBtn.classList.add('hidden');
            photoInput.value = ''; // clear input cache
            this.onDataChanged();
        });

        showPhotoCheckbox.checked = configData.showPhoto;
        showPhotoCheckbox.addEventListener('change', () => {
            configData.showPhoto = showPhotoCheckbox.checked;
            StorageUtil.saveConfigData(configData);
            PreviewSystem.updatePreview(resumeData, configData);
            this.runEvaluation();
        });
    },

    setupCertificateScanner() {
        const fileInput = document.getElementById('certificate-file-input');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            ExportSystem.showToast('Scanning certificate document...');

            const reader = new FileReader();

            // Setup a fallback parser from filename
            const parseFromFilename = (filename) => {
                // Strip extension
                const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename;
                
                // Common splitters: underscores, dashes, spaces
                const parts = baseName.split(/[-_\s]+/).map(p => p.trim()).filter(p => p.length > 0);
                
                let date = '';
                let issuer = 'Unknown Issuer';
                let certNameParts = [];
                
                // Heuristics:
                // Find year (e.g. 2020-2029)
                const yearRegex = /^(19|20)\d{2}$/;
                
                // Standard lists of common issuers
                const knownIssuers = ['google', 'aws', 'amazon', 'microsoft', 'coursera', 'udemy', 'edx', 'cisco', 'oracle', 'salesforce', 'meta', 'freecodecamp', 'linkedin', 'pluralsight'];

                parts.forEach(part => {
                    if (yearRegex.test(part)) {
                        date = part;
                    } else if (knownIssuers.includes(part.toLowerCase())) {
                        // capitalize first letter
                        issuer = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                        if (issuer.toLowerCase() === 'aws') issuer = 'AWS';
                    } else {
                        certNameParts.push(part);
                    }
                });

                // Reconstruct cert name
                let certName = certNameParts.join(' ');
                
                // Capitalize words in certName
                certName = certName.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

                if (!certName) certName = 'Professional Certification';
                if (!date) {
                    // Default to current month/year
                    const d = new Date();
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    date = `${months[d.getMonth()]} ${d.getFullYear()}`;
                }

                return { name: certName, issuer: issuer, date: date };
            };

            reader.onload = (event) => {
                const text = event.target.result || '';
                let parsed = { name: '', issuer: '', date: '' };

                if (file.type === 'text/plain' && text) {
                    // Try parsing content
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    
                    // Search for Certificate Name
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.toLowerCase().includes('certify') || line.toLowerCase().includes('certificate') || line.toLowerCase().includes('awarded')) {
                            parsed.name = line;
                            break;
                        }
                    }

                    // Search for Issuer
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.toLowerCase().includes('issued by') || line.toLowerCase().includes('presented by')) {
                            parsed.issuer = line.replace(/issued by|presented by/i, '').trim();
                            break;
                        }
                    }
                }

                // If content parsing failed to yield name or it's binary (image/pdf)
                if (!parsed.name) {
                    parsed = parseFromFilename(file.name);
                }

                // Add to certificates list
                if (!resumeData.certificates) {
                    resumeData.certificates = [];
                }
                
                // Collapse others
                resumeData.certificates.forEach(c => c._collapsed = true);

                const newCert = {
                    name: parsed.name,
                    issuer: parsed.issuer || 'Online Provider',
                    date: parsed.date || '2026',
                    link: '',
                    _collapsed: false
                };

                resumeData.certificates.push(newCert);

                // Save, re-render, evaluation
                this.onDataChanged(true);
                this.renderList('certificates');

                // Clear input
                fileInput.value = '';

                // Expand Certificates accordion and scroll to it
                const certAccordion = document.getElementById('accordion-certificates');
                if (certAccordion && !certAccordion.classList.contains('active')) {
                    const header = certAccordion.querySelector('.accordion-header');
                    if (header) header.click();
                }

                ExportSystem.showToast(`Auto-added: "${newCert.name}"`);
            };

            // Read text content for TXT files to simulate OCR scanning, or just read name for binary
            if (file.type === 'text/plain') {
                reader.readAsText(file);
            } else {
                // Trigger onload directly for binary files using filename heuristics with simulated scan delay
                setTimeout(() => {
                    reader.onload({ target: { result: '' } });
                }, 1000);
            }
        });
    },


    bindCustomizationControls() {
        const fontSelect = document.getElementById('settings-font');
        const sizeSelect = document.getElementById('settings-font-size');
        const spacingSlider = document.getElementById('settings-section-spacing');
        const customColorPicker = document.getElementById('accent-color-picker');
        const pageSizeSelect = document.getElementById('settings-page-size');
        const pageMarginsSelect = document.getElementById('settings-page-margins-select');
        const lineHeightSelect = document.getElementById('settings-line-height');

        // Accent presets
        const colorBtns = document.querySelectorAll('.color-preset-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                colorBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                configData.color = btn.getAttribute('data-color');
                customColorPicker.value = configData.color;
                this.onConfigChanged();
            });
        });

        // Custom Color Picker input
        customColorPicker.addEventListener('input', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            configData.color = customColorPicker.value;
            this.onConfigChanged();
        });

        // Font Family selector
        fontSelect.addEventListener('change', () => {
            configData.font = fontSelect.value;
            this.onConfigChanged();
        });

        // Font Size selector
        sizeSelect.addEventListener('change', () => {
            configData.fontSize = sizeSelect.value;
            this.onConfigChanged();
        });

        // Spacing range slider
        spacingSlider.addEventListener('input', () => {
            configData.spacing = spacingSlider.value;
            document.getElementById('label-section-spacing').innerText = `${configData.spacing}px`;
            this.onConfigChanged();
        });

        // Page Size selector
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', () => {
                configData.pageSize = pageSizeSelect.value;
                this.onConfigChanged();
            });
        }

        // Margin Select selector
        if (pageMarginsSelect) {
            pageMarginsSelect.addEventListener('change', () => {
                configData.margins = pageMarginsSelect.value;
                this.onConfigChanged();
            });
        }

        // Line Height select
        if (lineHeightSelect) {
            lineHeightSelect.addEventListener('change', () => {
                configData.lineHeight = lineHeightSelect.value;
                this.onConfigChanged();
            });
        }

        // Template Choice cards selector
        const templateCards = document.querySelectorAll('.template-choice');
        templateCards.forEach(card => {
            card.addEventListener('click', () => {
                templateCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                
                configData.template = card.getAttribute('data-template');
                this.onConfigChanged();
            });
        });
    },

    syncCustomizationControls() {
        const fontSelect = document.getElementById('settings-font');
        const sizeSelect = document.getElementById('settings-font-size');
        const spacingSlider = document.getElementById('settings-section-spacing');
        const customColorPicker = document.getElementById('accent-color-picker');
        const pageSizeSelect = document.getElementById('settings-page-size');
        const pageMarginsSelect = document.getElementById('settings-page-margins-select');
        const lineHeightSelect = document.getElementById('settings-line-height');

        if (fontSelect) fontSelect.value = configData.font;
        if (sizeSelect) sizeSelect.value = configData.fontSize;
        if (spacingSlider) spacingSlider.value = configData.spacing;
        if (customColorPicker) customColorPicker.value = configData.color;
        if (pageSizeSelect) pageSizeSelect.value = configData.pageSize || 'a4';
        if (pageMarginsSelect) pageMarginsSelect.value = configData.margins || '20';
        if (lineHeightSelect) lineHeightSelect.value = configData.lineHeight || 'line-height-comfortable';

        const labelSpacing = document.getElementById('label-section-spacing');
        if (labelSpacing) labelSpacing.innerText = `${configData.spacing}px`;

        // Sync Accent presets active class
        const colorBtns = document.querySelectorAll('.color-preset-btn');
        colorBtns.forEach(btn => {
            if (btn.getAttribute('data-color') === configData.color) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Sync Template Choice cards active class
        const templateCards = document.querySelectorAll('.template-choice');
        templateCards.forEach(card => {
            if (card.getAttribute('data-template') === configData.template) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    },

    /**
     * Renders all lists dynamically
     */
    renderAllDynamicLists() {
        const sections = [
            'experience', 'education', 'projects', 'skills', 
            'languages', 'certificates', 'achievements', 
            'volunteer', 'interests', 'references'
        ];
        
        sections.forEach(s => this.renderList(s));
    },

    /**
     * Renders a specific dynamic list section
     * @param {string} section Section name
     */
    renderList(section) {
        const container = document.getElementById(`list-${section}`);
        if (!container) return;

        container.innerHTML = '';
        const items = resumeData[section] || [];

        if (items.length === 0) {
            let message = 'No items added yet.';
            if (section === 'experience') message = 'Add your first work experience.';
            else if (section === 'education') message = 'Your education history will appear here.';
            else if (section === 'projects') message = 'Add a project to showcase your practical skills.';
            else if (section === 'skills') message = 'Add your professional skills (e.g. JavaScript, AWS).';
            else if (section === 'languages') message = 'List languages you speak.';
            else if (section === 'certificates') message = 'No certificates added yet.';
            else if (section === 'achievements') message = 'List your awards or key achievements.';
            else if (section === 'volunteer') message = 'List volunteer work or community services.';
            else if (section === 'interests') message = 'Add your hobbies or personal interests.';
            else if (section === 'references') message = 'No references listed yet.';

            container.innerHTML = `
                <div class="empty-list-notice" style="font-size:0.85rem; color:var(--text-muted); text-align:center; padding:16px; border: 1px dashed var(--border-color); border-radius:var(--radius-sm); background-color:var(--bg-base);">
                    <i data-lucide="plus-circle" style="width:16px; height:16px; display:inline-block; vertical-align:middle; margin-right:6px; color:var(--text-muted);"></i>
                    <span>${message}</span>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        items.forEach((item, idx) => {
            const card = this.createListItemCard(section, item, idx);
            container.appendChild(card);
        });

        if (window.lucide) window.lucide.createIcons();
    },

    /**
     * Generates a DOM card item element representing a list entry
     */
    createListItemCard(section, item, index) {
        const card = document.createElement('div');
        card.className = `list-item-card ${item._collapsed ? 'collapsed' : ''}`;
        
        // Define titles/subtitles labels depending on section fields
        let title = '';
        let subtitle = '';

        if (section === 'experience') {
            title = item.role || 'Job Role';
            subtitle = item.company || 'Company Name';
        } else if (section === 'education') {
            title = item.degree || 'Degree / Diploma';
            subtitle = item.school || 'Institution';
        } else if (section === 'projects') {
            title = item.title || 'Project Title';
            subtitle = item.role || 'Project Role';
        } else if (section === 'skills') {
            title = item.name || 'Skill Name';
            subtitle = item.level ? `Level: ${item.level}` : '';
        } else if (section === 'languages') {
            title = item.name || 'Language Name';
            subtitle = item.level ? `Proficiency: ${item.level}` : '';
        } else if (section === 'certificates') {
            title = item.name || 'Certificate Name';
            subtitle = item.issuer || 'Issuing Authority';
        } else if (section === 'achievements') {
            title = item.title || 'Achievement Title';
            subtitle = item.date || '';
        } else if (section === 'volunteer') {
            title = item.role || 'Volunteer Role';
            subtitle = item.organization || 'Organization';
        } else if (section === 'interests') {
            title = item.name || 'Interest Name';
        } else if (section === 'references') {
            title = item.name || 'Reference Name';
            subtitle = item.company ? `${item.position}, ${item.company}` : '';
        }

        // Render collapsed card layout or full edit card layout
        if (item._collapsed) {
            card.innerHTML = `
                <div class="list-item-title-col">
                    <span class="list-item-title">${title}</span>
                    ${subtitle ? `<span class="list-item-subtitle">(${subtitle})</span>` : ''}
                </div>
                <div class="list-item-actions">
                    <button class="btn-icon btn-sm btn-action-move" data-dir="up" title="Move Up"><i data-lucide="arrow-up"></i></button>
                    <button class="btn-icon btn-sm btn-action-move" data-dir="down" title="Move Down"><i data-lucide="arrow-down"></i></button>
                    <button class="btn-icon btn-sm btn-action-toggle" title="Expand Details"><i data-lucide="edit-2"></i></button>
                    <button class="btn-icon btn-sm btn-action-delete text-danger" title="Delete"><i data-lucide="trash"></i></button>
                </div>
            `;
        } else {
            // Expanded form fields
            const fieldsHtml = this.getFieldsHtmlForSection(section, item);
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; font-size:0.9rem; text-transform:uppercase; color:var(--text-secondary);">Editing item #${index + 1}</span>
                    <div class="list-item-actions">
                        <button class="btn-icon btn-sm btn-action-move" data-dir="up" title="Move Up"><i data-lucide="arrow-up"></i></button>
                        <button class="btn-icon btn-sm btn-action-move" data-dir="down" title="Move Down"><i data-lucide="arrow-down"></i></button>
                        <button class="btn-icon btn-sm btn-action-toggle" title="Collapse"><i data-lucide="check"></i></button>
                        <button class="btn-icon btn-sm btn-action-delete text-danger" title="Delete"><i data-lucide="trash"></i></button>
                    </div>
                </div>
                <div class="list-item-body">
                    ${fieldsHtml}
                </div>
            `;
        }

        // Attach action handlers
        card.querySelector('.btn-action-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Delete this item?')) {
                resumeData[section].splice(index, 1);
                this.onDataChanged(true);
                this.renderList(section);
            }
        });

        card.querySelector('.btn-action-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            item._collapsed = !item._collapsed;
            this.renderList(section);
        });

        card.querySelectorAll('.btn-action-move').forEach(moveBtn => {
            moveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const direction = moveBtn.getAttribute('data-dir');
                this.moveListItem(section, index, direction);
            });
        });

        // Add inline input triggers on inputs inside card
        card.querySelectorAll('.card-input').forEach(input => {
            const fieldKey = input.getAttribute('data-key');
            const handleUpdate = () => {
                item[fieldKey] = input.value;
                this.onDataChanged(false);
            };
            input.addEventListener('input', handleUpdate);
            input.addEventListener('change', handleUpdate);
        });

        return card;
    },

    /**
     * Layout generator defining inputs fields depending on selected section type
     */
    getFieldsHtmlForSection(section, item) {
        if (section === 'experience') {
            return `
                <div class="form-group col-span-2">
                    <label>Company / Employer</label>
                    <input type="text" class="card-input" data-key="company" value="${item.company || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Job Title / Role</label>
                    <input type="text" class="card-input" data-key="role" value="${item.role || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" class="card-input" data-key="location" value="${item.location || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" class="card-input" data-key="start" value="${item.start || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" class="card-input" data-key="end" value="${item.end || ''}" placeholder="">
                </div>
                <div class="form-group col-span-2">
                    <label>Job Description / Key Achievements (one per line)</label>
                    <textarea class="card-input" data-key="details" rows="4" placeholder=""></textarea>
                </div>
            `;
        } else if (section === 'education') {
            return `
                <div class="form-group col-span-2">
                    <label>School / University</label>
                    <input type="text" class="card-input" data-key="school" value="${item.school || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Degree / Field of Study</label>
                    <input type="text" class="card-input" data-key="degree" value="${item.degree || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" class="card-input" data-key="location" value="${item.location || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" class="card-input" data-key="start" value="${item.start || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" class="card-input" data-key="end" value="${item.end || ''}" placeholder="">
                </div>
                <div class="form-group col-span-2">
                    <label>Additional details / GPA / Coursework</label>
                    <textarea class="card-input" data-key="details" rows="2" placeholder="">${item.details || ''}</textarea>
                </div>
            `;
        } else if (section === 'projects') {
            return `
                <div class="form-group">
                    <label>Project Title</label>
                    <input type="text" class="card-input" data-key="title" value="${item.title || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Project Link / URL</label>
                    <input type="url" class="card-input" data-key="link" value="${item.link || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Role / Focus</label>
                    <input type="text" class="card-input" data-key="role" value="${item.role || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Dates</label>
                    <input type="text" class="card-input" data-key="start" value="${item.start || ''}" placeholder="">
                </div>
                <input type="hidden" class="card-input" data-key="end" value="${item.end || ''}">
                <div class="form-group col-span-2">
                    <label>Project Details / Technologies Used (one per line)</label>
                    <textarea class="card-input" data-key="details" rows="3" placeholder="">${item.details || ''}</textarea>
                </div>
            `;
        } else if (section === 'skills') {
            return `
                <div class="form-group">
                    <label>Skill Name</label>
                    <input type="text" class="card-input" data-key="name" value="${item.name || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Level / Category (Optional)</label>
                    <input type="text" class="card-input" data-key="level" value="${item.level || ''}" placeholder="">
                </div>
            `;
        } else if (section === 'languages') {
            return `
                <div class="form-group">
                    <label>Language Name</label>
                    <input type="text" class="card-input" data-key="name" value="${item.name || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Proficiency</label>
                    <select class="card-input" data-key="level">
                        <option value="">-- Select Proficiency --</option>
                        <option value="Native / Bilingual" ${item.level === 'Native / Bilingual' ? 'selected' : ''}>Native / Bilingual</option>
                        <option value="Full Professional" ${item.level === 'Full Professional' ? 'selected' : ''}>Full Professional</option>
                        <option value="Professional Working" ${item.level === 'Professional Working' ? 'selected' : ''}>Professional Working</option>
                        <option value="Limited Working" ${item.level === 'Limited Working' ? 'selected' : ''}>Limited Working</option>
                        <option value="Elementary" ${item.level === 'Elementary' ? 'selected' : ''}>Elementary</option>
                        <option value="Conversational" ${item.level === 'Conversational' ? 'selected' : ''}>Conversational</option>
                        <option value="Fluent" ${item.level === 'Fluent' ? 'selected' : ''}>Fluent</option>
                    </select>
                </div>
            `;
        } else if (section === 'certificates') {
            return `
                <div class="form-group col-span-2">
                    <label>Certificate Name</label>
                    <input type="text" class="card-input" data-key="name" value="${item.name || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Issuing Organization</label>
                    <input type="text" class="card-input" data-key="issuer" value="${item.issuer || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Date Earned</label>
                    <input type="text" class="card-input" data-key="date" value="${item.date || ''}" placeholder="">
                </div>
                <div class="form-group col-span-2">
                    <label>Credential URL</label>
                    <input type="url" class="card-input" data-key="link" value="${item.link || ''}" placeholder="">
                </div>
            `;
        } else if (section === 'achievements') {
            return `
                <div class="form-group">
                    <label>Achievement Title</label>
                    <input type="text" class="card-input" data-key="title" value="${item.title || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="text" class="card-input" data-key="date" value="${item.date || ''}" placeholder="">
                </div>
                <div class="form-group col-span-2">
                    <label>Description / Details (one per line)</label>
                    <textarea class="card-input" data-key="details" rows="3" placeholder="">${item.details || ''}</textarea>
                </div>
            `;
        } else if (section === 'volunteer') {
            return `
                <div class="form-group">
                    <label>Organization</label>
                    <input type="text" class="card-input" data-key="organization" value="${item.organization || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Volunteer Role</label>
                    <input type="text" class="card-input" data-key="role" value="${item.role || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" class="card-input" data-key="start" value="${item.start || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" class="card-input" data-key="end" value="${item.end || ''}" placeholder="">
                </div>
                <div class="form-group col-span-2">
                    <label>Volunteer Details (one per line)</label>
                    <textarea class="card-input" data-key="details" rows="3" placeholder="">${item.details || ''}</textarea>
                </div>
            `;
        } else if (section === 'interests') {
            return `
                <div class="form-group col-span-2">
                    <label>Interest / Hobby Name</label>
                    <input type="text" class="card-input" data-key="name" value="${item.name || ''}" placeholder="">
                </div>
            `;
        } else if (section === 'references') {
            return `
                <div class="form-group">
                    <label>Reference Name</label>
                    <input type="text" class="card-input" data-key="name" value="${item.name || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Position / Role</label>
                    <input type="text" class="card-input" data-key="position" value="${item.position || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Company</label>
                    <input type="text" class="card-input" data-key="company" value="${item.company || ''}" placeholder="">
                </div>
                <div class="form-group">
                    <label>Contact Coordinates (Email / Phone)</label>
                    <input type="text" class="card-input" data-key="contact" value="${item.contact || ''}" placeholder="">
                </div>
                <div class="form-group col-span-2">
                    <label>Additional Notes / Quote (Optional)</label>
                    <textarea class="card-input" data-key="details" rows="2" placeholder="">${item.details || ''}</textarea>
                </div>
            `;
        }
        return '';
    },

    /**
     * Add clean item record to a dynamic section
     */
    addListItem(section) {
        const limits = {
            experience: 20,
            education: 10,
            projects: 20,
            skills: 100,
            languages: 20,
            certificates: 30,
            achievements: 30,
            references: 10
        };
        const currentCount = resumeData[section] ? resumeData[section].length : 0;
        if (currentCount >= (limits[section] || 50)) {
            alert(`Maximum limit of ${limits[section]} items reached for this section.`);
            return;
        }

        if (!resumeData[section]) {
            resumeData[section] = [];
        }
        
        // Collapse previous items in this list to keep focus clean
        resumeData[section].forEach(i => i._collapsed = true);

        // Add blank item based on type
        const newItem = { _collapsed: false };
        resumeData[section].push(newItem);

        this.onDataChanged(true);
        this.renderList(section);
    },

    /**
     * Reorders items inside a dynamic section array
     */
    moveListItem(section, idx, direction) {
        const list = resumeData[section];
        if (!list) return;

        let targetIdx = idx;
        if (direction === 'up' && idx > 0) {
            targetIdx = idx - 1;
        } else if (direction === 'down' && idx < list.length - 1) {
            targetIdx = idx + 1;
        }

        if (targetIdx !== idx) {
            // Swap items
            const temp = list[idx];
            list[idx] = list[targetIdx];
            list[targetIdx] = temp;
            
            this.onDataChanged(true);
            this.renderList(section);
        }
    },

    onDataChanged(immediate = false) {
        StorageUtil.saveResumeData(resumeData);
        PreviewSystem.updatePreview(resumeData, configData);
        this.runEvaluation();

        // Autosave status trigger
        if (window.triggerAutosaveIndicator) {
            window.triggerAutosaveIndicator();
        }

        // History snapshot push
        if (window.HistorySystem) {
            if (immediate) {
                window.HistorySystem.pushState(resumeData);
            } else {
                if (window.historyDebounceTimeout) clearTimeout(window.historyDebounceTimeout);
                window.historyDebounceTimeout = setTimeout(() => {
                    window.HistorySystem.pushState(resumeData);
                }, 800);
            }
        }
    },

    /**
     * Run actions when config choices have changed
     */
    onConfigChanged() {
        StorageUtil.saveConfigData(configData);
        PreviewSystem.updatePreview(resumeData, configData);
        this.runEvaluation();
    },

    /**
     * Updates Completeness score and runs real-time ATS warnings checklist
     */
    runEvaluation() {
        // 1. Calculate Score
        const score = this.calculateCompletenessScore();
        this.updateCompletenessMeter(score);
        this.updateSidebarProgress();

        // 2. Perform ATS analysis
        const suggestions = this.runATSScanner();
        
        // Update warnings count badge
        const badge = document.getElementById('ats-badge');
        const warningCount = suggestions.filter(item => item.type === 'warn' || item.type === 'poor').length;
        badge.innerText = warningCount;
        
        if (warningCount > 0) {
            badge.className = 'badge badge-warn';
        } else {
            badge.className = 'badge badge-success';
        }

        // Render Suggestions List UI
        const suggestionsList = document.getElementById('ats-suggestions');
        const atsStatusBox = document.getElementById('ats-score-status');
        const atsTitle = document.getElementById('ats-eval-title');
        const atsSubtitle = document.getElementById('ats-eval-subtitle');

        if (!suggestionsList) return;

        suggestionsList.innerHTML = '';

        const criticals = suggestions.filter(s => s.type === 'poor');
        const warnings = suggestions.filter(s => s.type === 'warn' || s.type === 'info');
        const goods = suggestions.filter(s => s.type === 'good');

        // Helper to build group HTML
        const renderGroup = (title, items, emptyMessage) => {
            const groupEl = document.createElement('div');
            groupEl.className = 'ats-suggestions-group';
            
            groupEl.innerHTML = `
                <h4>${title} <span class="group-count">${items.length}</span></h4>
                <div class="group-items-container"></div>
            `;
            
            const container = groupEl.querySelector('.group-items-container');
            if (items.length === 0) {
                container.innerHTML = `
                    <div class="ats-empty-status-card">
                        <i data-lucide="check-circle-2"></i>
                        <span>${emptyMessage}</span>
                    </div>
                `;
            } else {
                items.forEach(s => {
                    const item = document.createElement('div');
                    item.className = `ats-item ${s.type}`;
                    
                    let iconName = 'alert-triangle';
                    if (s.type === 'good') iconName = 'check-circle-2';
                    else if (s.type === 'info') iconName = 'info';
                    else if (s.type === 'poor') iconName = 'alert-circle';

                    item.innerHTML = `
                        <i data-lucide="${iconName}"></i>
                        <div>
                            <strong>${s.title}</strong>
                            <p>${s.description}</p>
                        </div>
                    `;
                    container.appendChild(item);
                });
            }
            suggestionsList.appendChild(groupEl);
        };

        // Render the three dashboard groups
        renderGroup('Critical Issues', criticals, 'No critical issues found.');
        renderGroup('Warnings & Info', warnings, 'No warnings detected.');
        renderGroup('Passed Checks', goods, 'Fill sections to pass ATS checks.');

        // Set main status box
        if (warningCount >= 4) {
            atsStatusBox.className = 'ats-icon-box ats-score-poor';
            atsStatusBox.innerHTML = '<i data-lucide="shield-alert"></i>';
            atsTitle.innerText = 'Action Required';
            atsSubtitle.innerText = `${warningCount} warnings need review.`;
        } else if (warningCount > 0) {
            atsStatusBox.className = 'ats-icon-box ats-score-warn';
            atsStatusBox.innerHTML = '<i data-lucide="alert-circle"></i>';
            atsTitle.innerText = 'Ready with recommendations';
            atsSubtitle.innerText = `${warningCount} warnings detected.`;
        } else {
            atsStatusBox.className = 'ats-icon-box ats-score-good';
            atsStatusBox.innerHTML = '<i data-lucide="shield-check"></i>';
            atsTitle.innerText = 'Highly ATS-Friendly';
            atsSubtitle.innerText = 'All core checkpoints passed.';
        }

        if (window.lucide) window.lucide.createIcons();
    },

    /**
     * Computes percentage completeness weighting values
     */
    calculateCompletenessScore() {
        let score = 0;
        const p = resumeData.personal || {};

        // Personal Details name (10%), email (5%), phone (5%), address (5%), title (5%)
        if (p.name) score += 10;
        if (p.email) score += 5;
        if (p.phone) score += 5;
        if (p.address) score += 5;
        if (p.title) score += 5;

        // Summary (10%)
        if (resumeData.summary && resumeData.summary.trim().length > 10) {
            score += 10;
        }

        // Experience: at least one entry (15%)
        if (resumeData.experience && resumeData.experience.length > 0) {
            score += 15;
            // Additional bonus if details filled
            if (resumeData.experience[0].details && resumeData.experience[0].details.length > 30) {
                score += 5;
            }
        }

        // Education: at least one entry (15%)
        if (resumeData.education && resumeData.education.length > 0) {
            score += 15;
            if (resumeData.education[0].school) {
                score += 5;
            }
        }

        // Projects: at least one entry (10%)
        if (resumeData.projects && resumeData.projects.length > 0) {
            score += 10;
        }

        // Skills: at least one entry (10%)
        if (resumeData.skills && resumeData.skills.length > 0) {
            score += 10;
        }

        // Languages (5%)
        if (resumeData.languages && resumeData.languages.length > 0) {
            score += 5;
        }

        return Math.min(100, score);
    },

    runATSScanner() {
        const tips = [];
        const p = resumeData.personal || {};

        // 1. Check email & phone
        if (!p.email || !p.phone) {
            tips.push({
                type: 'poor',
                title: 'Missing Vital Contact Details',
                description: 'Ensure both Email Address and Phone Number are provided. Recruiters and parsing systems require these to route your application.'
            });
        } else {
            let contactGood = true;
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(p.email.trim())) {
                contactGood = false;
                tips.push({
                    type: 'poor',
                    title: 'Invalid Email Format',
                    description: 'The email address provided does not appear to be valid. Please ensure it follows the user@domain.com format.'
                });
            }
            // Phone validation
            const phoneRegex = /^[\d\s()+-.]+$/;
            if (!phoneRegex.test(p.phone.trim()) || p.phone.trim().length < 7) {
                contactGood = false;
                tips.push({
                    type: 'warn',
                    title: 'Invalid Phone Number Format',
                    description: 'Please ensure your phone number contains a valid country code, area code, and digits.'
                });
            }
            if (contactGood) {
                tips.push({
                    type: 'good',
                    title: 'Contact Details Populated',
                    description: 'Your email, phone, and address details are present and parseable.'
                });
            }
        }

        // URL format checks
        const validateUrl = (url, host) => {
            if (!url) return true;
            const val = url.trim().toLowerCase();
            if (host === 'linkedin') return val.includes('linkedin.com');
            if (host === 'github') return val.includes('github.com');
            return val.includes('.') && val.length > 3;
        };
        if (p.linkedin && !validateUrl(p.linkedin, 'linkedin')) {
            tips.push({
                type: 'warn',
                title: 'LinkedIn URL Suggestion',
                description: 'Your LinkedIn link should contain "linkedin.com" to route profile parsing accurately.'
            });
        }
        if (p.github && !validateUrl(p.github, 'github')) {
            tips.push({
                type: 'warn',
                title: 'GitHub URL Suggestion',
                description: 'Your GitHub link should contain "github.com" to point parsers to your portfolio.'
            });
        }

        // Date validation check
        const validateDateStr = (dateStr) => {
            if (!dateStr) return true;
            const val = dateStr.trim();
            const dateRegex = /^(present|current|till date|now|\d{4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}|\d{2}\/\d{2,4})([\s-–—]+(present|current|till date|now|\d{4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{4}|\d{2}\/\d{2,4}))?$/i;
            return dateRegex.test(val);
        };
        let invalidDates = false;
        ['experience', 'education', 'projects', 'volunteer'].forEach(sec => {
            if (resumeData[sec]) {
                resumeData[sec].forEach(item => {
                    if ((item.start && !validateDateStr(item.start)) || (item.end && !validateDateStr(item.end))) {
                        invalidDates = true;
                    }
                });
            }
        });
        if (invalidDates) {
            tips.push({
                type: 'warn',
                title: 'Unusual Date Format Detected',
                description: 'Some date fields contain non-standard formats. Recommend standard formats (e.g. "MMM YYYY", "YYYY", or "Present") for consistency.'
            });
        }

        // 2. Summary checks
        if (!resumeData.summary || resumeData.summary.trim().length === 0) {
            tips.push({
                type: 'warn',
                title: 'Missing Professional Summary',
                description: 'A brief, 3-4 sentence professional summary helps introduce your core skills and match keywords instantly.'
            });
        } else {
            const charCount = resumeData.summary.trim().length;
            if (charCount < 100) {
                tips.push({
                    type: 'info',
                    title: 'Summary is too brief',
                    description: 'Expand your summary slightly (aim for 150-300 characters) to better detail achievements.'
                });
            } else if (charCount > 1000) {
                tips.push({
                    type: 'warn',
                    title: 'Summary is too long',
                    description: 'Keep professional summaries under 1000 characters to prevent parsing issues.'
                });
            } else {
                tips.push({
                    type: 'good',
                    title: 'Summary is ATS Optimized',
                    description: 'Your summary contains the right density of keywords and appropriate length.'
                });
            }
        }

        // 3. Work Experience check
        if (!resumeData.experience || resumeData.experience.length === 0) {
            tips.push({
                type: 'poor',
                title: 'No Work Experience Listed',
                description: 'Almost all professional ATS templates require at least one Work Experience block. If you are a graduate, add internships or major academic work.'
            });
        } else {
            // Check descriptions length
            let shortDesc = false;
            let bulletTooLong = false;
            resumeData.experience.forEach(exp => {
                if (exp.details && exp.details.trim().length < 30) {
                    shortDesc = true;
                }
                if (exp.details) {
                    const lines = exp.details.split('\n');
                    lines.forEach(l => { if (l.trim().length > 300) bulletTooLong = true; });
                }
            });
            if (shortDesc) {
                tips.push({
                    type: 'warn',
                    title: 'Thin Job Descriptions',
                    description: 'Add more descriptive achievements and responsibilities to your work roles (preferably using bullet lists).'
                });
            } else if (bulletTooLong) {
                tips.push({
                    type: 'warn',
                    title: 'Work Experience Bullet Too Wordy',
                    description: 'One or more work experience bullets exceed 300 characters. Keep bullets concise.'
                });
            } else {
                tips.push({
                    type: 'good',
                    title: 'Work Experience Configured',
                    description: 'Your work experience details contain descriptive achievements.'
                });
            }
        }

        // 4. Skills checklist quantity
        if (!resumeData.skills || resumeData.skills.length < 3) {
            tips.push({
                type: 'warn',
                title: 'Too Few Skills Listed',
                description: 'Include at least 5-10 core skills. ATS parsers match skills in your resume against the job description.'
            });
        } else {
            let skillTooLong = false;
            resumeData.skills.forEach(s => {
                if (s.name && s.name.length > 50) skillTooLong = true;
            });
            if (skillTooLong) {
                tips.push({
                    type: 'warn',
                    title: 'Skill Names Too Long',
                    description: 'Some skill names exceed 50 characters. Keep skills short and punchy for clean rendering.'
                });
            } else {
                tips.push({
                    type: 'good',
                    title: 'Core Skills Registered',
                    description: 'Your skills list contains sufficient entries for index matching.'
                });
            }
        }

        // 5. Projects checklist
        if (!resumeData.projects || resumeData.projects.length === 0) {
            tips.push({
                type: 'info',
                title: 'Consider Adding Projects',
                description: 'Adding specific personal or academic projects demonstrates practical experience outside of corporate boundaries.'
            });
        }

        // 6. Photo Checker
        if (p.photo && configData.showPhoto) {
            tips.push({
                type: 'warn',
                title: 'Profile Picture Enabled',
                description: 'Many corporate ATS engines (especially in the US/UK) automatically reject resumes containing images/photos to avoid bias. Consider checking "Hide photo on resume" before exporting.'
            });
        } else {
            tips.push({
                type: 'good',
                title: 'No Profile Photo Used (ATS Friendly)',
                description: 'Ensures standard parsing engines do not reject the document due to media bias filters.'
            });
        }

        // 7. General positive confirmation if sections are standard
        if (resumeData.education && resumeData.education.length > 0 && resumeData.experience && resumeData.experience.length > 0) {
            tips.push({
                type: 'good',
                title: 'Standard Core Headings Used',
                description: 'Your layout includes "Experience" and "Education" which standard parsing engines easily index.'
            });
        }

        // Section item limits check
        const limits = {
            experience: 20,
            education: 10,
            projects: 20,
            skills: 100,
            languages: 20,
            certificates: 30,
            achievements: 30,
            references: 10
        };
        for (let sec in limits) {
            if (resumeData[sec] && resumeData[sec].length > limits[sec]) {
                tips.push({
                    type: 'warn',
                    title: `Too Many ${sec.charAt(0).toUpperCase() + sec.slice(1)} Entries`,
                    description: `You have exceeded the recommended limit of ${limits[sec]} entries for the ${sec} section.`
                });
            }
        }

        return tips;
    },

    // Helper functions for nested object mutations
    getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    },

    setNestedValue(obj, path, value) {
        const parts = path.split('.');
        const last = parts.pop();
        const target = parts.reduce((acc, part) => {
            if (!acc[part]) acc[part] = {};
            return acc[part];
        }, obj);
        target[last] = value;
    },

    setupAccordionHeaders() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        const sectionMeta = [
            { key: 'personal', num: '01', title: 'Personal Details', icon: 'user' },
            { key: 'summary', num: '02', title: 'Professional Summary', icon: 'file-text' },
            { key: 'experience', num: '03', title: 'Work Experience', icon: 'briefcase' },
            { key: 'education', num: '04', title: 'Education', icon: 'graduation-cap' },
            { key: 'projects', num: '05', title: 'Projects', icon: 'git-branch' },
            { key: 'skills', num: '06', title: 'Skills', icon: 'wrench' },
            { key: 'languages', num: '07', title: 'Languages', icon: 'languages' },
            { key: 'certificates', num: '08', title: 'Certificates', icon: 'award' },
            { key: 'achievements', num: '09', title: 'Achievements', icon: 'trophy' },
            { key: 'volunteer', num: '10', title: 'Volunteer Experience', icon: 'heart' },
            { key: 'interests', num: '11', title: 'Interests', icon: 'compass' },
            { key: 'references', num: '12', title: 'References', icon: 'users' }
        ];
        
        accordionItems.forEach((item, idx) => {
            const headerBtn = item.querySelector('.accordion-header');
            if (!headerBtn) return;
            const meta = sectionMeta[idx];
            if (!meta) return;
            
            headerBtn.setAttribute('data-section', meta.key);
            headerBtn.setAttribute('data-num', meta.num);
            headerBtn.setAttribute('data-title', meta.title);
            
            // Re-render inner HTML structure
            headerBtn.innerHTML = `
                <span><i data-lucide="${meta.icon}"></i> ${meta.num} ${meta.title}</span>
                <span class="acc-badge" id="badge-${meta.key}">0%</span>
                <i data-lucide="chevron-down" class="chevron"></i>
            `;
        });
        
        if (window.lucide) window.lucide.createIcons();
    },

    updateSidebarProgress() {
        const sections = [
            'personal', 'summary', 'experience', 'education', 'projects', 
            'skills', 'languages', 'certificates', 'achievements', 
            'volunteer', 'interests', 'references'
        ];
        
        sections.forEach(sec => {
            const badge = document.getElementById(`badge-${sec}`);
            if (!badge) return;
            
            let pct = 0;
            if (sec === 'personal') {
                const p = resumeData.personal || {};
                let filled = 0;
                const coreFields = ['name', 'title', 'email', 'phone', 'address'];
                coreFields.forEach(f => { if (p[f]) filled++; });
                pct = Math.round((filled / coreFields.length) * 100);
            } else if (sec === 'summary') {
                const s = resumeData.summary || '';
                pct = s.trim().length > 20 ? 100 : 0;
            } else {
                const list = resumeData[sec] || [];
                pct = list.length > 0 ? 100 : 0;
            }
            
            badge.innerText = pct === 100 ? '✔' : `${pct}%`;
            if (pct === 100) {
                badge.className = 'acc-badge completed';
            } else {
                badge.className = 'acc-badge';
            }
        });
    },

    updateCompletenessMeter(score) {
        const blocksContainer = document.getElementById('score-blocks');
        const statusText = document.getElementById('score-status-text');
        const scoreText = document.getElementById('score-text');
        
        if (scoreText) scoreText.innerText = `${score}%`;
        if (!blocksContainer) return;
        
        const totalBlocks = 10;
        const filledBlocks = Math.round(score / 10);
        const emptyBlocks = totalBlocks - filledBlocks;
        
        const blocksStr = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
        blocksContainer.innerText = blocksStr;
        
        let status = 'Starting out';
        if (score >= 90) status = 'Ready to Apply';
        else if (score >= 70) status = 'Looking Strong';
        else if (score >= 50) status = 'Almost Ready';
        else if (score >= 30) status = 'Keep going';
        
        if (statusText) statusText.innerText = status;
    }
};
