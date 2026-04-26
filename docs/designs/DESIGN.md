---
name: Heritage & Connection
colors:
  surface: '#fff8f4'
  surface-dim: '#e1d8d2'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2eb'
  surface-container: '#f5ece5'
  surface-container-high: '#f0e7df'
  surface-container-highest: '#eae1da'
  on-surface: '#1f1b17'
  on-surface-variant: '#444840'
  inverse-surface: '#34302b'
  inverse-on-surface: '#f8efe8'
  outline: '#747870'
  outline-variant: '#c4c8be'
  surface-tint: '#516449'
  primary: '#47593f'
  on-primary: '#ffffff'
  primary-container: '#5f7256'
  on-primary-container: '#e1f6d3'
  inverse-primary: '#b8cdac'
  secondary: '#785832'
  on-secondary: '#ffffff'
  secondary-container: '#fed2a2'
  on-secondary-container: '#795932'
  tertiary: '#555551'
  on-tertiary: '#ffffff'
  tertiary-container: '#6d6d69'
  on-tertiary-container: '#f2f0eb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e9c7'
  primary-fixed-dim: '#b8cdac'
  on-primary-fixed: '#0f1f0a'
  on-primary-fixed-variant: '#3a4c32'
  secondary-fixed: '#ffddb9'
  secondary-fixed-dim: '#e9bf90'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#5e411d'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#fff8f4'
  on-background: '#1f1b17'
  surface-variant: '#eae1da'
typography:
  h1:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
  h2:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '500'
    lineHeight: '1.3'
  h3:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

This design system is built to evoke the timeless feeling of a family archive, modernized for digital interaction. The brand personality is grounded, storytelling-driven, and deeply empathetic. It targets users who value legacy and personal history, ranging from casual hobbyists to dedicated genealogists.

The design style leans into **Soft Minimalism with Tactile accents**. It avoids the sterility of modern corporate SaaS by utilizing organic textures and a palette inspired by nature. The interface should feel like a well-organized physical scrapbook—clean and functional, yet warm and inviting. High-quality whitespace and elegant type pairings ensure that the focus remains on the individuals and stories within the family tree.

## Colors

The palette is derived from natural elements to reinforce the "Family Tree" metaphor. 

- **Primary (Sage Green):** Represents growth, vitality, and the connective tissue of the lineage.
- **Secondary (Warm Oak):** Used for accents and structural elements, evoking stability and the wooden frame of a portrait.
- **Tertiary (Soft Cream):** The primary background color, providing a softer, more historical feel than pure white, reminiscent of aged paper or linen.
- **Neutral (Charcoal Brown):** Replaces harsh blacks for text and borders to maintain a warm, approachable contrast.

Functional colors (success, error, warning) should be slightly desaturated to harmonize with the earthy primary palette.

## Typography

This design system employs a sophisticated typographic pairing to balance heritage with modern utility.

**Newsreader** is used for all editorial and storytelling elements. Its varied stroke weights and classic serif structure lend an authoritative yet literary feel to names and historical headings.

**Plus Jakarta Sans** provides the functional backbone for the UI. Its soft, rounded terminals and open apertures ensure high legibility in dense data views (like family charts) while maintaining the "approachable" brand promise. 

Use sentence case for most UI labels to keep the tone conversational. Use all-caps with light tracking only for small metadata labels to create a distinct visual hierarchy.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid with Fluid Containers**. On desktop, content is centered within a 1280px max-width container to ensure readability and focus. The family tree visualization itself should allow for infinite panning, but the surrounding UI panels and controls adhere to a strict 8px-based spacing rhythm.

Generous margins and gutters are essential to evoke the "Minimalist" style, preventing the application from feeling like a spreadsheet. Use whitespace as a structural element to group related family branches and media galleries.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers and Ambient Shadows**. Rather than using heavy borders, this design system uses subtle shifts in background color (e.g., a slightly darker cream or a very pale sage) to define different functional areas.

Shadows must be "long and soft," utilizing a low-opacity charcoal brown tint instead of pure black to maintain the warm aesthetic. 
- **Level 1 (Cards):** Very subtle, 4px blur, 5% opacity.
- **Level 2 (Modals/Popovers):** 16px blur, 10% opacity, slightly more vertical offset to suggest "floating" above the archive.
- **Interactive Depth:** When a user interacts with a person's profile card, the shadow should slightly expand to provide tactile feedback.

## Shapes

The shape language is **Organic and Soft**. The system uses a `0.5rem` (8px) base radius for standard components, which scales up to `1.5rem` (24px) for larger containers like profile panels and media cards. 

Avoid sharp 90-degree angles entirely, as they feel too technical and "cold" for a product centered on human connection. Circles are reserved exclusively for avatars and primary action icons to create a clear visual distinction between "people" and "containers."

## Components

### Buttons
Primary buttons use the Sage Green background with white or cream text. They should have a subtle inner shadow to feel slightly "pressed" or tactile. Secondary buttons use a Sage Green outline with a transparent background.

### Profile Cards
The core component of the tree. These should be vertically oriented with a circular avatar at the top. Use a subtle "Oak" colored border (1px, 20% opacity) to give the card a framed appearance.

### Chips & Tags
Use soft, desaturated tones to categorize family members (e.g., "Direct Ancestor," "In-Law"). These should have fully rounded (pill) shapes to distinguish them from interactive buttons.

### Input Fields
Inputs should use the Cream background with a bottom-only border or a very light 4-sided stroke in Charcoal Brown. This mimics the look of a traditional ledger or form.

### Connectors (The "Branches")
Lines connecting family nodes should be slightly thick (2px) and rendered in a soft "Oak" or "Sage" color. Use rounded corners for elbow-joints in the tree to maintain the organic flow.

### Media Gallery
Images and scanned documents should be displayed in cards with generous padding, using "polaroid" inspired styling—larger bottom margins for captions and dates.