/* templates.js - Resume HTML Templating Engines */

const TemplateSystem = {
    /**
     * Safe string helper – converts undefined/null to empty string
     */
    /**
     * Escape HTML special characters to prevent XSS
     */
    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    /**
     * Safe string helper – converts undefined/null to empty string, escapes HTML, and preserves newlines
     */
    s(val) {
        if (val === undefined || val === null) return '';
        return this.escapeHtml(val).replace(/\n/g, '<br>');
    },

    /**
     * Safe profile image parser – validates data URLs and image links
     */
    safePhoto(val) {
        if (!val) return '';
        const trimmed = val.trim();
        if (/^data:image\/(jpeg|png|jpg|webp|svg\+xml);base64,/i.test(trimmed)) {
            return trimmed;
        }
        if (/^data:image\/svg\+xml;utf8,/i.test(trimmed)) {
            // Encode double quotes so they don't break HTML src="..." attributes
            return trimmed.replace(/"/g, '%22');
        }
        if (/^https?:\/\//i.test(trimmed)) {
            return this.escapeHtml(trimmed);
        }
        return '';
    },

    /**
     * Filters dynamic list items: skip entries that have no meaningful content
     * (i.e. user clicked Add but didn't fill anything). Checks all own string keys except _collapsed.
     */
    filterEmpty(items) {
        if (!items || !Array.isArray(items)) return [];
        return items.filter(item => {
            return Object.keys(item).some(key => {
                if (key.startsWith('_')) return false;
                return item[key] && String(item[key]).trim().length > 0;
            });
        });
    },

    /**
     * Formats newline-delimited text blocks into HTML bullet points
     * @param {string} text Input text details
     * @returns {string} HTML <ul> list
     */
    formatBullets(text) {
        if (!text) return '';
        const lines = text.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);
        
        if (lines.length === 0) return '';
        
        const listItems = lines.map(line => {
            // Strip leading bullet symbols if user typed them manually
            let cleanLine = line;
            if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                cleanLine = line.substring(1).trim();
            }
            return `<li>${this.escapeHtml(cleanLine)}</li>`;
        }).join('');
        
        return `<ul>${listItems}</ul>`;
    },

    /**
     * Dynamic Contact Item Renderer
     */
    renderContactItem(val, icon, label, isUrl = false) {
        if (!val) return '';
        let displayVal = val.trim();
        let href = val.trim();
        
        // Clean URL display
        if (isUrl) {
            displayVal = displayVal.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
            if (!/^https?:\/\//i.test(href)) {
                href = 'https://' + href;
            }
            href = this.escapeHtml(href);
            displayVal = this.escapeHtml(displayVal);
        } else if (icon === 'mail') {
            displayVal = this.escapeHtml(displayVal);
            href = `mailto:${displayVal}`;
        } else if (icon === 'phone') {
            displayVal = this.escapeHtml(displayVal);
            href = `tel:${displayVal.replace(/[^\d+]/g, '')}`;
        } else {
            displayVal = this.escapeHtml(displayVal);
        }
        
        return `
            <div class="cv-contact-item" title="${this.escapeHtml(label)}">
                <i data-lucide="${this.escapeHtml(icon)}"></i>
                ${isUrl || icon === 'mail' || icon === 'phone' 
                    ? `<a href="${href}" target="_blank">${displayVal}</a>` 
                    : `<span>${displayVal}</span>`
                }
            </div>
        `;
    },

    /**
     * Modern Template (Two-column asymmetric layout)
     */
    modern(data, config) {
        const hasPhoto = data.personal.photo && config.showPhoto;
        
        // Build Sidebar Content
        let sidebarHtml = '';
        if (hasPhoto) {
            sidebarHtml += `
                <div class="cv-photo-wrapper">
                    <img src="${this.safePhoto(data.personal.photo)}" class="cv-photo" alt="${this.s(data.personal.name)}">
                </div>
            `;
        }
        
        // Contact details in Sidebar
        let contactHtml = '';
        contactHtml += this.renderContactItem(data.personal.email, 'mail', 'Email');
        contactHtml += this.renderContactItem(data.personal.phone, 'phone', 'Phone');
        contactHtml += this.renderContactItem(data.personal.address, 'map-pin', 'Location');
        contactHtml += this.renderContactItem(data.personal.linkedin, 'linkedin', 'LinkedIn', true);
        contactHtml += this.renderContactItem(data.personal.github, 'github', 'GitHub', true);
        contactHtml += this.renderContactItem(data.personal.portfolio, 'globe', 'Portfolio', true);
        contactHtml += this.renderContactItem(data.personal.website, 'link', 'Website', true);
        
        if (contactHtml) {
            sidebarHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Contact</div>
                    ${contactHtml}
                </div>
            `;
        }

        // Skills in Sidebar
        if (data.skills && data.skills.length > 0) {
            sidebarHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Skills</div>
                    <div class="cv-skills-grid">
                        ${this.filterEmpty(data.skills).map(s => `<span class="cv-skill-badge">${this.s(s.name)}${s.level ? ` (${this.s(s.level)})` : ''}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Languages in Sidebar
        if (data.languages && data.languages.length > 0) {
            sidebarHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Languages</div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${this.filterEmpty(data.languages).map(l => `
                            <div class="cv-lang-item">
                                <span class="lang-name">${this.s(l.name)}</span>
                                <span class="lang-level">${l.level || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Interests in Sidebar
        if (data.interests && data.interests.length > 0) {
            sidebarHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Interests</div>
                    <div class="cv-skills-grid">
                        ${this.filterEmpty(data.interests).map(i => `<span class="cv-skill-badge">${i.name}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Build Main Area Content
        let mainHtml = `
            <div class="cv-header">
                <div class="cv-name">${data.personal.name || 'Your Name'}</div>
                <div class="cv-title">${data.personal.title || 'Professional Title'}</div>
            </div>
        `;

        if (data.summary) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Summary</div>
                    <div class="cv-item-details">${this.s(data.summary)}</div>
                </div>
            `;
        }

        // Experience
        if (data.experience && data.experience.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Experience</div>
                    ${this.filterEmpty(data.experience).map(exp => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(exp.role)}</span>
                                <span class="cv-item-date">${this.s(exp.start)} - ${this.s(exp.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(exp.company)}</span>
                                <span>${this.s(exp.location)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(exp.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Education
        if (data.education && data.education.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Education</div>
                    ${this.filterEmpty(data.education).map(edu => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(edu.degree)}</span>
                                <span class="cv-item-date">${this.s(edu.start)} - ${this.s(edu.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(edu.school)}</span>
                                <span>${this.s(edu.location)}</span>
                            </div>
                            ${edu.details ? `<div class="cv-item-details">${this.formatBullets(edu.details)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Projects
        if (data.projects && data.projects.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Projects</div>
                    ${this.filterEmpty(data.projects).map(p => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">
                                    ${this.s(p.title)} 
                                    ${p.link ? `<a href="${this.s(p.link)}" target="_blank" style="font-size:0.85em; font-weight:normal; color:var(--accent-color); margin-left:8px;"><i data-lucide="external-link" style="width:12px; height:12px; display:inline-block; vertical-align:middle;"></i></a>` : ''}
                                </span>
                                <span class="cv-item-date">${this.s(p.start)} - ${this.s(p.end)}</span>
                            </div>
                            ${p.role ? `<div class="cv-item-meta"><span class="cv-item-subtitle">${this.s(p.role)}</span></div>` : ''}
                            <div class="cv-item-details">${this.formatBullets(p.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Certificates
        if (data.certificates && data.certificates.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Certificates</div>
                    ${this.filterEmpty(data.certificates).map(c => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(c.name)}</span>
                                <span class="cv-item-date">${c.date || ''}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(c.issuer)}</span>
                                ${c.link ? `<a href="${this.s(c.link)}" target="_blank" style="font-size:0.85em;"><i data-lucide="external-link" style="width:12px; height:12px;"></i> View</a>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Achievements
        if (data.achievements && data.achievements.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Achievements</div>
                    ${this.filterEmpty(data.achievements).map(a => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(a.title)}</span>
                                <span class="cv-item-date">${a.date || ''}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(a.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Volunteer
        if (data.volunteer && data.volunteer.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Volunteer Experience</div>
                    ${this.filterEmpty(data.volunteer).map(v => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(v.role)}</span>
                                <span class="cv-item-date">${this.s(v.start)} - ${this.s(v.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(v.organization)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(v.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // References
        if (data.references && data.references.length > 0) {
            mainHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">References</div>
                    <div class="cv-grid-2col">
                        ${this.filterEmpty(data.references).map(r => `
                            <div class="cv-item">
                                <div class="cv-item-title">${this.s(r.name)}</div>
                                <div class="cv-item-subtitle" style="font-size:0.9em; font-weight:500;">${this.s(r.position)}, ${this.s(r.company)}</div>
                                <div style="font-size:0.85em; color:#475569; margin-top:2px;">${this.s(r.contact)}</div>
                                ${r.details ? `<div style="font-size:0.85em; font-style:italic; margin-top:4px;">"${this.s(r.details)}"</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return `
            <div class="cv-sidebar">${sidebarHtml}</div>
            <div class="cv-main">${mainHtml}</div>
        `;
    },

    /**
     * Classic Template (Centered Single Column layout)
     */
    classic(data, config) {
        const hasPhoto = data.personal.photo && config.showPhoto;
        let html = '';

        // Header
        html += `<div class="cv-header">`;
        if (hasPhoto) {
            html += `
                <div class="cv-photo-wrapper">
                    <img src="${this.safePhoto(data.personal.photo)}" class="cv-photo" style="border-radius: 50%;" alt="${this.s(data.personal.name)}">
                </div>
            `;
        }
        html += `
            <div class="cv-name">${data.personal.name || 'Your Name'}</div>
            <div class="cv-title">${data.personal.title || 'Professional Title'}</div>
        `;
        
        // Contact details inline list
        let contacts = [];
        if (data.personal.email) contacts.push(this.renderContactItem(data.personal.email, 'mail', 'Email'));
        if (data.personal.phone) contacts.push(this.renderContactItem(data.personal.phone, 'phone', 'Phone'));
        if (data.personal.address) contacts.push(this.renderContactItem(data.personal.address, 'map-pin', 'Location'));
        if (data.personal.linkedin) contacts.push(this.renderContactItem(data.personal.linkedin, 'linkedin', 'LinkedIn', true));
        if (data.personal.github) contacts.push(this.renderContactItem(data.personal.github, 'github', 'GitHub', true));
        if (data.personal.portfolio) contacts.push(this.renderContactItem(data.personal.portfolio, 'globe', 'Portfolio', true));
        if (data.personal.website) contacts.push(this.renderContactItem(data.personal.website, 'link', 'Website', true));
        
        if (contacts.length > 0) {
            html += `<div class="cv-contact-container">${contacts.join('')}</div>`;
        }
        html += `</div>`; // Close Header

        // Summary
        if (data.summary) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Summary</div>
                    <div class="cv-item-details" style="text-align: center; max-width: 90%; margin: 0 auto;">${this.s(data.summary)}</div>
                </div>
            `;
        }

        // Experience
        if (data.experience && data.experience.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Professional Experience</div>
                    ${this.filterEmpty(data.experience).map(exp => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(exp.role)}</span>
                                <span class="cv-item-date">${this.s(exp.start)} - ${this.s(exp.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(exp.company)}</span>
                                <span>${this.s(exp.location)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(exp.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Education
        if (data.education && data.education.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Education</div>
                    ${this.filterEmpty(data.education).map(edu => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(edu.degree)}</span>
                                <span class="cv-item-date">${this.s(edu.start)} - ${this.s(edu.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(edu.school)}</span>
                                <span>${this.s(edu.location)}</span>
                            </div>
                            ${edu.details ? `<div class="cv-item-details">${this.formatBullets(edu.details)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Projects
        if (data.projects && data.projects.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Key Projects</div>
                    ${this.filterEmpty(data.projects).map(p => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">
                                    ${this.s(p.title)} 
                                    ${p.link ? `<a href="${this.s(p.link)}" target="_blank" style="font-size:0.85em;"><i data-lucide="external-link" style="width:12px; height:12px; margin-left:4px;"></i></a>` : ''}
                                </span>
                                <span class="cv-item-date">${this.s(p.start)} - ${this.s(p.end)}</span>
                            </div>
                            ${p.role ? `<div class="cv-item-meta"><span class="cv-item-subtitle">${this.s(p.role)}</span></div>` : ''}
                            <div class="cv-item-details">${this.formatBullets(p.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Skills
        if (data.skills && data.skills.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Skills</div>
                    <div class="cv-skills-grid" style="justify-content: center;">
                        ${this.filterEmpty(data.skills).map(s => `<span class="cv-skill-badge">${this.s(s.name)}${s.level ? ` (${this.s(s.level)})` : ''}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Languages & Interests (Side by Side in Classic if both exist, otherwise normal)
        const hasLanguages = data.languages && data.languages.length > 0;
        const hasInterests = data.interests && data.interests.length > 0;
        
        if (hasLanguages || hasInterests) {
            html += `<div class="cv-grid-2col">`;
            
            if (hasLanguages) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Languages</div>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            ${this.filterEmpty(data.languages).map(l => `
                                <div class="cv-lang-item">
                                    <span class="lang-name">${this.s(l.name)}</span>
                                    <span class="lang-level">${l.level || ''}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }

            if (hasInterests) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Interests</div>
                        <div class="cv-skills-grid">
                            ${this.filterEmpty(data.interests).map(i => `<span class="cv-skill-badge">${i.name}</span>`).join('')}
                        </div>
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }
            
            html += `</div>`;
        }

        // Certificates & Achievements (2-col grid)
        const hasCertificates = data.certificates && data.certificates.length > 0;
        const hasAchievements = data.achievements && data.achievements.length > 0;
        
        if (hasCertificates || hasAchievements) {
            html += `<div class="cv-grid-2col">`;
            
            if (hasCertificates) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Certifications</div>
                        ${this.filterEmpty(data.certificates).map(c => `
                            <div class="cv-item" style="font-size:0.9em;">
                                <div style="font-weight:600; color:#0f172a">${this.s(c.name)}</div>
                                <div style="color:#64748b; font-size:0.9em">${this.s(c.issuer)} ${c.date ? `| ${this.s(c.date)}` : ''}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }

            if (hasAchievements) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Achievements</div>
                        ${this.filterEmpty(data.achievements).map(a => `
                            <div class="cv-item" style="font-size:0.9em;">
                                <div style="font-weight:600; color:#0f172a">${this.s(a.title)}</div>
                                <div style="color:#64748b; font-size:0.9em">${a.date || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }
            
            html += `</div>`;
        }

        // Volunteer Experience
        if (data.volunteer && data.volunteer.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Volunteer Work</div>
                    ${this.filterEmpty(data.volunteer).map(v => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(v.role)}</span>
                                <span class="cv-item-date">${this.s(v.start)} - ${this.s(v.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(v.organization)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(v.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // References
        if (data.references && data.references.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">References</div>
                    <div class="cv-grid-2col">
                        ${this.filterEmpty(data.references).map(r => `
                            <div class="cv-item" style="text-align: center;">
                                <div class="cv-item-title">${this.s(r.name)}</div>
                                <div class="cv-item-subtitle">${this.s(r.position)}, ${this.s(r.company)}</div>
                                <div style="font-size:0.85em; color:#64748b;">${this.s(r.contact)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    },

    /**
     * Professional Template (Top border accent band + two columns below)
     */
    professional(data, config) {
        const hasPhoto = data.personal.photo && config.showPhoto;
        
        let headerHtml = `
            <div class="cv-top-band"></div>
            <div class="cv-header-container">
                <div class="cv-header-left">
                    <div class="cv-name">${data.personal.name || 'Your Name'}</div>
                    <div class="cv-title">${data.personal.title || 'Professional Title'}</div>
                </div>
                ${hasPhoto ? `
                    <div>
                        <img src="${this.safePhoto(data.personal.photo)}" class="cv-photo" style="width: 80px; height: 80px; border-radius: var(--radius-sm);" alt="${this.s(data.personal.name)}">
                    </div>
                ` : ''}
            </div>
        `;

        // Main Column Content (65%): Summary, Experience, Education, Projects, Volunteer
        let mainColHtml = '';
        if (data.summary) {
            mainColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Executive Summary</div>
                    <div class="cv-item-details">${this.s(data.summary)}</div>
                </div>
            `;
        }

        if (data.experience && data.experience.length > 0) {
            mainColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Professional Experience</div>
                    ${this.filterEmpty(data.experience).map(exp => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(exp.role)}</span>
                                <span class="cv-item-date">${this.s(exp.start)} - ${this.s(exp.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(exp.company)}</span>
                                <span>${this.s(exp.location)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(exp.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.education && data.education.length > 0) {
            mainColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Education</div>
                    ${this.filterEmpty(data.education).map(edu => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(edu.degree)}</span>
                                <span class="cv-item-date">${this.s(edu.start)} - ${this.s(edu.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(edu.school)}</span>
                                <span>${this.s(edu.location)}</span>
                            </div>
                            ${edu.details ? `<div class="cv-item-details">${this.formatBullets(edu.details)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.projects && data.projects.length > 0) {
            mainColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Key Projects</div>
                    ${this.filterEmpty(data.projects).map(p => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">
                                    ${this.s(p.title)} 
                                    ${p.link ? `<a href="${this.s(p.link)}" target="_blank" style="font-size:0.85em; color:var(--accent-color); margin-left:6px;"><i data-lucide="external-link" style="width:12px; height:12px;"></i></a>` : ''}
                                </span>
                                <span class="cv-item-date">${this.s(p.start)} - ${this.s(p.end)}</span>
                            </div>
                            ${p.role ? `<div class="cv-item-meta"><span class="cv-item-subtitle">${this.s(p.role)}</span></div>` : ''}
                            <div class="cv-item-details">${this.formatBullets(p.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.volunteer && data.volunteer.length > 0) {
            mainColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Volunteer Experience</div>
                    ${this.filterEmpty(data.volunteer).map(v => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(v.role)}</span>
                                <span class="cv-item-date">${this.s(v.start)} - ${this.s(v.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(v.organization)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(v.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Side Column Content (35%): Contact, Skills, Languages, Certificates, Achievements, References
        let sideColHtml = '';
        
        let contactsHtml = '';
        contactsHtml += this.renderContactItem(data.personal.email, 'mail', 'Email');
        contactsHtml += this.renderContactItem(data.personal.phone, 'phone', 'Phone');
        contactsHtml += this.renderContactItem(data.personal.address, 'map-pin', 'Location');
        contactsHtml += this.renderContactItem(data.personal.linkedin, 'linkedin', 'LinkedIn', true);
        contactsHtml += this.renderContactItem(data.personal.github, 'github', 'GitHub', true);
        contactsHtml += this.renderContactItem(data.personal.portfolio, 'globe', 'Portfolio', true);
        contactsHtml += this.renderContactItem(data.personal.website, 'link', 'Website', true);
        
        if (contactsHtml) {
            sideColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Details</div>
                    ${contactsHtml}
                </div>
            `;
        }

        if (data.skills && data.skills.length > 0) {
            sideColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Skills</div>
                    <div class="cv-skills-grid">
                        ${this.filterEmpty(data.skills).map(s => `<span class="cv-skill-badge">${this.s(s.name)}${s.level ? ` (${this.s(s.level)})` : ''}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        if (data.languages && data.languages.length > 0) {
            sideColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Languages</div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${this.filterEmpty(data.languages).map(l => `
                            <div class="cv-lang-item">
                                <span class="lang-name">${this.s(l.name)}</span>
                                <span class="lang-level">${l.level || ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if (data.certificates && data.certificates.length > 0) {
            sideColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Certifications</div>
                    ${this.filterEmpty(data.certificates).map(c => `
                        <div class="cv-item" style="font-size:0.9em; margin-bottom:8px;">
                            <div style="font-weight:600; color:#0f172a">${this.s(c.name)}</div>
                            <div style="color:#64748b; font-size:0.95em;">${this.s(c.issuer)}</div>
                            ${c.date ? `<div style="color:#94a3b8; font-size:0.85em;">${this.s(c.date)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.achievements && data.achievements.length > 0) {
            sideColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">Awards</div>
                    ${this.filterEmpty(data.achievements).map(a => `
                        <div class="cv-item" style="font-size:0.9em; margin-bottom:8px;">
                            <div style="font-weight:600; color:#0f172a">${this.s(a.title)}</div>
                            <div style="color:#64748b; font-size:0.95em;">${a.date || ''}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (data.references && data.references.length > 0) {
            sideColHtml += `
                <div class="cv-section">
                    <div class="cv-section-title">References</div>
                    ${this.filterEmpty(data.references).map(r => `
                        <div class="cv-item" style="font-size:0.9em; margin-bottom:10px;">
                            <div style="font-weight:600; color:#0f172a">${this.s(r.name)}</div>
                            <div style="color:#475569; font-size:0.85em;">${this.s(r.position)}, ${this.s(r.company)}</div>
                            <div style="color:#64748b; font-size:0.8em; margin-top:2px;">${this.s(r.contact)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        return `
            ${headerHtml}
            <div class="cv-body-cols">
                <div class="cv-main-col">${mainColHtml}</div>
                <div class="cv-side-col">${sideColHtml}</div>
            </div>
        `;
    },

    /**
     * Minimal Template (Clean, single-column space-saving layout)
     */
    minimal(data, config) {
        const hasPhoto = data.personal.photo && config.showPhoto;
        let html = '';

        // Header (Flex box containing details left and contact right)
        html += `
            <div class="cv-header">
                <div class="cv-header-left">
                    ${hasPhoto ? `<img src="${this.safePhoto(data.personal.photo)}" class="cv-photo" style="width:70px; height:70px; margin-bottom:10px; border-radius:4px;" alt="${this.s(data.personal.name)}">` : ''}
                    <div class="cv-name">${data.personal.name || 'Your Name'}</div>
                    <div class="cv-title">${data.personal.title || 'Professional Title'}</div>
                </div>
                <div class="cv-contact-container">
        `;
        
        if (data.personal.email) html += this.renderContactItem(data.personal.email, 'mail', 'Email');
        if (data.personal.phone) html += this.renderContactItem(data.personal.phone, 'phone', 'Phone');
        if (data.personal.address) html += this.renderContactItem(data.personal.address, 'map-pin', 'Location');
        if (data.personal.linkedin) html += this.renderContactItem(data.personal.linkedin, 'linkedin', 'LinkedIn', true);
        if (data.personal.github) html += this.renderContactItem(data.personal.github, 'github', 'GitHub', true);
        if (data.personal.portfolio) html += this.renderContactItem(data.personal.portfolio, 'globe', 'Portfolio', true);
        if (data.personal.website) html += this.renderContactItem(data.personal.website, 'link', 'Website', true);
        
        html += `
                </div>
            </div>
        `;

        // Summary
        if (data.summary) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Summary</div>
                    <div class="cv-item-details" style="margin-top:6px;">${this.s(data.summary)}</div>
                </div>
            `;
        }

        // Experience
        if (data.experience && data.experience.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Experience</div>
                    ${this.filterEmpty(data.experience).map(exp => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(exp.role)}</span>
                                <span class="cv-item-date">${this.s(exp.start)} - ${this.s(exp.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(exp.company)} | ${this.s(exp.location)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(exp.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Education
        if (data.education && data.education.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Education</div>
                    ${this.filterEmpty(data.education).map(edu => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(edu.degree)}</span>
                                <span class="cv-item-date">${this.s(edu.start)} - ${this.s(edu.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(edu.school)} | ${this.s(edu.location)}</span>
                            </div>
                            ${edu.details ? `<div class="cv-item-details">${this.formatBullets(edu.details)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Projects
        if (data.projects && data.projects.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Projects</div>
                    ${this.filterEmpty(data.projects).map(p => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">
                                    ${this.s(p.title)} 
                                    ${p.link ? `<a href="${this.s(p.link)}" target="_blank" style="font-size:0.85em; color:var(--accent-color); margin-left:4px;"><i data-lucide="external-link" style="width:10px; height:10px; display:inline-block;"></i></a>` : ''}
                                </span>
                                <span class="cv-item-date">${this.s(p.start)} - ${this.s(p.end)}</span>
                            </div>
                            ${p.role ? `<div class="cv-item-meta"><span class="cv-item-subtitle">${this.s(p.role)}</span></div>` : ''}
                            <div class="cv-item-details">${this.formatBullets(p.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Skills
        if (data.skills && data.skills.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Skills</div>
                    <div class="cv-skills-grid" style="margin-top:6px;">
                        ${this.filterEmpty(data.skills).map(s => `<span class="cv-skill-badge" style="background:#f1f5f9; color:#1e293b;">${this.s(s.name)}${s.level ? ` (${this.s(s.level)})` : ''}</span>`).join('')}
                    </div>
                </div>
            `;
        }

        // Languages, Certs, Achievements in columns to save space in Minimal
        const hasLanguages = data.languages && data.languages.length > 0;
        const hasCertificates = data.certificates && data.certificates.length > 0;
        const hasAchievements = data.achievements && data.achievements.length > 0;
        
        if (hasLanguages || hasCertificates || hasAchievements) {
            html += `<div class="cv-grid-3col">`;
            
            if (hasLanguages) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Languages</div>
                        <div style="display: flex; flex-direction: column; gap: 2px; margin-top:6px;">
                            ${this.filterEmpty(data.languages).map(l => `
                                <div style="font-size:0.85em;">
                                    <strong>${this.s(l.name)}</strong>${l.level ? `: <span style="color:#64748b">${this.s(l.level)}</span>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }

            if (hasCertificates) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Certifications</div>
                        <div style="display: flex; flex-direction: column; gap: 4px; margin-top:6px;">
                            ${this.filterEmpty(data.certificates).map(c => `
                                <div style="font-size:0.8em; line-height:1.2;">
                                    <strong>${this.s(c.name)}</strong> <span style="color:#64748b; font-size:0.95em;">(${this.s(c.issuer)})</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }

            if (hasAchievements) {
                html += `
                    <div class="cv-section">
                        <div class="cv-section-title">Awards</div>
                        <div style="display: flex; flex-direction: column; gap: 4px; margin-top:6px;">
                            ${this.filterEmpty(data.achievements).map(a => `
                                <div style="font-size:0.8em; line-height:1.2;">
                                    <strong>${this.s(a.title)}</strong>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                html += `<div></div>`;
            }

            html += `</div>`;
        }

        // Volunteer Experience
        if (data.volunteer && data.volunteer.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">Volunteering</div>
                    ${this.filterEmpty(data.volunteer).map(v => `
                        <div class="cv-item">
                            <div class="cv-item-header">
                                <span class="cv-item-title">${this.s(v.role)}</span>
                                <span class="cv-item-date">${this.s(v.start)} - ${this.s(v.end)}</span>
                            </div>
                            <div class="cv-item-meta">
                                <span class="cv-item-subtitle">${this.s(v.organization)}</span>
                            </div>
                            <div class="cv-item-details">${this.formatBullets(v.details)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // References
        if (data.references && data.references.length > 0) {
            html += `
                <div class="cv-section">
                    <div class="cv-section-title">References</div>
                    <div class="cv-grid-2col">
                        ${this.filterEmpty(data.references).map(r => `
                            <div class="cv-item">
                                <span style="font-weight:600; color:#0f172a">${this.s(r.name)}</span>
                                <span style="font-size:0.85em; color:#475569;"> - ${this.s(r.position)}, ${this.s(r.company)} (${this.s(r.contact)})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        return html;
    },

    /**
     * Render entire resume body string
     * @param {Object} data Resume structure
     * @param {string} template Template type
     * @param {Object} config Theme settings
     */
    render(data, template, config) {
        if (!this[template]) {
            console.error(`Template ${template} not found. Reverting to Modern.`);
            template = 'modern';
        }
        return this[template](data, config);
    }
};
