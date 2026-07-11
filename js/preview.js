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
        const isLetter = doc.classList.contains('page-size-letter');
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
     * Scans preview document height, determines page count, and renders guidelines
     */
    updatePageCountAndBreaks() {
        const doc = document.getElementById('resume-document');
        const wrapper = document.getElementById('a4-page-wrapper');
        const pageCountLabel = document.getElementById('lbl-page-count');
        
        if (!doc || !wrapper) return;

        // Remove old page break helper indicators
        const oldLines = wrapper.querySelectorAll('.page-break-indicator');
        oldLines.forEach(l => l.remove());

        const docHeight = doc.offsetHeight;
        const isLetter = doc.classList.contains('page-size-letter');
        const pagePixelHeight = isLetter ? 1056 : 1123; // A4 vs Letter height limit
        const pageCount = Math.max(1, Math.ceil(docHeight / pagePixelHeight));

        if (pageCountLabel) {
            pageCountLabel.innerText = `${pageCount} Page${pageCount > 1 ? 's' : ''}`;
        }

        // Render page break guides in editor mode so user can see splitting lines
        for (let i = 1; i < pageCount; i++) {
            const breakLine = document.createElement('div');
            breakLine.className = 'page-break-indicator';
            
            // Absolute position the line relative to wrapper scale
            breakLine.style.position = 'absolute';
            breakLine.style.top = `${i * pagePixelHeight}px`;
            breakLine.style.left = '0';
            breakLine.style.width = '100%';
            breakLine.style.height = '0';
            breakLine.style.borderTop = '2px dashed #f43f5e';
            breakLine.style.zIndex = '50';
            breakLine.style.pointerEvents = 'none';

            // Add text label to break indicator
            const lineLabel = document.createElement('span');
            lineLabel.innerText = `Page ${i} Break`;
            lineLabel.style.position = 'absolute';
            lineLabel.style.right = '10px';
            lineLabel.style.top = '-9px';
            lineLabel.style.fontSize = '10px';
            lineLabel.style.fontWeight = 'bold';
            lineLabel.style.backgroundColor = '#f43f5e';
            lineLabel.style.color = '#ffffff';
            lineLabel.style.padding = '2px 6px';
            lineLabel.style.borderRadius = '3px';
            lineLabel.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

            breakLine.appendChild(lineLabel);
            doc.appendChild(breakLine);
        }
    },

    /**
     * Layout-aware section and item pagination
     * @param {HTMLElement} doc The resume document element
     * @param {Object} config The styling/page configurations
     */
    paginateResume(doc, config) {
        if (!doc) return;
        
        // Save current transform to restore later
        const originalTransform = doc.style.transform;
        doc.style.transform = 'none';
        
        // Get template name
        const template = config.template || 'modern';
        
        // Remove existing spacers
        doc.querySelectorAll('.pdf-page-break-spacer').forEach(el => el.remove());
        
        // Page configurations
        const isLetter = doc.classList.contains('page-size-letter') || config.pageSize === 'letter';
        const pageHeight = isLetter ? 1056 : 1123;
        
        const marginMm = parseFloat(config.margins || 20);
        const marginPx = Math.round(marginMm * 3.779527559);
        const topMargin = marginPx;
        const bottomMargin = marginPx;
        const usablePageHeight = pageHeight - topMargin - bottomMargin;
        
        // Get containers to paginate based on template
        const containers = this.getContainersToPaginate(doc, template);
        
        // Paginate each container
        containers.forEach(container => {
            this.paginateContainer(doc, container, pageHeight, topMargin, bottomMargin, usablePageHeight);
        });
        
        // Restore original transform
        doc.style.transform = originalTransform;
    },

    /**
     * Get separate column containers to paginate independently
     */
    getContainersToPaginate(doc, template) {
        if (template === 'modern') {
            const sidebar = doc.querySelector('.cv-sidebar');
            const main = doc.querySelector('.cv-main');
            return [sidebar, main].filter(Boolean);
        } else if (template === 'professional') {
            const sideCol = doc.querySelector('.cv-side-col');
            const mainCol = doc.querySelector('.cv-main-col');
            return [sideCol, mainCol].filter(Boolean);
        } else {
            return [doc];
        }
    },

    /**
     * Paginate a single container flow of sections and items
     */
    paginateContainer(doc, container, pageHeight, topMargin, bottomMargin, usablePageHeight) {
        const documentRect = doc.getBoundingClientRect();
        
        // Get sections within the container
        const sections = Array.from(container.querySelectorAll('.cv-section')).filter(section => {
            return section.parentElement === container || 
                   section.parentElement.classList.contains('cv-grid-2col') || 
                   section.parentElement.classList.contains('cv-grid-3col') ||
                   section.parentElement.classList.contains('cv-body-cols') ||
                   section.parentElement.parentElement === container;
        });
        
        let pageIndex = 0;
        
        for (let sIndex = 0; sIndex < sections.length; sIndex++) {
            const section = sections[sIndex];
            
            // Measure current section top
            let sectionRect = section.getBoundingClientRect();
            let sectionTop = sectionRect.top - documentRect.top;
            
            // Advance pageIndex to match the page where this section starts
            while (sectionTop >= (pageIndex + 1) * pageHeight) {
                pageIndex++;
            }
            
            let pageTop = pageIndex * pageHeight;
            let pageBottomLimit = pageTop + pageHeight - bottomMargin;
            
            let sectionHeight = sectionRect.height;
            let sectionBottom = sectionTop + sectionHeight;
            
            // 1. Check if the entire section fits on the current page
            if (sectionBottom <= pageBottomLimit) {
                // Section fits completely on this page.
                continue;
            }
            
            // 2. The section does NOT fit on the current page.
            // Can it fit on the next page?
            const fitsOnNextPage = sectionHeight <= usablePageHeight;
            
            if (fitsOnNextPage && sectionTop > (pageTop + topMargin + 5)) {
                // Push the entire section to the next page
                const spacer = document.createElement('div');
                spacer.className = 'pdf-page-break-spacer';
                const nextPageTop = (pageIndex + 1) * pageHeight;
                const spacerHeight = (nextPageTop + topMargin) - sectionTop;
                spacer.style.height = `${spacerHeight}px`;
                
                section.parentNode.insertBefore(spacer, section);
                
                // Advance to the next page
                pageIndex++;
                
                // Re-measure after pushing
                sectionRect = section.getBoundingClientRect();
                sectionTop = sectionRect.top - documentRect.top;
                continue;
            }
            
            // 3. Section too tall for one page or already at the top. Check items inside.
            const heading = section.querySelector('.cv-section-title');
            const items = Array.from(section.querySelectorAll('.cv-item'));
            
            if (items.length > 0) {
                // Check if heading + first item fits together to prevent orphan headings
                if (heading) {
                    const headingRect = heading.getBoundingClientRect();
                    const headingTop = headingRect.top - documentRect.top;
                    
                    while (headingTop >= (pageIndex + 1) * pageHeight) {
                        pageIndex++;
                    }
                    pageTop = pageIndex * pageHeight;
                    pageBottomLimit = pageTop + pageHeight - bottomMargin;
                    
                    const firstItem = items[0];
                    const firstItemRect = firstItem.getBoundingClientRect();
                    const firstItemBottom = firstItemRect.bottom - documentRect.top;
                    
                    if (firstItemBottom > pageBottomLimit && sectionTop > (pageTop + topMargin + 5)) {
                        const spacer = document.createElement('div');
                        spacer.className = 'pdf-page-break-spacer';
                        const nextPageTop = (pageIndex + 1) * pageHeight;
                        const spacerHeight = (nextPageTop + topMargin) - sectionTop;
                        spacer.style.height = `${spacerHeight}px`;
                        
                        section.parentNode.insertBefore(spacer, section);
                        
                        pageIndex++;
                        
                        // Re-measure
                        sectionRect = section.getBoundingClientRect();
                        sectionTop = sectionRect.top - documentRect.top;
                        pageTop = pageIndex * pageHeight;
                        pageBottomLimit = pageTop + pageHeight - bottomMargin;
                    }
                }
                
                // Process each item individually
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    let itemRect = item.getBoundingClientRect();
                    let itemTop = itemRect.top - documentRect.top;
                    let itemBottom = itemRect.bottom - documentRect.top;
                    
                    while (itemTop >= (pageIndex + 1) * pageHeight) {
                        pageIndex++;
                    }
                    pageTop = pageIndex * pageHeight;
                    pageBottomLimit = pageTop + pageHeight - bottomMargin;
                    
                    if (itemBottom > pageBottomLimit && itemTop > (pageTop + topMargin + 5)) {
                        const spacer = document.createElement('div');
                        spacer.className = 'pdf-page-break-spacer';
                        const nextPageTop = (pageIndex + 1) * pageHeight;
                        const spacerHeight = (nextPageTop + topMargin) - itemTop;
                        spacer.style.height = `${spacerHeight}px`;
                        
                        item.parentNode.insertBefore(spacer, item);
                        
                        pageIndex++;
                        
                        // Re-measure
                        itemRect = item.getBoundingClientRect();
                        itemTop = itemRect.top - documentRect.top;
                        itemBottom = itemRect.bottom - documentRect.top;
                    }
                }
            }
        }
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
