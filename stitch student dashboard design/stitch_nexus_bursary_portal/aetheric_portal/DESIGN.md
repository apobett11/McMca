---
name: Aetheric Portal
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#fff3f4'
  on-tertiary: '#66002c'
  tertiary-container: '#ffccd6'
  on-tertiary-container: '#bb0058'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#ffd9e0'
  tertiary-fixed-dim: '#ffb1c3'
  on-tertiary-fixed: '#3f0019'
  on-tertiary-fixed-variant: '#8f0041'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-xl:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
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
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2.5rem
  xl: 4rem
  container-padding: 2rem
  gutter: 1.5rem
---

## Brand & Style
The brand personality is high-tech, energetic, and ethereal. It targets a tech-forward audience that values precision and a sense of "cosmic" innovation. The UI should evoke a feeling of limitless potential and clarity.

The design system employs a **Modern-Vibrant** aesthetic, blending elements of **Glassmorphism** with a **Corporate-Tech** structure. The style relies on high-saturation accents against sophisticated, tinted neutrals to create a sense of depth and energy without sacrificing professional utility. The interface is characterized by generous whitespace, sharp interactive states, and glowing accents that guide the user's focus toward primary actions.

## Colors
The color palette is designed for maximum vibrancy and high contrast. 

### Theme Logic
- **Dark Mode (Default):** Surfaces move away from pure black into energetic, navy-tinted slates. `surface-bright` and `surface-container` tiers use increased luminosity to ensure elements feel elevated rather than sunken. Primary items should feature a subtle 1px inner border tint or a low-opacity outer glow using the primary color.
- **Light Mode:** Pure white is replaced with a sophisticated navy-tinted hue (#F4F7FA) to reduce eye strain and provide a premium, "cool" backdrop that allows primary vibrant accents to pop.

### Palette Roles
- **Primary:** A neon cyan (#00F0FF) used for critical actions and active states.
- **Secondary:** An electric violet (#7000FF) for secondary interactive elements.
- **Neutral:** Deep slates that provide the structural foundation.

## Typography
Typography is highly structured to maintain a technical edge. **Sora** provides geometric, bold headlines that feel futuristic. **Hanken Grotesk** offers exceptional legibility for body text with a contemporary feel. **JetBrains Mono** is utilized for labels and metadata to reinforce the "Portal" or system-driven narrative.

Text contrast must be strictly maintained: use high-luminance whites/slates for headers and primary body text, and medium-luminance variants for secondary information to ensure clarity against the updated vibrant backgrounds.

## Layout & Spacing
This design system prioritizes "breathing room" to counteract data density. It follows a **Fluid Grid** model with generous margins.

- **Standard Spacing:** The base unit is 8px, but the system leans toward the higher end of the scale (`md` and `lg`) for container padding and section margins.
- **Cards & Sections:** Cards must never feel crowded; internal padding should default to `lg` (2.5rem) to ensure content has significant clearance from borders.
- **Breakpoints:** 
  - **Mobile:** Single column, 1rem side margins.
  - **Tablet:** 8-column grid, 1.5rem side margins.
  - **Desktop:** 12-column grid, max-width 1440px, 2rem side margins.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and **Vibrant Accents** rather than traditional shadows.

1.  **Surfaces:** Elements are elevated by moving from the base background to higher-luminance "Surface Container" colors.
2.  **Glows:** Primary cards or active elements utilize a "Vibrant Tint" — a 1px border using a 30% opacity version of the Primary color, paired with a very soft, high-spread shadow (blur 24px, 10% opacity) of the same color.
3.  **Glassmorphism:** Overlays and modals use a backdrop blur (20px) and a semi-transparent fill of the Surface Bright color to maintain context while ensuring legibility.

## Shapes
The shape language is modern and balanced. A `Rounded` (0.5rem) radius is the standard for small components like inputs and buttons. For larger containers and cards, the system scales to `rounded-xl` (1.5rem) to soften the technical edge and create a more inviting, "premium product" feel. Interactive elements should feel substantial and tactile.

## Components
- **Buttons:** Primary buttons use a solid Primary fill with black text for maximum "pop." Hover states should trigger a slight scale increase (1.02x) and an intensified outer glow.
- **Cards:** Use the `rounded-xl` corner radius. Primary cards feature a subtle gradient border (Primary to Secondary) to distinguish them from standard informational cards.
- **Input Fields:** Use the Surface Container color with a 1px border. On focus, the border transitions to the Primary color with a soft inner glow.
- **Chips:** Highly saturated backgrounds with low-opacity (15%) for inactive states, switching to full saturation for active/selected states.
- **Lists:** High-density lists are avoided; items are separated by `md` spacing and utilize subtle horizontal dividers in the Secondary color at 10% opacity.
- **Interactive Toggles:** Use a "switch" design that glows when active, providing immediate visual feedback of the system's "powered-on" state.