# ResumeForge - Professional Resume Builder Web Application

ResumeForge is a modern, static, client-side web application designed to help job seekers create, customize, evaluate, and export ATS-friendly resumes directly from their web browser. 

Designed with a premium aesthetic and smooth micro-interactions, ResumeForge operates completely locally. It requires no signup, features zero server calls, and guarantees 100% user data privacy by relying solely on HTML5 Local Storage.

## Key Features

1. **Live Split-Screen Preview**: See layout changes, typography adjustments, and content edits immediately as you type.
2. **Professional Templates**: Switch between four custom-designed themes:
   - **Modern**: Asymmetric dual-column design with a distinct left sidebar.
   - **Classic**: Symmetrical, serif-dominated traditional layout for executive profiles.
   - **Professional**: Bold header accent band with clear experience timelines.
   - **Minimal**: Ultra-clean, space-efficient single column layout.
3. **Deep Customization**: Instantly tune accent colors, margins, section spacing, font sizes, font combinations, and toggle profile photo visibility.
4. **Real-time ATS Checklist**: Get feedback on missing contacts, summary length, skills count, and layout suggestions (e.g., photo parser warnings).
5. **Completeness Scorer**: Follow a guided progress bar that fills up as you complete essential section groups.
6. **High-Fidelity PDF Export**: Generate print-ready, unclipped vector A4 PDFs utilizing canvas slicing algorithms.
7. **Browser Print Support**: Features a dedicated stylesheet for standard `Ctrl+P` printing that strips away all control panels.
8. **Draft Portability**: Export your complete state as a JSON file and import it on any device to continue editing.
9. **Dark Mode Support**: Saves theme preferences across browser reloads.

## File Structure

```
ResumeForge/
├── index.html           # Landing page with interactive mockups
├── builder.html         # Live workspace split-screen editor
├── README.md            # Project documentation
├── css/
│   ├── style.css        # Global CSS variables, resets, and home page styling
│   ├── builder.css      # Edit panel forms, inputs, tabs, and layout grids
│   ├── templates.css    # Resume templates specifications and overrides
│   └── print.css        # Print media styling for physical pages and browser PDFs
└── js/
    ├── storage.js       # Local Storage draft saves & default values configurations
    ├── templates.js     # Template engines rendering layout HTML blocks
    ├── preview.js       # Zoom scale, fit-to-width math, and page breaks detector
    ├── export.js        # PDF generation, JSON imports, and toast notifications
    ├── builder.js       # Form input bindings, dynamic lists, and ATS checkers
    └── app.js           # Subsystems bootstrap, modal wiring, and mobile tabs
```

## How It Works: Multi-Page Canvas Slicing

Client-side PDF generators like `html2canvas` + `jsPDF` often crop content at page boundaries or scale layout widths poorly. ResumeForge solves this by doing the following during PDF export:
1. **Unscales Preview**: Temporarily disables the interactive CSS `scale()` transform to capture elements at actual pixel density.
2. **Multi-Page Slicing**: Compares the total height of the generated canvas against the pixel height of a standard A4 page (at 96 DPI, `1123px`).
3. **Canvas Cropping**: Slices the captured image vertically at exact page boundaries, creating individual image canvases for each page and printing them into A4 dimensions with zero scaling anomalies.
4. **Restores Preview**: Restores the scale of the live editor immediately after saving the PDF.

## Local Development & Deployment

Since ResumeForge is a fully static website with zero backend dependencies, it requires no installation.

### Run Locally
To run the project locally, simply open `index.html` directly in any web browser, or serve it using a simple HTTP server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx live-server
```

### GitHub Pages Deployment
1. Push the folder to a public GitHub repository.
2. Go to **Settings** > **Pages** inside your repository.
3. Set the build source to the `main` branch.
4. Access your live application at `https://<username>.github.io/<repository-name>/`.
