/* ============================================================
   Anathema Labs — project data (single source of truth)

   Each app feeds both the macOS dock and the iOS home/dock.

   Fields:
     id      unique slug
     name    display name
     tagline short one-liner
     about   1–2 sentence description (shown in window / sheet)
     glyph   inline SVG fallback icon (24x24 viewBox, uses currentColor)
     icon      path to the real icon image (PNG/SVG), used full-bleed
               instead of `glyph`. This is the LIGHT-MODE (default) variant.
     iconDark  path to the dark-mode variant, swapped in automatically
               when the site is in dark mode (adaptive icons). Optional.
     accent  true = orange icon tile, false = monochrome (only affects glyph)
     status  small label (e.g. "Live", "Beta", "Soon")
     features optional array of [title, description] pairs, shown as a
              bullet list in the project window / sheet
     email   optional contact email, shown as a mailto link
     appStore optional App Store URL — shown as a primary button; when
              set, the status chip is hidden (the store implies "live")
     url     external link (optional, "" to disable)

   NOTE: tagline/about/status below are PLACEHOLDERS — give me the real
   copy and I'll drop it in. Icons are SVG stand-ins recreated from the
   art you shared; replace with real PNGs in assets/icons/ when ready.
   ============================================================ */

const ANATHEMA_APPS = [
  {
    id: "resors",
    name: "Resors",
    tagline: "Design Systems for Xcode",
    about: "Resors turns Xcode asset management from a tedious, error-prone chore into a fast, visual workflow — build beautiful, consistent assets without the friction.",
    features: [
      ["Visual-first", "Edit colors in a clean interface — Light, Dark & High Contrast side by side, previewed on real UI."],
      ["Bi-directional sync", "Connect an asset catalog and reconcile changes both ways, with flexible conflict resolution."],
      ["Frictionless import", "Drop in existing .colorset files and validate them instantly."],
      ["Reusable libraries", "Define your palette once and ship it consistently across every app."],
      ["Export that just works", "Generate Xcode-ready .colorset files in seconds."]
    ],
    glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="8.8" cy="9.2" r="1.7"/><path d="M4.5 17.5l4.5-4.5 3.5 3 2.5-2 4.5 4.5"/></svg>',
    icon: "assets/icons/resors.png",
    iconDark: "assets/icons/resors-dark.png",
    accent: false,
    appStore: "https://apps.apple.com/app/resors/id6748361802",
    url: ""
  },
  {
    id: "umbraa",
    name: "Umbraa",
    tagline: "Made for the hours after dark",
    about: "Umbraa makes your Mac comfortable to use in the dark. When even the lowest brightness is too bright, it softens every display with an elegant overlay that goes far beyond the system minimum — one slider, immediate, effortless.",
    features: [
      ["Dim below the limit", "Soften every connected display past its darkest setting, with smooth, instant preview."],
      ["Color comfort", "Neutral, Warm, or Red tints ease dark-adapted eyes and keep the screen calm instead of harsh."],
      ["Sleep timer", "Set a timer and Umbraa fades gently to black, so a bright screen never jolts you awake."],
      ["Automatic at sunset", "Let it dim on its own from dusk to dawn, based on your location."],
      ["Built for macOS", "A quiet menu-bar app with external-monitor support, keyboard shortcuts, and launch at login."]
    ],
    glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16 6 6 0 0 1 0-16z" fill="currentColor" stroke="none"/></svg>',
    icon: "assets/icons/umbraa.png",
    iconDark: "assets/icons/umbraa-dark.png",
    accent: true,
    status: "Coming Soon",
    url: "umbraa/index.html"
  }
];

/* Which app ids sit in the iOS bottom dock (max 4). Rest go in the grid. */
const IOS_DOCK_IDS = ["resors", "umbraa"];
