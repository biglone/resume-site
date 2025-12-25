# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start dev server at http://localhost:4321
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Architecture

This is a configuration-driven static resume site built with Astro + React + TailwindCSS.

### Content System

All content lives in `src/config/resume.yaml` - this is the single source of truth for:
- Profile info (name, bio, avatar, social links)
- Work experience entries
- Project details with optional image galleries and commit history
- Skills with proficiency levels
- Site metadata

The YAML is parsed at build time by `src/pages/index.astro` and passed as props to components. TypeScript interfaces are defined in `src/types/resume.ts`.

### Component Types

**Astro components** (static HTML, no client JS):
- `Layout.astro` - Master template with theme initialization script
- `Header.astro`, `Hero.astro`, `Experience.astro`, `Projects.astro`, `Skills.astro`, `Footer.astro`
- Common: `Badge.astro`, `SocialLinks.astro`, `CommitHistory.astro`

**React components** (interactive, use `client:load`):
- `ThemeToggle.tsx` - Light/dark/auto theme switcher (persists to localStorage)
- `ImageGallery.tsx` - Project image carousel with keyboard navigation

### Page Routing

- `src/pages/index.astro` - Homepage
- `src/pages/projects/[slug].astro` - Dynamic project detail pages using `getStaticPaths()` to generate routes from resume.yaml projects

### Theming

CSS variables in `src/styles/global.css` control colors for light (`:root`) and dark (`.dark`) modes. The theme is applied via a class on `<html>` and detected before paint via inline script in Layout.astro to prevent flash.

### Deployment

Currently configured for Netlify (`netlify.toml`). GitHub Pages workflow exists in `.github/workflows/deploy.yml` (requires uncommenting config in `astro.config.mjs`).

## Key Files

- `src/config/resume.yaml` - Edit this to customize all content
- `src/styles/global.css` - Theme colors via CSS variables
- `astro.config.mjs` - Site URL, base path for deployment
- `src/types/resume.ts` - TypeScript interfaces for resume config
