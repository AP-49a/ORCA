---
name: Orca Design System
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#c6c6cc'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#909096'
  outline-variant: '#45474b'
  surface-tint: '#c1c6d5'
  primary: '#c1c6d5'
  on-primary: '#2b313c'
  primary-container: '#050a14'
  on-primary-container: '#747987'
  inverse-primary: '#595e6b'
  secondary: '#a6e6ff'
  on-secondary: '#003543'
  secondary-container: '#14d1ff'
  on-secondary-container: '#00566b'
  tertiary: '#c4c7c9'
  on-tertiary: '#2d3133'
  tertiary-container: '#070a0c'
  on-tertiary-container: '#767a7b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde2f1'
  primary-fixed-dim: '#c1c6d5'
  on-primary-fixed: '#161c26'
  on-primary-fixed-variant: '#414753'
  secondary-fixed: '#b7eaff'
  secondary-fixed-dim: '#4cd6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#081425'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
typography:
  display-xl:
    fontFamily: Lexend
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.04em
  display-xl-mobile:
    fontFamily: Lexend
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is built for a premium, high-performance desktop browser. The brand personality is efficient, powerful, and serene—echoing the namesake's dominance and speed in the ocean. The target audience includes power users, developers, and productivity enthusiasts who demand performance without visual clutter.

The visual style is **Minimalist-Futuristic**. It rejects the excessive fluff of glassmorphism in favor of "Dark Mode First" high-performance aesthetics. The interface relies on deep, obsidian-like voids and razor-sharp execution. It prioritizes clarity, speed, and trust through structured layouts and purposeful whitespace, evoking the feeling of a precision-engineered tool.

## Colors

The palette is anchored in a high-contrast dark theme to reduce eye strain and emphasize the "Ocean" narrative. 

- **Primary Dark (#050A14):** The deep abyss. Used for primary backgrounds to create a sense of infinite space.
- **Accent Blue (#00D1FF):** The bio-luminescent glow. Used sparingly for calls-to-action, focus states, and performance indicators to signify activity and precision.
- **Off-White (#F8FAFC):** Used for primary headings and prominent UI elements to ensure maximum legibility against the dark void.
- **Neutral Charcoal (#1E293B):** Used for secondary surfaces, borders, and subtle structural elements to provide depth without introducing "muddy" grays.

## Typography

This design system utilizes a dual-type approach to balance character with utility. 

**Lexend** is used for headlines and display text. Its geometric foundations and unique letter widths provide a modern, technical feel that remains highly readable at large scales. Use tight letter-spacing for large display types to create a "locked-in" professional look.

**Inter** is the workhorse for body copy and UI labels. It provides the systematic, neutral clarity required for technical specs and long-form feature descriptions. 

All typography should follow a high-contrast hierarchy; headlines must be significantly more prominent than body text to facilitate quick scanning of performance benefits.

## Layout & Spacing

The layout philosophy follows a **Fixed-Width Fluid Hybrid** model. Content is constrained to a 1280px central container on desktop to maintain readability, but decorative elements (like ocean-inspired background textures) may bleed to the edges.

- **Grid:** A 12-column grid is used for the desktop layout, with wide 24px gutters to emphasize "breathing room."
- **Rhythm:** Vertical spacing is aggressive. Use 120px gaps between major sections to prevent the UI from feeling "cramped," reinforcing the "Less Memory/More Space" brand promise.
- **Mobile Adaptivity:** On mobile, margins shrink to 20px, and the 12-column grid collapses into a single-column stack. Typography scales down significantly to ensure the technical aesthetic doesn't feel overwhelming on small screens.

## Elevation & Depth

This design system avoids traditional shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. Depth is established through the stacking of surfaces rather than light sources.

1.  **Level 0 (Background):** Primary Dark (#050A14).
2.  **Level 1 (Cards/Sections):** Surface (#0C1425) with a 1px solid border of Charcoal (#1E293B).
3.  **Level 2 (Popovers/Overlays):** Surface (#0C1425) with a subtle Cyan (#00D1FF) glow—use a very low-opacity outer stroke (10-15%) rather than a drop shadow.

This approach ensures the UI feels "flat" and fast, mirroring the performance of the browser itself.

## Shapes

The shape language is "Soft-Technical." We use a conservative corner radius to maintain a professional, precision-tool aesthetic.

- **Standard Elements (Buttons, Inputs):** 0.25rem (4px) corner radius. This provides a subtle "friendlier" edge without losing the architectural feel of the brand.
- **Large Containers (Cards, Mockups):** 0.75rem (12px) corner radius. Used for feature cards and browser mockup containers to create a distinct frame for content.
- **Interactive States:** On hover, shapes should not change radius, but rather increase border-intensity or change background fill.

## Components

### Buttons
- **Primary:** Solid Cyan (#00D1FF) with Navy (#050A14) text. No gradients. 4px radius. 
- **Secondary:** Outline (#1E293B border) with White text. Transitions to a full White background on hover.

### Feature Cards
- Large, 12px rounded containers with Surface (#0C1425) fill.
- Use 1px Charcoal borders.
- Content should be left-aligned with ample internal padding (40px).

### Memory Engine Diagrams
- Use vertical flow diagrams with thin 1px Cyan lines.
- Nodes should be simple geometric shapes (squares or circles) to represent data packets, emphasizing the "Efficiency" narrative.

### Browser Mockup Containers
- A massive 12px rounded container with a "Simplified" browser chrome at the top. 
- Use the Accent Blue for the "Active Tab" indicator.
- The content within the mockup should be slightly dimmed to keep the focus on the browser's UI.

### Sticky Navigation
- A slim, 64px height bar with 90% opacity Primary Dark fill. 
- Bottom border of 1px Charcoal. 
- Logo on the left, primary "Download" button on the right.