# ResumeForge

<p align="center">
  <img src="assets/images/logo.png" alt="ResumeForge Logo" width="120" height="120">
</p>

<h3 align="center">ResumeForge</h3>

<p align="center">
  <strong>A Modern ATS-Friendly Resume Builder Built with Vanilla JavaScript</strong>
</p>

<p align="center">
  ResumeForge is a modern, fully client-side resume builder that enables users to create professional ATS-friendly resumes directly in the browser. Edit in real time, switch between multiple templates, customize layouts, export high-quality PDFs, and save your work locally—all with zero tracking and zero server calls.
</p>

<p align="center">
  <a href="https://talalraheem30n-beep.github.io/builder/"><strong>Live Demo »</strong></a>
  ·
  <a href="https://github.com/[username]/[repo]"><strong>GitHub Repository »</strong></a>
  ·
  <a href="https://github.com/[username]/[repo]/issues"><strong>Report Issues »</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages">
  <img src="https://img.shields.io/badge/Responsive-Mobile%20Friendly-blueviolet?style=for-the-badge" alt="Responsive">
  <br>
  <img src="https://img.shields.io/badge/Client--Side-100%25-brightgreen?style=for-the-badge" alt="Client Side">
  <img src="https://img.shields.io/badge/Local%20Storage-HTML5-blue?style=for-the-badge" alt="Local Storage">
  <img src="https://img.shields.io/badge/PDF%20Export-jsPDF%20%26%20html2canvas-ff69b4?style=for-the-badge" alt="PDF Export">
  <img src="https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red?style=for-the-badge" alt="Open Source">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License">
</p>

---

## Demo

Here are demonstrations of ResumeForge in action:

* **Live Editor**:
  ![Resume Builder Demo](assets/gifs/demo.gif)
* **Template Switching**:
  ![Template Switching](assets/gifs/templates.gif)
* **PDF Export**:
  ![PDF Export](assets/gifs/export.gif)

> [!NOTE]
> All GIF demonstrations should be captured and placed inside the `/assets/gifs/` directory. Static screenshots should be saved in the `/assets/images/` directory.

---

## Table of Contents

