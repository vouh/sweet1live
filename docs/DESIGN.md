1---
name: Nocturne & Gold
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#cfc6af'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#98907b'
  outline-variant: '#4c4635'
  surface-tint: '#e7c43f'
  primary: '#f6d24c'
  on-primary: '#3b2f00'
  primary-container: '#d8b632'
  on-primary-container: '#584800'
  # Selective section accent (not page chrome) — see .band-mustard
  band-mustard: '#c4a12e'
  band-mustard-ink: '#1a100c'
  band-mustard-soft: '#f5efe8'
  inverse-primary: '#715c00'
  secondary: '#c9c6be'
  on-secondary: '#31302b'
  secondary-container: '#484740'
  on-secondary-container: '#b8b5ad'
  tertiary: '#f8d15e'
  on-tertiary: '#3d2f00'
  tertiary-container: '#dab546'
  on-tertiary-container: '#5b4700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe17a'
  primary-fixed-dim: '#e7c43f'
  on-primary-fixed: '#231b00'
  on-primary-fixed-variant: '#554500'
  secondary-fixed: '#e6e2d9'
  secondary-fixed-dim: '#c9c6be'
  on-secondary-fixed: '#1c1c16'
  on-secondary-fixed-variant: '#484740'
  tertiary-fixed: '#ffe08c'
  tertiary-fixed-dim: '#e9c352'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '400'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
  price-display:
    fontFamily: Bodoni Moda
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  section-gap-desktop: 120px
  section-gap-mobile: 64px
---

## Brand & Style

The design system is a "Nocturnal Editorial" aesthetic designed for Sweet1neLIVE, with a **light cream + chocolate** companion theme for daytime browsing. It prioritises high-contrast cinematic visuals, evoking the atmosphere of a premium jazz club or high-end evening lounge. The personality is sophisticated, mature, and entertainment-led.

Cream and chocolate remain the default page surfaces. **Mustard gold** is a selective section accent (see Colors), not a full-site wash. Visual elements stay refined with hairline borders and generous letter spacing.

## Colors

The live site runs a **dual-theme system**: dark (default / “Nocturne”) and light (cream canvas). Do not flatten every section to one field colour.

