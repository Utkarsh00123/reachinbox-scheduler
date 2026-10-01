---
name: Editorial Cold Outreach
colors:
  surface: '#fff8f5'
  surface-dim: '#e9d7c8'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e8'
  surface-container: '#feeadc'
  surface-container-high: '#f8e5d6'
  surface-container-highest: '#f2dfd1'
  on-surface: '#231a11'
  on-surface-variant: '#55423e'
  inverse-surface: '#392e25'
  inverse-on-surface: '#ffeee1'
  outline: '#88726d'
  outline-variant: '#dbc1ba'
  surface-tint: '#9a442d'
  primary: '#9a442d'
  on-primary: '#ffffff'
  primary-container: '#e07a5f'
  on-primary-container: '#5b1604'
  inverse-primary: '#ffb4a1'
  secondary: '#9e4129'
  on-secondary: '#ffffff'
  secondary-container: '#ff8b6d'
  on-secondary-container: '#75230d'
  tertiary: '#655d58'
  on-tertiary: '#ffffff'
  tertiary-container: '#9f948f'
  on-tertiary-container: '#342d2a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a1'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#7c2e19'
  secondary-fixed: '#ffdbd2'
  secondary-fixed-dim: '#ffb4a1'
  on-secondary-fixed: '#3c0800'
  on-secondary-fixed-variant: '#7f2b14'
  tertiary-fixed: '#ede0da'
  tertiary-fixed-dim: '#d0c4bf'
  on-tertiary-fixed: '#201a17'
  on-tertiary-fixed-variant: '#4d4541'
  background: '#fff8f5'
  on-background: '#231a11'
  surface-variant: '#f2dfd1'
typography:
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 30px
  headline-sm:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a minimalist editorial flat 2D aesthetic tailored for an email job scheduler and cold outreach dashboard. The brand personality is calm, professional, and literary, avoiding the sterile, tech-heavy demeanor of typical SaaS tools. It evokes a tactile, paper-like publishing feel through an inviting palette of warm oatmeal cream and deep espresso. 

The visual experience relies on generous whitespace, crisp structural borders, and restrained terracotta accents to guide the user's attention through complex outreach campaigns without visual noise. Zero heavy 3D gradients or skeuomorphic shadows are permitted; depth is communicated purely through surface-container layering and precise border contrast.

## Colors

The color palette centers around a warm oatmeal cream background (`#FBF8F3`) paired with warm white (`#FFFFFF`) and light cream (`#F4EFE6`) cards to establish a clean, editorial hierarchy. Crisp light brown and warm taupe borders (`#E5DDD0` and `#D8CEBE`) define the boundaries of flat 2D surfaces. 

Typography utilizes deep espresso dark brown (`#2B2118`) for primary readability and soft warm brown (`#7A6E65`) for secondary metadata. Terracotta peach (`#E07A5F`, hover `#D46A4E`) serves as the primary action color, complemented by pastel peach highlights (`#FDF0EA`). Status indicators for Scheduled, Sent, and Rate Limited must maintain high legibility against light backgrounds using desaturated semantic tones.

## Typography

The typographical hierarchy pairs an authoritative editorial serif for headlines with a clean, grounded sans-serif for functional UI text. Newsreader drives the editorial narrative of the dashboard with refined proportions and literary authority, while Work Sans ensures optimal legibility for dense data tables, schedules, and email metrics. 

Ensure line heights remain generous to support the breathing room required by the minimalist aesthetic. Avoid pure black text in favor of deep espresso (`#2B2118`), and restrict small labels to uppercase tracking only when used as categorical tags.

## Layout & Spacing

The layout employs a structured 12-column fluid grid system anchored by generous outer canvas margins (`2rem`) and consistent column gutters (`1.5rem`). This architecture emphasizes horizontal rhythm and vertical whitespace, reflecting the cadence of an editorial publication rather than a cramped data grid.

On mobile form factors, margins collapse to `1rem` and multi-column outreach schedulers reflow into a single-column stacked view. Component padding must strictly adhere to the `space-*` scale to maintain consistent optical density across navigation rails, campaign tables, and sidebar controls.

## Elevation & Depth

Depth is achieved exclusively through flat 2D surface-container layering and low-contrast outlines, rejecting all drop shadows and blurred gradients. 

Hierarchical separation relies on crisp boundaries: the base oatmeal canvas (`#FBF8F3`) hosts warm white (`#FFFFFF`) primary cards outlined with light taupe borders (`#E5DDD0`), while nested elements or secondary panels use light cream (`#F4EFE6`) surfaces with darker taupe framing (`#D8CEBE`). Interactive states communicate elevation shifts through border color transitions rather than Z-axis displacement.

## Shapes

The shape language uses sharp and subtly-rounded corners (`rounded-xl`, translating to `0.75rem` for primary containers and `0.375rem` for interactive controls like buttons and inputs). This restrained rounding maintains a crisp, architectural precision reminiscent of fine print layouts, avoiding overly playful bubble aesthetics while softening the rigidity of pure rectangles.

## Components

### Buttons
Primary action buttons feature solid terracotta peach fills (`#E07A5F`), deep espresso text (`#FFFFFF`), subtle rounding (`0.375rem`), and zero shadows. On hover, transition to `#D46A4E`. Secondary actions use transparent fills with warm taupe borders (`#E5DDD0`) and deep espresso text (`#2B2118`), shifting to a pastel peach background (`#FDF0EA`) on hover.

### Chips & Badges
Status indicators for Scheduled, Sent, and Rate Limited are styled as compact pill-or-rounded tags. Use soft, desaturated background tints paired with matching dark text to maintain the editorial color discipline.

### Lists & Data Tables
Email outreach lists feature generous row padding, separated by crisp hairline borders (`#E5DDD0`). Alternating row colors are unnecessary due to the high-contrast surface layering between the canvas and card containers.

### Checkboxes & Radio Buttons
Rendered as flat square and circular frames with a `1px` warm taupe border and a warm white fill. Checked states fill the inner area solidly with terracotta peach, incorporating a minimal checkmark in warm white.

### Input Fields
Text inputs and email sequence schedulers feature a warm white background (`#FFFFFF`), a crisp light brown border (`#E5DDD0`), and deep espresso placeholder/input text. Focus states transition the border strictly to terracotta peach (`#E07A5F`) without outer glows.

### Cards
Campaign summary cards and scheduler containers use warm white (`#FFFFFF`) or light cream (`#F4EFE6`) surfaces, defined by thin structural borders (`#E5DDD0`) and generous internal padding (`space-lg`).

### Recommended Additional Components
- **Sequence Timeline:** A vertical step-indicator tracking automated email cadences with connected flat node markers.
- **Deliverability Meter:** A minimalist linear progress bar utilizing the primary terracotta accent against a light cream track.
- **Recipient Preview Modal:** An editorial slide-over drawer featuring a dedicated preview pane for rendered cold emails.