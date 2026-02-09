# Branding Brief

> This file is populated during Phase 2 (Theming) based on user preferences.
> **Last Updated**: 2025-02-08 (Theme Refinement - Phase 6)

## Color Scheme

### Core Palette (Monochrome)
- **Background**: Pure black (#000000)
- **Foreground**: Light grey (#E5E5E5)
- **Card backgrounds**: Dark grey (#111111)
- **Borders**: Grey (#374151) to (#1F2937)
- **Muted text**: Grey (#6B7280) to (#9CA3AF)

### Accent Color (Red - Tertiary/Supporting)
- **Primary red**: #DC2626 (used sparingly for emphasis)
- **Dim red**: #991B1B (borders, subtle accents)
- **Bright red**: #EF4444 (hover states, warnings)

### CSS Variables (defined in globals.css)
```css
--red-accent: #DC2626;
--red-accent-dim: #991B1B;
--red-accent-bright: #EF4444;
--background: #000000;
--foreground: #E5E5E5;
```

## Visual Style

- **Clean & Minimal**: Let the album art be the only color
- **Dark Mode**: Deep black backgrounds (enforced, not toggleable)
- **Futuristic**: Sharp edges, high contrast, sleek typography
- **Monochrome**: Black, white, grey only - red as sole accent

## Design Decisions

### No Gradients
All gradient backgrounds have been replaced with solid colors:
- Cards use `bg-gray-900` or `bg-gray-800` with subtle borders
- No `bg-gradient-to-*` classes anywhere in the codebase
- Solid colors create cleaner, more futuristic aesthetic

### No Emojis
All emoji icons replaced with monochrome alternatives:
- `♪` - Unicode music note for empty states
- Text labels: "VOTING OPEN", "LISTENING WEEK", "PLAY ON SPOTIFY"
- `// Favorite:` prefix for track annotations
- `OK` for success states (not checkmark emoji)

### Color Usage by Context
| Context | Color | Tailwind Class |
| ------- | ----- | -------------- |
| Primary text | White | `text-white` |
| Secondary text | Grey | `text-gray-400` |
| Muted text | Dark grey | `text-gray-500`, `text-gray-600` |
| Error/countdown | Red | `text-red-500` |
| Success indicator | White | `text-white` |
| Borders | Grey | `border-gray-700`, `border-gray-800` |
| Active accent | Red | `border-red-500/30` |

### Components Styled
| Component | Background | Border | Notes |
| --------- | ---------- | ------ | ----- |
| Cards | `bg-gray-900` | `border-gray-700/800` | No gradients |
| Status banners | `bg-gray-900` | `border-red-500/30` (voting) | Phase-aware |
| Buttons (default) | Theme default | - | No custom colors |
| Empty states | `bg-gray-800` | `border-gray-700` | Placeholder boxes |
| Step indicators | `bg-gray-800` | `border-gray-700` | Numbered circles |

## Typography

- **Font**: Outfit (sans-serif)
- **Monospace**: JetBrains Mono (for technical elements)
- **Uppercase**: Used for status labels (VOTING OPEN, PLAY ON SPOTIFY)
- **Tracking**: `tracking-widest` for small uppercase labels

## Additional Notes

- The monochrome aesthetic lets the colorful album artwork pop as the focal point
- Futuristic vibe aligns with the "resisting algorithms" ethos - intentional, curated, human
- High contrast for excellent readability on mobile
- Minimal visual noise - focused on content
- Red used only for emphasis (countdowns, voting status, errors)

## User's Words

"clean and minimal with dark vibe, monochrome black white grey and futuristic"
"remove all gradients"
"change it to monochrome and futuristic with a glimpse of little red colour as tertiary or supporting colour"
"change all icon that use emoji with black and white icon"
