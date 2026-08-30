# Authentication Flow Update

- [x] Add an explicit sign-out action that returns the user to the role-selection screen.
- [x] Separate role switching from session exit in the account menu.
- [x] Show the selected role and prototype-session status clearly after sign-in.
- [x] Validate sign-in, switching, and sign-out behavior on desktop and mobile.

# Project Dossier and Account Experience Update

- [x] Expand the project dossier with overview, cost, schedule, risk-factor, evidence, and history tabs.
- [x] Add project KPIs, financial forecast, schedule analysis, risk history, early warning, and recommended review sections.
- [x] Add sign-in loading feedback and clear failure messaging.
- [x] Build a validated Forgot Password email-recovery flow.
- [x] Extend the user profile menu with name, email, active role, role switching, and sign-out.
- [x] Validate the upgraded dossier and account flows on desktop and mobile.

# Project Report, Discovery, Language, and Theme Update

- [x] Add a print-optimised Export to PDF action to the Project Dossier.
- [x] Add searchable and filterable Evidence and History registers.
- [x] Add a plain-language explanation for the AI Risk Summary and contributing factors.
- [x] Add English and Hindi interface language switching.
- [x] Add a persistent light and dark theme control.
- [x] Validate all new controls and responsive presentation.

# Complete Hindi Localization Update

- [x] Centralize English and Hindi copy for shared UI labels and common actions.
- [x] Translate dashboard, project explorer, early warning, analytics, risk, and settings screens.
- [x] Translate every Project Dossier tab, data label, explanation, and report-export label.
- [x] Translate AI assistant prompts, responses, and supporting guidance.
- [x] Validate content legibility and language switching across desktop and mobile views.

# Government Enterprise Dark Mode Refinement

- [x] Replace the existing dark palette with the specified grayscale enterprise surfaces and restrained blue actions.
- [x] Rework navigation, cards, forms, tables, and buttons for low-shadow institutional density.
- [x] Align charts, risk indicators, dossier, warnings, and assistant panels to the specified semantic colors.
- [x] Verify desktop and mobile contrast, spacing, and long-session readability in dark mode.

# Typography-Only Refinement

- [x] Replace the current global typography tokens with generic sans-serif primary text and selectively loaded Roboto secondary text.
- [x] Apply Roboto only to supporting descriptions, metadata, chart labels, table metadata, placeholders, tooltips, and helper copy.
- [x] Preserve all layouts, colors, dimensions, interactions, and responsive behavior while improving type hierarchy.
- [x] Validate font loading, heading contrast, and mobile readability in both light and dark themes.

# Readability and Accessibility Refinement

- [x] Improve Hindi line height and letter spacing across dashboard cards and supporting text.
- [x] Add a subtle, motion-safe fade transition for language changes.
- [x] Add a persistent text-size toggle to Settings for detailed report reading.
- [x] Measure representative text and surface combinations against WCAG 2.1 contrast ratios.
- [x] Verify the new accessibility controls and document contrast findings.

# Locked-Scope Targeted Bug Fixes

- [x] Correct only dark-mode text and data visibility issues that remain below the required hierarchy.
- [x] Require confirmation and frontend demonstration verification before a requested workspace role becomes active.
- [x] Separate AI Executive Brief text from its visual treatment only where readability is impaired.
- [x] Validate the three fixes on desktop and mobile without altering locked UI behavior elsewhere.