1. [Features](#features)
2. [Built With](#built-with)
3. [Architecture](#architecture)
4. [Installation](#installation)
5. [Usage](#usage)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Screenshots](#screenshots)
8. [Performance & Privacy](#performance--privacy)
9. [Browser Compatibility](#browser-compatibility)
10. [Accessibility & Responsive Design](#accessibility--responsive-design)
11. [Project Roadmap](#project-roadmap)
12. [Contributing](#contributing)
13. [License](#license)
14. [Developer](#developer)
15. [Acknowledgements](#acknowledgements)

---

## Features

| Feature | Description | Status |
| :--- | :--- | :---: |
| **Live Resume Preview** | Changes to input fields are instantly updated on the simulated paper sheet. | ✓ |
| **Multi-Page Preview** | Generates vertical, centered pages with consistent gaps and page count indicator. | ✓ |
| **Multiple ATS-Friendly Templates** | Switch between Modern, Classic, Professional, and Minimal themes. | ✓ |
| **Intelligent Page Breaks** | Automatically splits sections and items across pages cleanly without text clipping. | ✓ |
| **High-Fidelity PDF Export** | Generates print-ready vector PDFs using client-side canvas slicing. | ✓ |
| **Browser Printing** | Features custom print stylesheets that strip away editor panels. | ✓ |
| **JSON Import / Export** | Import and export drafts as `.json` files to port and back up data. | ✓ |
| **Auto Save** | Saves draft data locally to prevent progress loss on page reload. | ✓ |
| **Undo / Redo** | Full state history undo and redo support for easy corrections. | ✓ |
| **Command Palette** | Access actions and jump sections quickly via `Ctrl + K` palette. | ✓ |
| **ATS Checklist & Scorer** | Evaluates resume completeness and issues content recommendations. | ✓ |
| **Dark Mode Support** | Toggle sleek dark mode interface with saved preference state. | ✓ |
| **Deep Customization** | Edit colors, margins, font sizes, line heights, and typography. | ✓ |
| **Privacy First** | Zero server calls, no databases, and no cloud-side processing. | ✓ |
| **Offline Support** | Runs completely locally without active internet connection. | ✓ |

---

## Built With

ResumeForge is engineered with a modular client-side stack to keep the project completely lightweight and static.

* **HTML5**: Structural semantic pages, forms, and control panels.
* **CSS3**: Layouts, styling resets, templates, CSS custom variables, and media print query configurations.
* **Vanilla JavaScript**: Core controller engine, data model bindings, pagination state math, and history stacks.
* **Local Storage**: Persists drafts locally in the user's browser sandbox.
* **html2canvas (v1.4.1)**: Screen-to-canvas rendering libraries.
* **jsPDF (v2.5.1)**: Vector PDF document generators.
* **GitHub Pages**: Fast, static application hosting.

---

## Architecture

ResumeForge uses a highly decoupled modular architecture, dividing the workspace logic into individual concerns:

```text
ResumeForge/
├── LICENSE              # MIT License configuration
├── README.md            # Repository documentations
├── index.html           # Landing page with interactive presentation
├── builder.html         # Live workspace split-screen editor
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

### Script Directory Breakdown

* **[storage.js](js/storage.js)**: Reads, validates, writes, and backs up resume states. It initializes default dummy values on first startup.
* **[templates.js](js/templates.js)**: Dictates HTML schemas for templates. It parses fields, generates badges, lists columns, and outputs raw structured HTML.
* **[preview.js](js/preview.js)**: Runs pagination calculations. It isolates overflows, splits containers vertically, scales preview sheets via CSS matrices, and calculates zoom levels.
* **[export.js](js/export.js)**: Leverages `html2canvas` to render and slice page nodes. It stitches canvases into a mult-page PDF document and handles file download prompts.
* **[builder.js](js/builder.js)**: Syncs HTML forms to the state. It handles list drag-and-drop actions, triggers completeness updates, and runs the ATS keyword checks.
* **[app.js](js/app.js)**: Main entry point. Instantiates elements, wires up interactive tab toggles, and fires resize handlers.

---

## Installation

Because ResumeForge is a fully static website with zero external build systems, no installation or compilation processes are required.

### 1. Clone the Repository
```bash
git clone https://github.com/[username]/ResumeForge.git
cd ResumeForge
```

### 2. Run Locally
You can open `index.html` directly in your browser. Alternatively, run a local development server for testing:

#### Option A: Node.js (Recommended)
```bash
# Start a live-reloading static server
npx live-server
```

#### Option B: Python HTTP Server
```bash
# Python 3
python -m http.server 8000
```
Then navigate to `http://localhost:8000/builder.html` in your web browser.

#### Option C: VS Code extension
Right-click on `index.html` and select **Open with Live Server**.

---

## Usage

A complete walkthrough of the resume generation flow:

1. **Enter Personal Details**: Begin filling in the inputs in the left panel. You can toggle your profile photo and see the completion score update immediately.
2. **Add Work & Education**: Expand the accordion sections. Click **Add Item** to insert new fields. Drag items using the grab handles to reorder experience.
3. **Optimize Layout**: Go to the **Page Setup** tab to change templates (Modern, Classic, Professional, Minimal), select custom fonts, and choose accent colors.
4. **Tune Spacing**: Move the margin and line-height sliders to fine-tune spacing and align pages.
5. **Review ATS Suggestions**: Navigate to the **ATS Checker** tab to review missing fields, email format flags, and photo warnings.
6. **Save & Port**: Drafts are autosaved. Click **Export JSON** to save a local backup file, or **Import JSON** to load it back in on another machine.
7. **Generate Output**: Click **Download PDF** to trigger high-fidelity client-side rendering, or **Print Resume** (`Ctrl + P`) to open the standard browser print dialog.

---

## Keyboard Shortcuts

The builder supports keyboard shortcuts to accelerate editing flows:

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | **Save Draft** | Manually triggers Local Storage commit. |
| <kbd>Ctrl</kbd> + <kbd>P</kbd> | **Print Preview** | Opens the print dialog. |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Command Palette** | Opens search and quick action overlays. |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | **Undo Action** | Reverts the last form or layout change. |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | **Redo Action** | Re-applies the last undone change. |
| <kbd>Esc</kbd> | **Close Overlays** | Closes command palettes and modals. |

---

## Screenshots

* **Landing Page**:
  ![Landing Page Mockup](assets/images/screenshots/landing.png)
* **Live Builder Workspace**:
  ![Builder Workspace Screenshot](assets/images/screenshots/builder.png)
* **Dark Mode Editor**:
  ![Dark Mode Screenshot](assets/images/screenshots/dark_mode.png)
* **Modern Layout Style**:
  ![Modern Template Screenshot](assets/images/screenshots/template_modern.png)
* **Classic Layout Style**:
  ![Classic Template Screenshot](assets/images/screenshots/template_classic.png)
* **Professional Layout Style**:
  ![Professional Template Screenshot](assets/images/screenshots/template_professional.png)
* **Minimal Layout Style**:
  ![Minimal Template Screenshot](assets/images/screenshots/template_minimal.png)
* **Intelligent ATS Panel**:
  ![ATS Checker Screenshot](assets/images/screenshots/ats_checker.png)
* **Page Settings & Spacing**:
  ![Page Setup Panel Screenshot](assets/images/screenshots/page_setup.png)
* **High Density PDF Preview**:
  ![PDF Export Dialog Screenshot](assets/images/screenshots/pdf_export.png)
* **Mobile Responsive Editor**:
  ![Mobile View Screenshot](assets/images/screenshots/mobile_view.png)

> [!NOTE]
> Update files inside the `/assets/images/screenshots/` folder to display real app captures.

---

## Performance & Privacy

* **100% Offline**: Everything runs inside your browser. Once loaded, the builder requires no network connection.
* **No Database**: ResumeForge has no backend database, no login tokens, and no server endpoints.
* **No Trackers**: Zero telemetry, zero analytics trackers, and zero cookies.
* **Data Ownership**: Your personal data never leaves your system. All resume processing and document generation are completed locally.

---

## Browser Compatibility

| Browser | Compatibility | Features Supported |
| :--- | :--- | :--- |
| **Google Chrome** | Full | Flexbox, grid, PDF rendering, Local Storage, key-shortcuts |
| **Microsoft Edge** | Full | Flexbox, grid, PDF rendering, Local Storage, key-shortcuts |
| **Mozilla Firefox** | Full | Flexbox, grid, PDF rendering, Local Storage, key-shortcuts |
| **Apple Safari** | Full | Flexbox, grid, PDF rendering, Local Storage, key-shortcuts |

---

## Accessibility & Responsive Design

* **Keyboard Navigation**: Accessible focus styling, tab-indices, and keyboard shortcuts throughout the editor UI.
* **Semantic HTML**: Fully uses HTML5 semantic tags (`<nav>`, `<aside>`, `<main>`, `<section>`) for clean screen-reader parsing.
* **Responsive Layouts**: Responsive CSS grids adapt the interface for desktops, laptops, tablets, and smartphones.
* **Mobile Editing Mode**: Floating bar controls switch dynamically between forms and previews on mobile.

---

## Project Roadmap

* [ ] **Cover Letter Builder**: Generate cover letters matching your resume design.
* [ ] **LinkedIn Import**: Auto-populate inputs by parsing LinkedIn profiles.
* [ ] **Drag & Drop Sections**: Reorder custom sections like Projects or Skills.
* [ ] **Resume Analytics**: Parse text density and structure advice.
* [ ] **Multiple Profiles**: Store multiple resume drafts simultaneously.
* [ ] **Resume Version History**: Track and revert changes over time.
* [ ] **Multi-language Support**: Multi-lingual interface translation models.
* [ ] **Additional Templates**: Additional premium single and multi-page layouts.

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository and clone it locally.
2. Create a feature branch: `git checkout -b feature/your-awesome-feature`.
3. Keep code clean, modular, and document JS APIs.
4. Ensure no external frameworks (React, Vue, Tailwind) are introduced. Keep the core stack dependency-free.
5. Open a **Pull Request** detailing your changes.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Developer

**Developed by Talal Raheem**

* **GitHub**: [@talalraheem30n-beep](https://github.com/talalraheem30n-beep)
* **LinkedIn**: [Talal Raheem](https://linkedin.com/in/username)
* **Portfolio**: [talalraheem.dev](https://blog.john-doe.dev)
* **Email**: [talalraheem30n@gmail.com](mailto:talalraheem30n@gmail.com)

---

## Acknowledgements

* Inspired by premium web tools and professional document editors (Google Docs, Microsoft Word).
* Special thanks to developers of `html2canvas` and `jsPDF` for making high-quality browser-based rendering possible.

---

<p align="center">
  <sub>ResumeForge is an open-source portfolio project built to demonstrate modern front-end engineering, client-side architecture, responsive UI design, and browser-based PDF generation.</sub>
</p>
