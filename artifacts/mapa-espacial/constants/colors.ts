/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#E5E7EB',
    tint: '#00D4AA',

    // Core surfaces (dark theme)
    background: '#0A0E17',
    foreground: '#E5E7EB',

    // Cards / elevated surfaces
    card: '#1A1F2E',
    cardForeground: '#E5E7EB',

    // Primary — teal (collect actions, live indicators)
    primary: '#00D4AA',
    primaryForeground: '#0A0E17',

    // Secondary
    secondary: '#1E2433',
    secondaryForeground: '#9CA3AF',

    // Muted
    muted: '#1E2433',
    mutedForeground: '#6B7280',

    // Accent — amber (items, highlights)
    accent: '#FFD700',
    accentForeground: '#0A0E17',

    // Destructive
    destructive: '#F87171',
    destructiveForeground: '#0A0E17',

    // Borders and input outlines
    border: 'rgba(255,255,255,0.08)',
    input: 'rgba(255,255,255,0.08)',
  },

  radius: 12,
};

export default colors;
