/* export.js - PDF Export, Print, and JSON Import/Export Utilities */

const ExportSystem = {
    /**
     * Downloads the current resume state as a formatted JSON draft
     * @param {Object} data Current resume data object
     */
    exportJSON(data) {
        try {
            const dataStr = JSON.stringify(data, null, 4);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const name = data.personal.name ? data.personal.name.trim().replace(/\s+/g, '_') : 'ResumeForge';
            const filename = `${name}_draft.json`;
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('JSON Draft Downloaded!');
        } catch (e) {
            console.error('Error exporting JSON', e);
            alert('Failed to export JSON file.');
        }
    },

    /**
     * Opens a file picker, parses JSON, and passes details back
     * @param {File} file Uploaded file
     * @param {Function} callback Callback with parsed data
     */
    importJSON(file, callback) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                // Basic validation check
                if (parsed && (parsed.personal || parsed.experience || parsed.education)) {
                    callback(parsed);
                } else {
                    alert('Invalid file format. Please upload a valid ResumeForge JSON draft.');
                }
            } catch (err) {
                console.error('Error parsing imported file', err);
                alert('Could not parse the JSON file. Ensure it is formatted correctly.');
            }
        };
        reader.readAsText(file);
    },

    /**
     * Launches standard browser print dialog
     */
    printResume() {
        window.print();
    },

    /**
     * Generates and downloads A4 PDF using html2canvas and jsPDF
     * @param {string} resumeName User's full name to title file
     */
    exportPDF(resumeName) {
        const docEl = document.getElementById('resume-document');
        const wrapperEl = document.getElementById('a4-page-wrapper');
        
        if (!docEl || !wrapperEl) return;
        
        // Show PDF Loading Overlay
        const loader = document.getElementById('modal-pdf-loading');
        const loaderTitle = document.getElementById('pdf-loading-title');
        const loaderSubtitle = document.getElementById('pdf-loading-subtitle');
        
        if (loader) {
            loader.classList.remove('hidden');
            if (loaderTitle) loaderTitle.innerText = 'Preparing Resume...';
            if (loaderSubtitle) loaderSubtitle.innerText = 'Analyzing page size configurations and spacing.';
        }
        
        this.showToast('Generating PDF... Please wait.', 'info');
        
        // Save current scaling configs to restore later
        const originalTransform = docEl.style.transform;
        const originalMarginBottom = docEl.style.marginBottom;
        const originalWrapperWidth = wrapperEl.style.width;
        const originalWrapperHeight = wrapperEl.style.height;

        // Reset scaling to 1.0 (actual sizes) for high fidelity capturing
        docEl.style.transform = 'none';
        docEl.style.marginBottom = '0';
        
        // Check dynamic page size choice (A4 vs Letter)
        const isLetter = (typeof configData !== 'undefined' && configData.pageSize === 'letter');
        const widthPx = isLetter ? 816 : 794;
        const heightPx = isLetter ? 1056 : 1123;
        const widthMm = isLetter ? 215.9 : 210;
        const heightMm = isLetter ? 279.4 : 297;
        const pdfFormat = isLetter ? 'letter' : 'a4';
        
        wrapperEl.style.width = `${widthPx}px`;
        wrapperEl.style.height = 'auto'; // allow it to stretch naturally
        
        // Re-run pagination on docEl to guarantee exact spacer heights for export dimensions
        if (window.PreviewSystem && typeof PreviewSystem.paginateResume === 'function') {
            PreviewSystem.paginateResume(docEl, typeof configData !== 'undefined' ? configData : {});
        }
        
        // Hide temporary page break indicators from printing
        const indicators = docEl.querySelectorAll('.page-break-indicator');
        indicators.forEach(i => i.style.display = 'none');

        // Update loader text
        if (loaderTitle) loaderTitle.innerText = 'Exporting...';
        if (loaderSubtitle) loaderSubtitle.innerText = 'Rendering canvas frames at high density.';

        // Capture document via html2canvas at scale 2.0x for crisp print density
        html2canvas(docEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false
        }).then(canvas => {
            // Restore scaling configurations in the UI
            docEl.style.transform = originalTransform;
            docEl.style.marginBottom = originalMarginBottom;
            wrapperEl.style.width = originalWrapperWidth;
            wrapperEl.style.height = originalWrapperHeight;
            indicators.forEach(i => i.style.display = 'block');

            // Re-run pagination with current configData to sync the preview
            if (window.PreviewSystem && typeof PreviewSystem.paginateResume === 'function') {
                PreviewSystem.paginateResume(docEl, typeof configData !== 'undefined' ? configData : {});
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: pdfFormat
            });
            
            const canvasWidthPx = canvas.width;
            const canvasHeightPx = canvas.height;
            
            // Calculate scale ratio between canvas pixels and page mm
            const pxScale = canvasWidthPx / widthMm;
            const pageHeightPx = heightMm * pxScale;
            const totalPages = Math.ceil(canvasHeightPx / pageHeightPx);

            for (let i = 0; i < totalPages; i++) {
                if (i > 0) {
                    pdf.addPage();
                }

                // Slice canvas for this specific page
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvasWidthPx;
                const sliceHeight = Math.min(pageHeightPx, canvasHeightPx - (i * pageHeightPx));
                pageCanvas.height = sliceHeight;

                const pageCtx = pageCanvas.getContext('2d');
                pageCtx.drawImage(
                    canvas,
                    0, i * pageHeightPx, canvasWidthPx, sliceHeight, // source rect
                    0, 0, canvasWidthPx, sliceHeight // destination rect
                );

                const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
                const pageHeightMmCalculated = sliceHeight / pxScale;
                
                // Add page slice into PDF page starting at 0,0 top-left
                pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, pageHeightMmCalculated);
            }

            const cleanName = resumeName ? resumeName.trim().replace(/\s+/g, '_') : 'ResumeForge';
            pdf.save(`${cleanName}_Resume.pdf`);
            
            if (loaderTitle) loaderTitle.innerText = 'Download Complete!';
            if (loaderSubtitle) loaderSubtitle.innerText = 'Your PDF has been saved successfully.';
            
            this.showToast('PDF Exported Successfully!');
            
            // Wait 1.5 seconds and hide loader overlay
            setTimeout(() => {
                if (loader) loader.classList.add('hidden');
            }, 1200);
        }).catch(err => {
            console.error('Error during canvas rendering', err);
            // Restore scaling configurations even on error
            docEl.style.transform = originalTransform;
            docEl.style.marginBottom = originalMarginBottom;
            wrapperEl.style.width = originalWrapperWidth;
            wrapperEl.style.height = originalWrapperHeight;
            indicators.forEach(i => i.style.display = 'block');

            // Re-run pagination with current configData to sync the preview
            if (window.PreviewSystem && typeof PreviewSystem.paginateResume === 'function') {
                PreviewSystem.paginateResume(docEl, typeof configData !== 'undefined' ? configData : {});
            }
            
            if (loader) loader.classList.add('hidden');
            this.showToast('An error occurred during PDF generation.', 'error');
        });
    },

    /**
     * UI helper to display toast notifications
     */
    showToast(message, type = 'success') {
        const toast = document.getElementById('app-toast');
        if (!toast) return;
        
        toast.className = 'toast-notification';
        if (type === 'info') {
            toast.style.borderLeftColor = 'var(--primary)';
            const icon = toast.querySelector('.toast-icon');
            if (icon) icon.setAttribute('data-lucide', 'info');
        } else {
            toast.style.borderLeftColor = 'var(--success)';
            const icon = toast.querySelector('.toast-icon');
            if (icon) icon.setAttribute('data-lucide', 'check-circle');
        }
        
        if (window.lucide) window.lucide.createIcons();
        
        toast.querySelector('.toast-message').innerText = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
};
