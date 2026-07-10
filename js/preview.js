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
