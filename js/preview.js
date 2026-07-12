/* preview.js - A4 Preview Scaling, Customization, & Page Breaks */

let zoomMode = 'fit'; // 'fit' or 'custom'
let customZoom = 1.0;

const PreviewSystem = {
    /**
     * Re-renders the resume preview and applies current customization configs
     * @param {Object} data Resume input values
     * @param {Object} config UI and page configurations
     */
    updatePreview(data, config) {
        const previewDoc = document.getElementById('resume-document');
        if (!previewDoc) return;

        // 1. Reset and apply layout template class
        previewDoc.className = `a4-document template-${config.template}`;
        
        // 2. Apply Custom Typography Combination
        previewDoc.classList.add(config.font);
        
        // 3. Apply Base Font Size scaling
        previewDoc.classList.add(config.fontSize);

        // Apply Page Size layout class
        previewDoc.classList.add(`page-size-${config.pageSize || 'a4'}`);

        // Apply Line Height class
        previewDoc.classList.add(config.lineHeight || 'line-height-comfortable');

        // 4. Apply custom colors, spacing & margins via CSS Custom Properties
        previewDoc.style.setProperty('--accent-color', config.color);
        
        // Calculate a matching translucent light color for badges
        const r = parseInt(config.color.slice(1, 3), 16);
        const g = parseInt(config.color.slice(3, 5), 16);
        const b = parseInt(config.color.slice(5, 7), 16);
        previewDoc.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.08)`);
        
        previewDoc.style.setProperty('--section-margin', `${config.spacing}px`);
        previewDoc.style.setProperty('--theme-page-margin-val', `${config.margins}mm`);

        // 5. Render HTML content through template engine
        previewDoc.innerHTML = TemplateSystem.render(data, config.template, config);

        // 6. Instantly render SVG icons
        if (window.lucide) {
            window.lucide.createIcons({
                attrs: {
                    class: 'lucide-icon'
                }
            });
        }

        // 6.5. Apply Section-Aware Pagination
        this.paginateResume(previewDoc, config);

        // 7. Recalculate layout scale and page boundaries
        this.updatePageCountAndBreaks();
        this.scalePreview();
    },

    /**
     * Scales the A4 document to fit within the viewport panel
     */
    scalePreview() {
        const viewport = document.querySelector('.preview-container-viewport');
        const doc = document.getElementById('resume-document');
        const wrapper = document.getElementById('a4-page-wrapper');
        
        if (!viewport || !doc || !wrapper) return;

        const padding = 32; // padding inside viewport
        const viewportWidth = viewport.clientWidth - (padding * 2);
        
        // Check dynamic page sizes
        const firstPage = doc.querySelector('.cv-page');
        const isLetter = firstPage ? firstPage.classList.contains('page-size-letter') : false;
        const a4Width = isLetter ? 816 : 794;
        const a4PageHeight = isLetter ? 1056 : 1123;

        let scale = customZoom;

        if (zoomMode === 'fit') {
            scale = viewportWidth / a4Width;
            // Cap scale at 1.0 to prevent pixelation on ultra-wide screens
            if (scale > 1.2) scale = 1.2;
            customZoom = scale; // Sync custom value
        }

        // Apply scale transform
        doc.style.transform = `scale(${scale})`;
        
        // Update wrapper size to prevent layout flow bugs from scale transformations
        wrapper.style.width = `${a4Width * scale}px`;
        
        const docHeight = doc.scrollHeight;
        wrapper.style.height = `${docHeight * scale}px`;

        // Update zoom percentage text
        const zoomText = document.getElementById('zoom-text');
        if (zoomText) {
            zoomText.innerText = `${Math.round(scale * 100)}%`;
        }
    },

    /**
     * Escape HTML helper
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
     * Scans preview document, counts page elements, and updates indicator
     */
    updatePageCountAndBreaks() {
        const doc = document.getElementById('resume-document');
        const pageCountLabel = document.getElementById('lbl-page-count');
        
        if (!doc) return;

        const pages = doc.querySelectorAll('.cv-page');
        const pageCount = Math.max(1, pages.length);

        if (pageCountLabel) {
            pageCountLabel.innerText = `${pageCount} Page${pageCount > 1 ? 's' : ''}`;
        }
    },

    /**
     * Layout-aware section and item pagination by DOM splitting
     * @param {HTMLElement} doc The resume document element
     * @param {Object} config The styling/page configurations
     */
    paginateResume(doc, config) {
        if (!doc) return;
        
        // Remove styling override class before pagination measurement
        doc.classList.remove('preview-paginated');
        
        // Save current transform to restore later
        const originalTransform = doc.style.transform;
        doc.style.transform = 'none';
        
        const template = config.template || 'modern';
        const isLetter = config.pageSize === 'letter';
        const pageHeight = isLetter ? 1056 : 1123;
        
        const marginMm = parseFloat(config.margins || 20);
        const marginPx = Math.round(marginMm * 3.779527559);
        const topMargin = marginPx;
        const bottomMargin = marginPx;
        const usableHeight = pageHeight - topMargin - bottomMargin;
        
        let sidebarPages = null;
        let mainPages = null;
        
        if (template === 'modern') {
            const sidebar = doc.querySelector('.cv-sidebar');
            const main = doc.querySelector('.cv-main');
            sidebarPages = this.partitionContainer(doc, sidebar, pageHeight, topMargin, bottomMargin, usableHeight);
            mainPages = this.partitionContainer(doc, main, pageHeight, topMargin, bottomMargin, usableHeight);
        } else if (template === 'professional') {
            const topBand = doc.querySelector('.cv-top-band');
            const headerContainer = doc.querySelector('.cv-header-container');
            const headerHeight = (topBand ? topBand.getBoundingClientRect().height : 0) + 
                                 (headerContainer ? headerContainer.getBoundingClientRect().height : 0);
            
            const sideCol = doc.querySelector('.cv-side-col');
            const mainCol = doc.querySelector('.cv-main-col');
            
            sidebarPages = this.partitionContainer(doc, sideCol, pageHeight, topMargin, bottomMargin, usableHeight - headerHeight);
            mainPages = this.partitionContainer(doc, mainCol, pageHeight, topMargin, bottomMargin, usableHeight - headerHeight);
        } else {
            // classic or minimal
            mainPages = this.partitionContainer(doc, doc, pageHeight, topMargin, bottomMargin, usableHeight);
        }
        
        const totalPages = Math.max(
            sidebarPages ? sidebarPages.length : 0, 
            mainPages ? mainPages.length : 0
        );
        
        const pageElements = [];
        
        for (let i = 0; i < totalPages; i++) {
            const pageEl = document.createElement('div');
            pageEl.className = `a4-document cv-page template-${template} ${config.font} ${config.fontSize} page-size-${config.pageSize || 'a4'} ${config.lineHeight || 'line-height-comfortable'}`;
            
            pageEl.style.setProperty('--accent-color', config.color);
            const r = parseInt(config.color.slice(1, 3), 16);
            const g = parseInt(config.color.slice(3, 5), 16);
            const b = parseInt(config.color.slice(5, 7), 16);
            pageEl.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.08)`);
            pageEl.style.setProperty('--section-margin', `${config.spacing}px`);
            pageEl.style.setProperty('--theme-page-margin-val', `${config.margins}mm`);
            
            if (template === 'modern') {
                const sidebarCol = document.createElement('div');
                sidebarCol.className = 'cv-sidebar';
                const mainCol = document.createElement('div');
                mainCol.className = 'cv-main';
                pageEl.appendChild(sidebarCol);
                pageEl.appendChild(mainCol);
                
                if (sidebarPages && sidebarPages[i]) {
                    sidebarPages[i].forEach(item => {
                        this.appendPageItem(sidebarCol, item);
                    });
                }
                if (mainPages && mainPages[i]) {
                    mainPages[i].forEach(item => {
                        this.appendPageItem(mainCol, item);
                    });
                }
            } else if (template === 'professional') {
                const topBand = document.createElement('div');
                topBand.className = 'cv-top-band';
                pageEl.appendChild(topBand);
                
                const headerContainer = doc.querySelector('.cv-header-container');
                if (headerContainer && i === 0) {
                    pageEl.appendChild(headerContainer.cloneNode(true));
                }
                
                const bodyCols = document.createElement('div');
                bodyCols.className = 'cv-body-cols';
                pageEl.appendChild(bodyCols);
                
                const mainCol = document.createElement('div');
                mainCol.className = 'cv-main-col';
                const sideCol = document.createElement('div');
                sideCol.className = 'cv-side-col';
                bodyCols.appendChild(mainCol);
                bodyCols.appendChild(sideCol);
                
                if (mainPages && mainPages[i]) {
                    mainPages[i].forEach(item => {
                        this.appendPageItem(mainCol, item);
                    });
                }
                if (sidebarPages && sidebarPages[i]) {
                    sidebarPages[i].forEach(item => {
                        this.appendPageItem(sideCol, item);
                    });
                }
            } else {
                // classic or minimal
                if (mainPages && mainPages[i]) {
                    mainPages[i].forEach(item => {
                        this.appendPageItem(pageEl, item);
                    });
                }
            }
            
            pageElements.push(pageEl);
        }
        
        // Rebuild preview container
        doc.innerHTML = '';
        pageElements.forEach(el => doc.appendChild(el));
        
        // Apply styling override class after pages are generated
        doc.classList.add('preview-paginated');
        
        // Restore original transform
        doc.style.transform = originalTransform;
    },

    /**
     * Appends an item or split-section structure to a page container
     */
    appendPageItem(container, item) {
        if (item instanceof HTMLElement) {
            container.appendChild(item.cloneNode(true));
        } else if (item && item.isSplitSection) {
            const secEl = document.createElement('div');
            secEl.className = item.sectionClass;
            if (item.titleHtml) {
                secEl.innerHTML = item.titleHtml;
            }
            item.items.forEach(it => secEl.appendChild(it.cloneNode(true)));
            container.appendChild(secEl);
        }
    },

    /**
     * Partitions a container's children flow into discrete pages
     */
    partitionContainer(doc, container, pageHeight, topMargin, bottomMargin, initialRemaining) {
        if (!container) return [];
        const usableHeight = pageHeight - topMargin - bottomMargin;
        
        let pageIndex = 0;
        let remaining = initialRemaining;
        
        const pages = [];
        const getPage = (idx) => {
            while (pages.length <= idx) {
                pages.push([]);
            }
            return pages[idx];
        };
        
        const children = Array.from(container.children);
        
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const h = child.getBoundingClientRect().height;
            if (h <= 0) continue;
            
            // If it's not a section (e.g. photo wrapper or header)
            if (!child.classList.contains('cv-section')) {
                if (h > remaining && remaining < usableHeight) {
                    pageIndex++;
                    remaining = usableHeight - h;
                } else {
                    remaining -= h;
                }
                getPage(pageIndex).push(child.cloneNode(true));
                continue;
            }
            
            const section = child;
            const sectionHeight = section.getBoundingClientRect().height;
            const heading = section.querySelector('.cv-section-title, .cv-section-header');
            const headingText = heading ? heading.innerText.trim() : '';
            
            // Locate dynamic list items inside this section
            const items = Array.from(section.querySelectorAll('.cv-item, .skills-grid, .language-item, .languages-list, .cv-references-grid'));
            
            // If it has no splitable items, treat the entire section as a single block
            if (items.length === 0) {
                if (sectionHeight > remaining && remaining < usableHeight) {
                    pageIndex++;
                    remaining = usableHeight - sectionHeight;
                } else {
                    remaining -= sectionHeight;
                }
                getPage(pageIndex).push(section.cloneNode(true));
                continue;
            }
            
            // Check if the entire section fits on the current page
            if (sectionHeight <= remaining) {
                remaining -= sectionHeight;
                getPage(pageIndex).push(section.cloneNode(true));
                continue;
            }
            
            // Check if it fits on the next page
            if (sectionHeight <= usableHeight && remaining < usableHeight) {
                pageIndex++;
                remaining = usableHeight - sectionHeight;
                getPage(pageIndex).push(section.cloneNode(true));
                continue;
            }
            
            // Otherwise, split the section items across pages!
            const hHeading = heading ? heading.getBoundingClientRect().height : 0;
            const firstItem = items[0];
            const hFirstItem = firstItem ? firstItem.getBoundingClientRect().height : 0;
            
            if ((hHeading + hFirstItem) > remaining && remaining < usableHeight) {
                pageIndex++;
                remaining = usableHeight;
            }
            
            let currentItemsForPage = [];
            let pageTitleHtml = heading ? heading.outerHTML : '';
            
            if (firstItem) {
                currentItemsForPage.push(firstItem.cloneNode(true));
                remaining -= (hHeading + hFirstItem + 6);
            }
            
            for (let itemIdx = 1; itemIdx < items.length; itemIdx++) {
                const item = items[itemIdx];
                const hItem = item.getBoundingClientRect().height;
                
                if (hItem <= remaining) {
                    currentItemsForPage.push(item.cloneNode(true));
                    remaining -= (hItem + 6);
                } else {
                    if (currentItemsForPage.length > 0) {
                        getPage(pageIndex).push({
                            isSplitSection: true,
                            sectionClass: section.className,
                            titleHtml: pageTitleHtml,
                            items: currentItemsForPage
                        });
                    }
                    
                    pageIndex++;
                    remaining = usableHeight - hItem;
                    currentItemsForPage = [item.cloneNode(true)];
                    
                    // Continued title
                    pageTitleHtml = heading ? `<div class="cv-section-title continued-title" style="margin-top: 0 !important;">${this.escapeHtml(headingText)} (Continued)</div>` : '';
                }
            }
            
            if (currentItemsForPage.length > 0) {
                getPage(pageIndex).push({
                    isSplitSection: true,
                    sectionClass: section.className,
                    titleHtml: pageTitleHtml,
                    items: currentItemsForPage
                });
            }
        }
        
        return pages;
    },

    /**
     * Profile Photo Base64 Uploader Reader
     * @param {File} file Uploaded image file
     * @param {Function} callback Callback returns base64 string
     */
    handlePhotoUpload(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    },

    // Zoom Handlers
    zoomIn() {
        zoomMode = 'custom';
        customZoom = Math.min(2.0, customZoom + 0.1);
        this.scalePreview();
    },

    zoomOut() {
        zoomMode = 'custom';
        customZoom = Math.max(0.5, customZoom - 0.1);
        this.scalePreview();
    },

    zoomReset() {
        zoomMode = 'fit';
        this.scalePreview();
    }
};

// Handle window resizing to scale preview accordingly
window.addEventListener('resize', () => {
    if (zoomMode === 'fit') {
        PreviewSystem.scalePreview();
    }
});

// Expose PreviewSystem globally
window.PreviewSystem = PreviewSystem;