### Core light theme (maintain these)
- **Cream canvas (#F5EFE8):** Page backgrounds, floating cards, and most mid-page sections.
- **Chocolate ink (#2C1810):** Primary text, footer, dark CTAs (`btn-ink`), and chocolate `primary-container` panels when a deep block is needed.
- **Brand Gold (#D8B632):** Reserve CTA, highlights, hairline accents — not full-bleed section fills.

### Core dark theme
- **Near-black (#131313 / #050505):** Page chrome so photography and gold pop.
- **Soft Ivory (#F7F3EA):** Primary typography on dark surfaces.
- **Brand Gold (#D8B632 / #F6D24C):** CTAs and accents.

### Mustard gold section band (selective)
Use the mustard field as a **mid-page accent**, not page chrome. Inspired by the Venue “Plan your night with us” treatment.

- **Token / class:** `--band-mustard` (`#C4A12E`) via `.band-mustard` or `<MustardCtaBand />`
- **On mustard:** Cream soft text (`--band-mustard-soft`), chocolate icons/accent words (`--band-mustard-accent`), muted cream body (`.band-mustard__muted`)
- **Rule:** At most **one** mustard band per route. Keep surrounding sections cream or chocolate so the gold reads as a deliberate beat, not a theme wash.
- **Good uses:** Home `.night-poster` (“GO OUT / GO ALL IN”), Venue facilities list, late-page CTAs (menus / reservations / live events), contact “Get in touch” side panel.
- **Avoid:** Hero fills, nav, footer, and stacking two mustard bands back-to-back.

### Functional
- Success and error states stay desaturated so they sit with the luxury palette.

## Typography

This design system uses a high-contrast typographic pairing to balance editorial flair with modern utility.

- **Headlines:** Bodoni Moda provides a high-contrast, elegant serif look. Use it for performance titles, menu categories, and emotive marketing copy.
- **Body & UI:** Hanken Grotesk is a clean, contemporary sans-serif. It handles all functional data: descriptions, reservation details, and form labels.
- **Editorial Touch:** Use the `label-caps` style for small metadata (e.g., "LIVE MUSIC", "DOORS OPEN") with generous letter spacing to enhance the premium feel.
- **Currency:** Prices should be set in Bodoni Moda to elevate them from functional text to a premium detail.

## Layout & Spacing

The layout philosophy is **Editorial and Spacious**. It avoids the cramped density of typical web apps, opting for a relaxed, rhythmic flow that mirrors a high-end physical programme.

- **Grid:** Use a 12-column fluid grid for desktop with 24px gutters.
- **Sectioning:** Vertical spacing is intentionally large (120px on desktop) to allow high-quality photography to "breathe" between content blocks.
- **Colour rhythm:** Alternate cream → photography / sticky media → cream → **one mustard accent** → closer/footer. Do not gold-wash the whole page.
- **Alignment:** Centralise primary headlines and call-to-actions to create a sense of formal presentation.
- **Mobile:** Reflow to a single column with 20px side margins. Maintain significant vertical gaps between elements to preserve the premium feel on smaller screens.

## Elevation & Depth

This design system eschews heavy shadows in favour of **Tonal Layering** and **Fine Outlines**.

- **Depth:** Surfaces are defined by their hex values (#050505 to #111111 on dark; cream tiers on light). Higher elevation is represented by lighter, warmer tones, not heavy shadows.
- **Borders:** Use the `border_gold` (rgba(216,182,50,0.28)) for all card boundaries and separators. These should be 1px "hairline" strokes.
- **Active State:** Rather than a shadow, an active card or focused input should increase its border opacity or transition to a solid #D8B632 stroke.
- **Atmospheric Depth:** Use soft, large-scale radial gradients (Brand Gold at 5% opacity) behind key images to simulate warm ambient spotlighting. Mustard bands may use a subtle inner radial wash (already in `.band-mustard`).

## Shapes

The shape language is **Refined and Structured**. 

- **Corners:** A `0.25rem` (4px) radius is used for standard UI components like buttons and inputs. This provides a "softened architectural" look that is cleaner than sharp corners but more professional than round ones.
- **Imagery:** Large hero images should remain sharp (0px radius) to maintain a cinematic, edge-to-edge feel. Curved collage corners are allowed on creative mid-page compositions (e.g. live nights) when intentional.
- **Interactive Elements:** Use the `Soft` setting for small components (chips, tags) to distinguish them from the more rigid layout structure.

## Components

### Buttons
- **Primary (light):** Dark chocolate / ink CTAs; gold outline secondary where needed.
- **Brand Gold CTA:** #D8B632 with dark text — especially nav **Reserve**.
- **On mustard bands:** Ink fill primary (`.btn-ink`); outlined chocolate secondary (`.btn-primary` overrides inside `.band-mustard`).
- **Tertiary/Action:** Soft Ivory or cream text with a 1px underline. On hover, underline may shift toward Brand Gold.

### Cards & Surfaces
- **Performance Card:** Surface Elevated with a hairline gold border. Images should be the primary focus, with Bodoni Moda headlines.
- **Menu Items:** Use a simple list format with the price in Brand Gold. Avoid card containers for menus; use whitespace and subtle dividers instead.
- **Mustard CTA:** Prefer `<MustardCtaBand />` over inventing ad-hoc gold backgrounds.

### Inputs & Forms
- **Fields:** Surface Secondary with an Ivory/cream label above. The border should only appear on focus, using the Brand Gold.
- **Checkboxes:** Square with a 2px radius. When checked, the fill is Brand Gold with a dark tick.

### Feedback & Motion
- **Transitions:** Use "Long & Smooth" transitions (400ms ease-out) for page reveals.
- **Hover States:** Elements should subtly shift in opacity or brightness rather than scale or move, maintaining a "still and calm" interface.
- **Icons:** Use thin-stroke (1px) linear icons. On mustard bands, use chocolate (`band-mustard__icon`).