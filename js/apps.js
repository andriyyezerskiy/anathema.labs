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

   Copy and icons below are final (real App Store listings). `glyph` remains
   only as an inline-SVG fallback if an icon PNG ever fails to load.
   ============================================================ */

const ANATHEMA_APPS = [
  {
    id: "resors",
    name: "Resors",
    tagline: "Design Systems for Xcode",
    about: "Resors turns Xcode asset management from a tedious, error-prone chore into a fast, visual workflow. Build beautiful, consistent assets without the friction.",
    features: [
      ["Visual-first", "Edit colors in a clean interface, with Light, Dark & High Contrast side by side, previewed on real UI."],
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
    url: "resors/index.html"
  },
  {
    id: "umbraa",
    name: "Umbraa",
    tagline: "Made for the hours after dark",
    about: "Umbraa is a native macOS app that lives in your menu bar and takes your screen well below its built-in minimum brightness, so your Mac stays comfortable in a dark room. It can warm the colors and black the screen out when you're ready to sleep.",
    features: [
      ["Screen dimming", "Dims every connected display below the usual minimum, with the change showing right away."],
      ["Color comfort", "Neutral, Warm, or Red. Warm and red are easier on your eyes at night."],
      ["Sleep timer", "Set a timer and the screen fades to black when it runs out, so it doesn't wake you up."],
      ["Sleep now", "One click blacks out every display right away, with no timer to set."],
      ["Built for macOS", "Lives in the menu bar, works on external monitors, has keyboard shortcuts, and launches at login."]
    ],
    glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16 6 6 0 0 1 0-16z" fill="currentColor" stroke="none"/></svg>',
    icon: "assets/icons/umbraa.png",
    iconDark: "assets/icons/umbraa-dark.png",
    accent: true,
    appStore: "https://apps.apple.com/app/umbraa/id6786208355",
    url: "umbraa/index.html"
  },
  {
    /* Not a product — an in-site toy: a monochrome click-wheel iPod that
       plays a SoundCloud playlist. `custom: "ipod"` makes app.js render the
       player (js/ipod.js) instead of the standard project window/sheet.
       Swap `playlist` for any public SoundCloud playlist / set / user URL. */
    id: "ethereal",
    name: "Ethereal",
    tagline: "Sounds in the studio",
    custom: "ipod",
    playlist: "https://soundcloud.com/giovannimatius/sets/anathema-labs",
    glyph: '<svg viewBox="0 0 22 28" fill="currentColor" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="0" width="16" height="1"/><rect x="1" y="2" width="1" height="1"/><rect x="20" y="2" width="1" height="1"/><rect x="1" y="3" width="1" height="1"/><rect x="4" y="3" width="14" height="1"/><rect x="20" y="3" width="1" height="1"/><rect x="1" y="4" width="1" height="1"/><rect x="4" y="4" width="1" height="1"/><rect x="17" y="4" width="1" height="1"/><rect x="20" y="4" width="1" height="1"/><rect x="1" y="5" width="1" height="1"/><rect x="4" y="5" width="1" height="1"/><rect x="6" y="5" width="2" height="1"/><rect x="13" y="5" width="2" height="1"/><rect x="17" y="5" width="1" height="1"/><rect x="20" y="5" width="1" height="1"/><rect x="1" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="6" y="6" width="2" height="1"/><rect x="13" y="6" width="2" height="1"/><rect x="17" y="6" width="1" height="1"/><rect x="20" y="6" width="1" height="1"/><rect x="1" y="7" width="1" height="1"/><rect x="4" y="7" width="1" height="1"/><rect x="17" y="7" width="1" height="1"/><rect x="20" y="7" width="1" height="1"/><rect x="1" y="8" width="1" height="1"/><rect x="4" y="8" width="1" height="1"/><rect x="7" y="8" width="1" height="1"/><rect x="13" y="8" width="1" height="1"/><rect x="17" y="8" width="1" height="1"/><rect x="20" y="8" width="1" height="1"/><rect x="1" y="9" width="1" height="1"/><rect x="4" y="9" width="1" height="1"/><rect x="8" y="9" width="5" height="1"/><rect x="17" y="9" width="1" height="1"/><rect x="20" y="9" width="1" height="1"/><rect x="1" y="10" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="17" y="10" width="1" height="1"/><rect x="20" y="10" width="1" height="1"/><rect x="1" y="11" width="1" height="1"/><rect x="4" y="11" width="1" height="1"/><rect x="17" y="11" width="1" height="1"/><rect x="20" y="11" width="1" height="1"/><rect x="1" y="12" width="1" height="1"/><rect x="4" y="12" width="14" height="1"/><rect x="20" y="12" width="1" height="1"/><rect x="1" y="13" width="1" height="1"/><rect x="20" y="13" width="1" height="1"/><rect x="1" y="14" width="1" height="1"/><rect x="20" y="14" width="1" height="1"/><rect x="1" y="15" width="1" height="1"/><rect x="8" y="15" width="6" height="1"/><rect x="20" y="15" width="1" height="1"/><rect x="1" y="16" width="1" height="1"/><rect x="7" y="16" width="1" height="1"/><rect x="14" y="16" width="1" height="1"/><rect x="20" y="16" width="1" height="1"/><rect x="1" y="17" width="1" height="1"/><rect x="6" y="17" width="1" height="1"/><rect x="15" y="17" width="1" height="1"/><rect x="20" y="17" width="1" height="1"/><rect x="1" y="18" width="1" height="1"/><rect x="5" y="18" width="1" height="1"/><rect x="16" y="18" width="1" height="1"/><rect x="20" y="18" width="1" height="1"/><rect x="1" y="19" width="1" height="1"/><rect x="5" y="19" width="1" height="1"/><rect x="10" y="19" width="2" height="1"/><rect x="16" y="19" width="1" height="1"/><rect x="20" y="19" width="1" height="1"/><rect x="1" y="20" width="1" height="1"/><rect x="5" y="20" width="1" height="1"/><rect x="9" y="20" width="4" height="1"/><rect x="16" y="20" width="1" height="1"/><rect x="20" y="20" width="1" height="1"/><rect x="1" y="21" width="1" height="1"/><rect x="5" y="21" width="1" height="1"/><rect x="10" y="21" width="2" height="1"/><rect x="16" y="21" width="1" height="1"/><rect x="20" y="21" width="1" height="1"/><rect x="1" y="22" width="1" height="1"/><rect x="5" y="22" width="1" height="1"/><rect x="16" y="22" width="1" height="1"/><rect x="20" y="22" width="1" height="1"/><rect x="1" y="23" width="1" height="1"/><rect x="6" y="23" width="1" height="1"/><rect x="15" y="23" width="1" height="1"/><rect x="20" y="23" width="1" height="1"/><rect x="1" y="24" width="1" height="1"/><rect x="7" y="24" width="1" height="1"/><rect x="14" y="24" width="1" height="1"/><rect x="20" y="24" width="1" height="1"/><rect x="1" y="25" width="1" height="1"/><rect x="8" y="25" width="6" height="1"/><rect x="20" y="25" width="1" height="1"/><rect x="3" y="27" width="16" height="1"/></svg>',
    accent: false
  },
  {
    /* In-site toy — a standalone generative visualizer with switchable
       states/scenes. `custom: "visualizer"` makes app.js render the canvas
       (js/visualizer.js) instead of a standard project window/sheet. */
    id: "vision",
    name: "Vision",
    tagline: "Generative visuals",
    custom: "visualizer",
    glyph: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6.6 10-6.6 10 6.6 10 6.6-3.6 6.6-10 6.6S2 12 2 12z"/><circle cx="12" cy="12" r="3.1"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
    accent: true
  }
];

/* Which app ids sit in the iOS bottom dock (max 4). Rest go in the grid. */
const IOS_DOCK_IDS = ["resors", "umbraa"];
