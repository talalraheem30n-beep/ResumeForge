/* export.js - PDF Export, Print, and JSON Import/Export Utilities */

const ExportSystem = {
    /**
     * Downloads the current resume state as a formatted JSON draft
     * @param {Object} data Current resume data object
     */
    exportJSON(resume, config) {
        try {
            const payload = {
                version: "2.0",
                resumeData: resume,
                configData: config
            };
            const dataStr = JSON.stringify(payload, null, 4);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const name = resume.personal.name ? resume.personal.name.trim().replace(/\s+/g, '_') : 'ResumeForge';
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
    async exportPDF(resumeName) {
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
        const originalWrapperWidth = wrapperEl.style.width;
        const originalWrapperHeight = wrapperEl.style.height;

        // Reset scaling to 1.0 (actual sizes) for high fidelity capturing
        docEl.style.transform = 'none';
        
        // Check dynamic page size choice (A4 vs Letter)
        const isLetter = (typeof configData !== 'undefined' && configData.pageSize === 'letter');
        const widthPx = isLetter ? 816 : 794;
        const heightPx = isLetter ? 1056 : 1123;
        const widthMm = isLetter ? 215.9 : 210;
        const heightMm = isLetter ? 279.4 : 297;
        const pdfFormat = isLetter ? 'letter' : 'a4';
        
        wrapperEl.style.width = `${widthPx}px`;
        wrapperEl.style.height = 'auto'; // allow it to stretch naturally
        
        // Re-run pagination on docEl to guarantee exact partition
        if (window.PreviewSystem && typeof PreviewSystem.paginateResume === 'function') {
            PreviewSystem.paginateResume(docEl, typeof configData !== 'undefined' ? configData : {});
        }
        
        // Update loader text
        if (loaderTitle) loaderTitle.innerText = 'Exporting...';
        if (loaderSubtitle) loaderSubtitle.innerText = 'Rendering canvas frames at high density.';

        const pageElements = Array.from(docEl.querySelectorAll('.cv-page'));
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: pdfFormat
        });

        try {
            for (let i = 0; i < pageElements.length; i++) {
                const pageEl = pageElements[i];
                if (i > 0) {
                    pdf.addPage();
                }
                const canvas = await html2canvas(pageEl, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: false
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
            }

            const cleanName = resumeName ? resumeName.trim().replace(/\s+/g, '_') : 'ResumeForge';
            pdf.save(`${cleanName}_Resume.pdf`);
            
            if (loaderTitle) loaderTitle.innerText = 'Download Complete!';
            if (loaderSubtitle) loaderSubtitle.innerText = 'Your PDF has been saved successfully.';
            
            this.showToast('PDF Exported Successfully!');
        } catch (err) {
            console.error('Error during canvas rendering', err);
            this.showToast('Error generating PDF.', 'error');
        } finally {
            // Restore scaling configurations in the UI
            docEl.style.transform = originalTransform;
            wrapperEl.style.width = originalWrapperWidth;
            wrapperEl.style.height = originalWrapperHeight;

            // Re-run pagination with current configData to sync the preview
            if (window.PreviewSystem && typeof PreviewSystem.paginateResume === 'function') {
                PreviewSystem.paginateResume(docEl, typeof configData !== 'undefined' ? configData : {});
            }

            // Wait 1.2 seconds and hide loader overlay
            setTimeout(() => {
                if (loader) loader.classList.add('hidden');
            }, 1200);
        }
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
