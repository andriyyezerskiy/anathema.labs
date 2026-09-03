#!/usr/bin/env python3
"""Build resors/index.html.

    python3 resors/build.py

The page is generated, so edit this file rather than the HTML it writes.

The page's spine is the journey Resors covers start to finish (import, see,
iterate, reuse, ship) and its recurring object is the system board: colours,
SF Symbol glyphs and image assets shown as one system. The working drag-and-drop
demo (CSS, markup, JS) is carried over from the previous page untouched.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "index.html")

# The document head, kept here so the generator does not depend on any file
# outside the repository.
HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resors: a design system for your Xcode asset catalog</title>
  <meta name="description" content="Resors turns Xcode asset management into a visual workflow. Create, import, group, and export color assets, with two-way sync to your Xcode project." />
  <link rel="canonical" href="https://anathemalabs.com/resors/" />

  <!-- Icons -->
  <link rel="icon" type="image/png" sizes="32x32" href="images/favicon-32.png" />
  <link rel="apple-touch-icon" href="images/apple-touch-icon.png" />
  <meta name="theme-color" content="#fbfbfd" media="(prefers-color-scheme: light)" />
  <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Resors" />
  <meta property="og:title" content="Resors: Xcode Design Systems Made Easy" />
  <meta property="og:description" content="A native macOS app for Xcode asset management. Create, import, group, sync, and export colors, symbols, and images." />
  <meta property="og:url" content="https://anathemalabs.com/resors/" />
  <meta property="og:image" content="https://anathemalabs.com/resors/images/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Resors: Xcode Design Systems Made Easy" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Resors: Xcode Design Systems Made Easy" />
  <meta name="twitter:description" content="A native macOS app for Xcode asset management." />
  <meta name="twitter:image" content="https://anathemalabs.com/resors/images/og-image.jpg" />

  <!-- Structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Resors",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "macOS",
    "url": "https://anathemalabs.com/resors/",
    "image": "https://anathemalabs.com/resors/images/og-image.jpg",
    "description": "Resors transforms Xcode asset management into a fast, visual workflow. Create, import, group, sync, and export color, symbol, and image assets with bi-directional Xcode sync.",
    "downloadUrl": "https://apps.apple.com/app/resors/id6748361802",
    "offers": { "@type": "Offer", "url": "https://apps.apple.com/app/resors/id6748361802" }
  }
  </script>
"""

DEMO_CSS = DEMO_HTML = DEMO_JS = ""

# ---------------------------------------------------------------- asset data
COLORS = [
    ("Ember", "#E08A2C", "#B96A18", "#7A3F06"),
    ("Ocean", "#3E8E9B", "#2A6470", "#0E3540"),
    ("Sapphire", "#2F5FA8", "#21467C", "#0F2748"),
    ("Ruby", "#C6413F", "#9A2C2A", "#5E1312"),
    ("Primary", "#0071E3", "#2997FF", "#0040A0"),
    ("Moss", "#4E7A3A", "#375A28", "#1B3311"),
    ("Plum", "#7A4A8C", "#573268", "#2E1739"),
    ("Slate", "#4A5568", "#333C4D", "#171C26"),
]

# Original glyph shapes standing in for SF Symbols. Apple's own font is not
# licensed for the web, so these are drawn rather than embedded.
GLYPHS = {
    "bolt": '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    "heart": '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9z"/>',
    "star": '<path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z"/>',
    "bell": '<path d="M18 15V10a6 6 0 1 0-12 0v5l-2 3h16zM10 21h4"/>',
    "cloud": '<path d="M7 18h10a4 4 0 0 0 .3-8 6 6 0 0 0-11.5 1.6A3.6 3.6 0 0 0 7 18z"/>',
    "gear": '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.6M12 18.4V21M21 12h-2.6M5.6 12H3M18.4 5.6 16.5 7.5M7.5 16.5l-1.9 1.9M18.4 18.4l-1.9-1.9M7.5 7.5 5.6 5.6"/>',
    "camera": '<path d="M3 8h4l1.6-2.4h6.8L17 8h4v11H3z"/><circle cx="12" cy="13" r="3.4"/>',
    "moon": '<path d="M20 14.5A8 8 0 0 1 9.5 4 8.2 8.2 0 1 0 20 14.5z"/>',
    "wave": '<path d="M3 12c2.5-4 5-4 7.5 0s5 4 7.5 0"/><path d="M3 17c2.5-4 5-4 7.5 0s5 4 7.5 0"/><path d="M3 7c2.5-4 5-4 7.5 0S15.5 11 18 7"/>',
    "square": '<rect x="4" y="4" width="16" height="16" rx="4"/>',
}

SYMBOLS = [
    ("bolt.fill", "bolt", "#E08A2C"),
    ("heart.fill", "heart", "#C6413F"),
    ("star.fill", "star", "#E0A82C"),
    ("bell.badge", "bell", "#2F5FA8"),
    ("cloud.sun", "cloud", "#3E8E9B"),
    ("gearshape", "gear", "#4A5568"),
    ("camera.macro", "camera", "#7A4A8C"),
    ("moon.stars", "moon", "#2F5FA8"),
    ("waveform", "wave", "#4E7A3A"),
]

IMAGES = [
    ("hero-card", "linear-gradient(135deg,#E08A2C,#C6413F)"),
    ("onboarding", "linear-gradient(135deg,#2F5FA8,#3E8E9B)"),
    ("empty-state", "linear-gradient(135deg,#7A4A8C,#2F5FA8)"),
    ("paywall-bg", "linear-gradient(135deg,#4E7A3A,#3E8E9B)"),
    ("badge-pro", "linear-gradient(135deg,#0071E3,#7A4A8C)"),
    ("texture-grain", "linear-gradient(135deg,#4A5568,#111114)"),
]


def glyph_svg(key, color, size=26):
    fill = "none"
    stroke = color
    body = GLYPHS[key]
    # Solid shapes read better filled; outline shapes keep a stroke.
    if key in ("bolt", "heart", "star", "moon", "square"):
        fill, stroke = color, "none"
        return ('<svg viewBox="0 0 24 24" width="%d" height="%d" fill="%s" stroke="none" '
                'aria-hidden="true">%s</svg>' % (size, size, fill, body))
    return ('<svg viewBox="0 0 24 24" width="%d" height="%d" fill="none" stroke="%s" '
            'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '
            'aria-hidden="true">%s</svg>' % (size, size, stroke, body))


def tile_color(name, hexv):
    return ('<div class="tile tile--color" style="background:%s">'
            '<span class="meta on-dark">%s<em>%s</em></span></div>' % (hexv, name, hexv))


def tile_symbol(name, key, color):
    """Symbol tiles carry a wash of their own tint so they hold their own
    beside the solid colour tiles instead of reading as empty squares."""
    r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    tint = "rgba(%d,%d,%d,0.13)" % (r, g, b)
    return ('<div class="tile tile--symbol" style="background:%s">'
            '<span class="gl">%s</span>'
            '<span class="meta">%s</span></div>' % (tint, glyph_svg(key, color, 34), name))


def tile_image(name, grad):
    return ('<div class="tile tile--image"><span class="img" style="background:%s"></span>'
            '<span class="meta on-dark">%s</span></div>' % (grad, name))


def _glyph_plain(key, color):
    """Glyph with no intrinsic size; the card sizes it in cqw."""
    body = GLYPHS[key]
    if key in ("bolt", "heart", "star", "moon", "square"):
        return '<svg viewBox="0 0 24 24" fill="%s" aria-hidden="true">%s</svg>' % (color, body)
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="%s" stroke-width="1.7" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
            % (color, body))


# --- Appearance marks ------------------------------------------------------
# AssetVariantType.symbol names an SF Symbol per appearance; these are those
# marks drawn as paths, since the SF Symbols font is not licensed for the web.
#   any     circle.fill
#   light   circle.lefthalf.filled
#   dark    circle.righthalf.filled
#   hcAny   circle.lefthalf.striped.horizontal
#   hcLight circle.lefthalf.filled.righthalf.striped.horizontal
#   hcDark  circle.lefthalf.striped.horizontal.inverse
MARKS = {
    "any": ('<circle cx="12" cy="12" r="9" fill="currentColor"/>'),
    "light": ('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>'),
    "dark": ('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
    "hcAny": ('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M6.97 4.90H11.80M4.86 7.25H11.80M3.83 9.60H11.80M3.50 11.95H11.80M3.80 14.30H11.80M4.79 16.65H11.80M6.84 19.00H11.80" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>'),
    "hcLight": ('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/><path d="M12.20 4.90H17.03M12.20 7.25H19.14M12.20 9.60H20.17M12.20 11.95H20.50M12.20 14.30H20.20M12.20 16.65H19.21M12.20 19.00H17.16" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>'),
    "hcDark": ('<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/><path d="M6.97 4.90H11.80M4.86 7.25H11.80M3.83 9.60H11.80M3.50 11.95H11.80M3.80 14.30H11.80M4.79 16.65H11.80M6.84 19.00H11.80" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" fill="none"/>'),
}

# AssetAppearanceType.supportedVariantTypes(supportsHighContrast:). ColorAsset
# passes its own flag through, so a colour reaches all six. SymbolAsset and
# ImageAsset both pass false, so they stop at the base three.
VARIANTS_COLOR = ["any", "light", "dark", "hcAny", "hcLight", "hcDark"]
VARIANTS_SYMBOL = ["any", "light", "dark"]
VARIANTS_IMAGE = ["any", "light", "dark"]


def mark(name):
    return '<svg viewBox="0 0 24 24" aria-hidden="true">%s</svg>' % MARKS[name]


def asset_card(preview, name, variants, attrs=""):
    """The one asset card used everywhere on the page. `preview` is the art for
    the top 140pt square; `variants` are the appearances the asset defines."""
    marks = "".join(mark(v) for v in variants)
    return ('<div class="asset"' + attrs + '><div class="asset-card">' + preview
            + '<div class="asset-body"><span class="asset-name">' + name + '</span>'
            + '<span class="asset-appear">' + marks + '</span></div></div></div>')


def card_color(name, light, dark, variants=None, attrs=""):
    """ColorAssetGridItem: ColorVariantView clipped to a 32pt rounded rect,
    aspectRatio 1, frame(height: 140) - full-bleed, not inset."""
    return asset_card('<div class="asset-sw" style="--l:%s;--d:%s"></div>' % (light, dark),
                      name, variants or VARIANTS_COLOR, attrs)


def card_symbol(name, key, color, variants=None, attrs=""):
    """SymbolAssetGridItem: SymbolVariantView.padding(32) in a 140-tall box,
    with no fill and no rounded clip behind it."""
    return asset_card('<div class="asset-art asset-art--sym">%s</div>' % _glyph_plain(key, color),
                      name, variants or VARIANTS_SYMBOL, attrs)


def card_image(name, grad, variants=None, attrs=""):
    """ImageAssetGridItem: the artwork scaledToFit with .padding() in a
    140-tall box, again with nothing behind it."""
    return asset_card('<div class="asset-art asset-art--img">'
                      '<span class="art" style="background:%s"></span></div>' % grad,
                      name, variants or VARIANTS_IMAGE, attrs)


def hero_strip():
    """Interleaved run of all three asset kinds, wider than the viewport."""
    order = []
    ci = si = ii = 0
    pattern = ["c", "s", "c", "i", "s", "c", "c", "s", "i", "c", "s", "c", "i", "s", "c", "c", "s", "i"]
    for p in pattern:
        if p == "c":
            n, l, d, _hc = COLORS[ci % len(COLORS)]; ci += 1
            order.append(card_color(n, l, d))
        elif p == "s":
            n, k, c = SYMBOLS[si % len(SYMBOLS)]; si += 1
            order.append(card_symbol(n, k, c))
        else:
            n, g = IMAGES[ii % len(IMAGES)]; ii += 1
            order.append(card_image(n, g))
    return "\n          ".join(order)


def board_full():
    out = []
    for n, h, _d, _hc in COLORS:
        out.append(tile_color(n, h))
    for n, k, c in SYMBOLS[:6]:
        out.append(tile_symbol(n, k, c))
    for n, g in IMAGES[:4]:
        out.append(tile_image(n, g))
    return "\n          ".join(out)


def asset_rail():
    out = []
    for i, (n, l, d, hc) in enumerate(COLORS[:5]):
        sel = "true" if i == 0 else "false"
        out.append('<button type="button" role="tab" aria-selected="%s" data-i="%d">'
                   '<i style="background:%s"></i>%s</button>' % (sel, i, l, n))
    return "\n            ".join(out)


FOLDER_ICON = ('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
               'stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">'
               '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l1.8 2h9A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 '
               '19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>')
JSON_ICON = ('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
             'stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">'
             '<path d="M14 3H7a1.5 1.5 0 0 0-1.5 1.5v15A1.5 1.5 0 0 0 7 21h10a1.5 1.5 0 0 0 '
             '1.5-1.5V7.5z"/><path d="M14 3v4.5h4.5"/></svg>')


def catalog_items():
    """Every asset in the demo system, in catalog order."""
    out = [(n, "colorset") for n, _l, _d, _h in COLORS]
    out += [(n, "symbolset") for n, _k, _c in SYMBOLS]
    out += [(n, "imageset") for n, _g in IMAGES]
    return out


def finder_tree():
    """The catalog as macOS and the Xcode navigator actually present it:
    the same folder icon, over and over, telling you nothing."""
    rows = []
    for idx, (name, ext) in enumerate(catalog_items()):
        rows.append('<div class="fr">%s<span>%s.%s</span></div>' % (FOLDER_ICON, name, ext))
        if idx < 3:
            rows.append('<div class="fr child">%s<span>Contents.json</span></div>' % JSON_ICON)
    return "\n            ".join(rows)


# Assets really are previewed in Xcode; what it cannot do is show them across
# projects. So the "before" side is three separate catalogs, not a blind list.
PROJECTS = [
    ("Hydra.xcassets", [("c", 0), ("c", 1), ("c", 2), ("s", 0), ("s", 1), ("i", 0), ("i", 1)]),
    ("Resors.xcassets", [("c", 3), ("c", 4), ("c", 5), ("s", 2), ("s", 3), ("s", 4), ("i", 2), ("i", 3)]),
    ("Playground.xcassets", [("c", 6), ("c", 7), ("s", 5), ("s", 6), ("s", 7), ("s", 8), ("i", 4), ("i", 5)]),
]


def silo_projects():
    """Each project rendered the way Xcode's asset catalog lists it: a vertical
    run of rows, small preview then name."""
    out = []
    for title, items in PROJECTS:
        rows = []
        for kind, idx in items:
            if kind == "c":
                name = COLORS[idx][0]
                prev = '<span class="xc-sw" style="background:%s"></span>' % COLORS[idx][1]
            elif kind == "s":
                name, k, c = SYMBOLS[idx]
                prev = '<span class="xc-sw xc-sw--sym">%s</span>' % _glyph_plain(k, c)
            else:
                name, grad = IMAGES[idx]
                prev = '<span class="xc-sw" style="background:%s"></span>' % grad
            rows.append('<div class="xc-row">%s<span>%s</span></div>' % (prev, name))
        out.append('<div class="silo"><span class="silo-hd">%s</span>'
                   '<div class="xc-list">%s</div></div>' % (title, "".join(rows)))
    return "\n            ".join(out)


SIDE_ICONS = {
    "all": ('<rect x="3.2" y="3.2" width="7.6" height="7.6" rx="2"/>'
            '<rect x="13.2" y="3.2" width="7.6" height="7.6" rx="2"/>'
            '<rect x="3.2" y="13.2" width="7.6" height="7.6" rx="2"/>'
            '<rect x="13.2" y="13.2" width="7.6" height="7.6" rx="2"/>'),
    "color": ('<circle cx="12" cy="12" r="8.4"/>'
              '<path d="M12 3.6a8.4 8.4 0 0 0 0 16.8z" fill="currentColor" stroke="none"/>'),
    "symbol": '<path d="m12 3.7 2.5 5.2 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z"/>',
    "image": ('<rect x="3" y="5.2" width="18" height="13.6" rx="2.5"/>'
              '<circle cx="8.6" cy="10.2" r="1.4"/><path d="m4 17.4 4.6-4.6 3.4 3.4 3-3 5 4.2"/>'),
    "folder": ('<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l1.8 2h9A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 '
               '19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>'),
}


def side_icon(key):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
            % SIDE_ICONS[key])


def _slug(title):
    return title.split(".")[0].lower()


def _project_of():
    """Which custom group each asset sits in, mirroring the Xcode side."""
    out = {}
    for title, items in PROJECTS:
        for kind, idx in items:
            out[(kind, idx)] = _slug(title)
    return out


def rs_sidebar():
    rows = ['<span class="rs-sec">System Groups</span>']
    for f, icon, label in [("all", "all", "All Assets"), ("kind:color", "color", "Colors"),
                           ("kind:symbol", "symbol", "Symbols"), ("kind:image", "image", "Images")]:
        sel = "true" if f == "all" else "false"
        rows.append('<button type="button" class="rs-item" role="tab" aria-selected="%s" data-f="%s">'
                    '%s<span>%s</span></button>' % (sel, f, side_icon(icon), label))
    rows.append('<span class="rs-sec">Custom Groups</span>')
    for title, _items in PROJECTS:
        slug = _slug(title)
        rows.append('<button type="button" class="rs-item" role="tab" aria-selected="false" '
                    'data-f="proj:%s">%s<span>%s</span></button>'
                    % (slug, side_icon("folder"), slug.capitalize()))
    return "\n              ".join(rows)


def board_all():
    """The real asset card, kinds interleaved so the grid reads as one mixed
    system. Each card is tagged so the sidebar can filter it."""
    proj = _project_of()
    runs = []
    for kind, seq in (("color", COLORS), ("symbol", SYMBOLS), ("image", IMAGES)):
        run = []
        for i, item in enumerate(seq):
            attrs = ' data-kind="%s" data-proj="%s"' % (kind, proj[(kind[0], i)])
            if kind == "color":
                n, l, d, _h = item
                run.append(card_color(n, l, d, attrs=attrs))
            elif kind == "symbol":
                n, k, c = item
                run.append(card_symbol(n, k, c, attrs=attrs))
            else:
                n, g = item
                run.append(card_image(n, g, attrs=attrs))
        runs.append(run)
    mixed = []
    for i in range(max(len(r) for r in runs)):
        for run in runs:
            if i < len(run):
                mixed.append(run[i])
    return '<div class="rs-grid" id="rsGrid">%s</div>' % "".join(mixed)


# The same decision copied into every catalog that needs it, drifting as it
# goes. The near-identical hexes are the point.
DUPES = [
    ("Hydra.xcassets", "#0071E3"),
    ("Resors.xcassets", "#0071E3"),
    ("Playground.xcassets", "#0A72E4"),
    ("Widget.xcassets", "#0071E2"),
]


def dupe_rows():
    out = []
    for proj, hexv in DUPES:
        out.append('<div class="dupe-row">'
                   '<span class="dupe-sw" style="background:%s"></span>'
                   '<span class="dupe-name">AppTint</span>'
                   '<span class="dupe-hex">%s</span>'
                   '<span class="dupe-proj">%s</span></div>' % (hexv, hexv, proj))
    return "\n              ".join(out)


def fanout_groups():
    out = []
    for proj, _hex in DUPES:
        out.append('<span class="fan-chip">%s<span>%s</span></span>'
                   % (side_icon("folder"), proj.split(".")[0]))
    return "\n                  ".join(out)


def one_card():
    return card_color("AppTint", "#0071E3", "#2997FF")


PV_COLORS = COLORS[:5]
PV_SYMBOLS = SYMBOLS[:5]
PV_IMAGES = IMAGES[:5]

CHECK_SVG = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
             '<path d="m5 13 4 4L19 7"/></svg>')
SAMPLE_TEXT = "A quick brown fox jumps over the lazy dog"


def pv_types():
    out = []
    for i, (t, label) in enumerate([("color", "Colours"), ("symbol", "Symbols"), ("image", "Images")]):
        out.append('<button type="button" role="tab" aria-selected="%s" data-t="%s">%s</button>'
                   % ("true" if i == 0 else "false", t, label))
    return "\n            ".join(out)


def pv_rail(kind):
    seq = {"color": PV_COLORS, "symbol": PV_SYMBOLS, "image": PV_IMAGES}[kind]
    out = []
    for i, item in enumerate(seq):
        if kind == "color":
            name, chip = item[0], item[1]
        elif kind == "symbol":
            name, chip = item[0], item[2]
        else:
            name, chip = item[0], item[1]
        out.append('<button type="button" role="tab" aria-selected="%s" data-i="%d">'
                   '<i style="background:%s"></i>%s</button>'
                   % ("true" if i == 0 else "false", i, chip, name))
    return "\n              ".join(out)


def pv_set_color():
    """Text + Toggles against Buttons + Shapes: the two columns come out level,
    where Text alone left the left side half the height of the right."""
    return ('<div class="pv-set" data-t="color">\n'
            '            <div class="rail" data-rail="color" role="tablist" aria-label="Choose a colour">\n'
            '              ' + pv_rail("color") + '\n            </div>\n'
            '            <div class="pv-panel">\n'
            '              <div class="pv-col">\n'
            '                <span class="pv-sec">Text</span>\n'
            '                <div class="pv-box pv-text">\n'
            + "".join('                  <p class="s%d">%s</p>\n' % (n, SAMPLE_TEXT) for n in (1, 2, 5, 6))
            + '                </div>\n'
            '                <span class="pv-sec">Toggles</span>\n'
            '                <div class="pv-box pv-tog">\n'
            '                  <span class="pv-check">' + CHECK_SVG + '</span>\n'
            '                  <span class="pv-pill">Button Toggle</span>\n'
            '                  <span class="pv-switch"></span>\n'
            '                </div>\n              </div>\n'
            '              <div class="pv-col">\n'
            '                <span class="pv-sec">Buttons</span>\n'
            '                <div class="pv-box pv-btns">\n'
            + "".join('                  <span class="pv-btn pv-btn--%s">%sAction</span>\n' % (v, CHECK_SVG)
                      for v in ["plain", "tint", "fill", "out"])
            + '                </div>\n'
            '                <span class="pv-sec">Shapes</span>\n'
            '                <div class="pv-box pv-shapes">\n'
            + "".join('                  <span class="pv-shape pv-shape--%s%s"></span>\n' % (sh, o)
                      for o in ["", " pv-o"] for sh in ["sq", "rs", "ci", "cap"])
            + '                </div>\n              </div>\n'
            '            </div>\n          </div>')


def pv_set_symbol():
    g = '<i class="g" data-glyph></i>'
    return ('<div class="pv-set" data-t="symbol" hidden>\n'
            '            <div class="rail" data-rail="symbol" role="tablist" aria-label="Choose a symbol">\n'
            '              ' + pv_rail("symbol") + '\n            </div>\n'
            '            <div class="pv-panel">\n'
            '              <div class="pv-col">\n'
            '                <span class="pv-sec">In Context</span>\n'
            '                <div class="pv-box pv-ctx">\n'
            '                  <div class="ctx-bar">' + g + '<b>Title</b>' + g + '</div>\n'
            '                  <div class="ctx-row">' + g + '<span><b>Menu Item</b><em>Supporting detail</em></span><span class="chev">&rsaquo;</span></div>\n'
            '                  <div class="ctx-card"><i class="g g--lg" data-glyph></i><span><b>Card Title</b><em>A short supporting description.</em></span></div>\n'
            '                </div>\n              </div>\n'
            '              <div class="pv-col">\n'
            '                <span class="pv-sec">Scale</span>\n'
            '                <div class="pv-box pv-sizes">\n'
            + "".join('                  <i class="g g--%s" data-glyph></i>\n' % z
                      for z in ["s", "m", "l", "xl"])
            + '                </div>\n'
            '                <span class="pv-sec">Buttons</span>\n'
            '                <div class="pv-box pv-btns">\n'
            '                  <span class="pv-btn pv-btn--tint pv-btn--icon">' + g + '</span>\n'
            '                  <span class="pv-btn pv-btn--fill pv-btn--icon">' + g + '</span>\n'
            '                  <span class="pv-btn pv-btn--plain pv-btn--icon">' + g + '</span>\n'
            '                  <span class="pv-btn pv-btn--fill">' + g + 'Action</span>\n'
            '                </div>\n              </div>\n'
            '            </div>\n          </div>')


def pv_set_image():
    return ('<div class="pv-set" data-t="image" hidden>\n'
            '            <div class="rail" data-rail="image" role="tablist" aria-label="Choose an image">\n'
            '              ' + pv_rail("image") + '\n            </div>\n'
            '            <div class="pv-panel">\n'
            '              <div class="pv-col">\n'
            '                <span class="pv-sec">Preview</span>\n'
            '                <div class="pv-box"><span class="img-lg" data-art></span></div>\n'
            '              </div>\n'
            '              <div class="pv-col">\n'
            '                <span class="pv-sec">In Context</span>\n'
            '                <div class="pv-box pv-ctx">\n'
            '                  <div class="ctx-row"><span class="img-th" data-art></span><span><b>List Item</b><em>Supporting detail</em></span><span class="chev">&rsaquo;</span></div>\n'
            '                  <div class="ctx-card ctx-card--img"><span class="img-md" data-art></span><b>Card Title</b><em>A short supporting description that sits beneath the image.</em></div>\n'
            '                </div>\n              </div>\n'
            '            </div>\n          </div>')


# One group, and the projects that pull from it. Names match the catalogs
# used in stages 01 and 02 so the page describes a single set of projects.
REUSE_PROJECTS = ["Hydra.app", "Resors.app", "Playground.app"]


def lib_cards():
    """Six assets, all three kinds, in the same card used everywhere else."""
    out = [card_color(n, l, d) for n, l, d, _h in COLORS[:3]]
    out += [card_symbol(n, k, c) for n, k, c in SYMBOLS[:2]]
    out += [card_image(IMAGES[0][0], IMAGES[0][1])]
    return "\n              ".join(out)


def reuse_projects():
    chips = "".join('<i style="background:%s"></i>' % c[1] for c in COLORS[:3])
    chips += "".join('<i style="background:%s"></i>' % g for _n, g in IMAGES[:1])
    out = []
    for name in REUSE_PROJECTS:
        out.append('<div class="proj"><b>%s</b><span class="proj-dots">%s</span>'
                   '<em>6 assets from Studio Core</em></div>' % (name, chips))
    return "\n            ".join(out)


CSS = r"""
    :root {
      color-scheme: light dark;
      --paper:   #f2f0ea;
      --paper-2: #e8e5dc;
      --panel:   #fbfaf7;
      --ink:     #111114;
      --ink2:    #57554e;
      --ink3:    #8c8981;
      --rule:    rgba(0,0,0,0.16);
      --rule-2:  rgba(0,0,0,0.09);
      --night:   #0c0c10;
      --night-2: #15151b;
      --accent:  #0071e3;
      --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
      --sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
      --maxw: 1200px;
      --shadow: 0 1px 2px rgba(0,0,0,0.05), 0 14px 36px rgba(0,0,0,0.09);
      --shadow-lg: 0 2px 8px rgba(0,0,0,0.07), 0 34px 80px rgba(0,0,0,0.17);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --paper:   #0c0c10;
        --paper-2: #141419;
        --panel:   #16161c;
        --ink:     #f4f3f0;
        --ink2:    #a5a29b;
        --ink3:    #7c7a74;
        --rule:    rgba(255,255,255,0.18);
        --rule-2:  rgba(255,255,255,0.10);
        --accent:  #2997ff;
        --shadow: 0 1px 2px rgba(0,0,0,0.6), 0 14px 36px rgba(0,0,0,0.6);
        --shadow-lg: 0 2px 8px rgba(0,0,0,0.6), 0 34px 80px rgba(0,0,0,0.7);
      }
    }

    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
    body {
      margin: 0; background: var(--paper); color: var(--ink);
      font-family: var(--sans); line-height: 1.5;
      -webkit-font-smoothing: antialiased; overflow-x: hidden;
    }
    .wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
    @media (max-width: 600px) { .wrap { padding: 0 20px; } }

    /* ---------- type ---------- */
    h1, h2, h3 { margin: 0; font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; }
    h1 { font-size: clamp(2.9rem, 8.2vw, 6.4rem); }
    h2 { font-size: clamp(2.1rem, 5.2vw, 3.6rem); }
    h3 { font-size: 1.02rem; font-weight: 600; letter-spacing: -0.012em; line-height: 1.3; }
    .lede { font-size: clamp(1.02rem, 1.7vw, 1.22rem); color: var(--ink2); line-height: 1.55; max-width: 56ch; }
    code { font-family: var(--mono); font-size: 0.88em; }

    /* ---------- stage headers (spec-sheet rules) ---------- */
    .stage-head {
      display: flex; align-items: center; gap: 14px;
      font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.16em;
      text-transform: uppercase; color: var(--ink3); margin-bottom: 1.8rem;
    }
    .stage-head .num { color: var(--ink); font-weight: 600; }
    .stage-head .line { flex: 1; height: 1px; background: var(--rule); }
    section.stage { padding: 7rem 0; border-top: 1px solid var(--rule-2); }
    section.stage:first-of-type { border-top: 0; }
    .stage-copy { max-width: 62ch; }
    .stage-copy .lede { margin: 1.2rem 0 0; }

    /* ---------- nav ---------- */
    /* The bar has no edge: two stacked backdrop layers, each masked with a
       gradient, so the blur and the paper tint both fall off to nothing below
       the links instead of ending on a line. Fallback is a plain tint. */
    .nav { position: sticky; top: 0; z-index: 60;
           background: color-mix(in srgb, var(--paper) 94%, transparent); }
    @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
      .nav { background: transparent; }
      .nav::before, .nav::after {
        content: ""; position: absolute; left: 0; right: 0; top: 0; bottom: -34px;
        pointer-events: none; z-index: -1;
        opacity: 0; transition: opacity 0.3s ease;
      }
      /* tighter, stronger blur nearest the top */
      .nav::before {
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 55%, transparent 88%);
        mask-image: linear-gradient(to bottom, #000 0%, #000 55%, transparent 88%);
      }
      /* softer blur plus the paper wash, carried further down and faded out */
      .nav::after {
        backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        background: linear-gradient(to bottom,
          color-mix(in srgb, var(--paper) 96%, transparent) 0%,
          color-mix(in srgb, var(--paper) 90%, transparent) 62%,
          transparent 100%);
        -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
        mask-image: linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%);
      }
      .nav.stuck::before, .nav.stuck::after { opacity: 1; }
    }
    @media (prefers-reduced-motion: reduce) {
      .nav::before, .nav::after { transition: none; }
    }
    .nav-in { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; height: 56px; display: flex; align-items: center; gap: 24px; }
    .nav-brand { display: flex; align-items: center; gap: 9px; color: var(--ink); text-decoration: none;
                 font-weight: 600; font-size: 0.95rem; letter-spacing: -0.02em; margin-right: auto; }
    .nav-brand img { width: 22px; height: 22px; border-radius: 6px; }
    .nav-links { display: flex; gap: 22px; align-items: center; }
    .nav-links a { font-family: var(--mono); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
                   color: var(--ink2); text-decoration: none; }
    .nav-links a:hover { color: var(--ink); }
    @media (max-width: 820px) { .nav-links { display: none; } }
    .nav-cta { font-size: 0.8rem; font-weight: 500; padding: 0.42rem 1rem; border-radius: 980px;
               background: var(--ink); color: var(--paper); text-decoration: none; }

    /* ---------- buttons ---------- */
    a.button { display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;
      font-family: inherit; font-weight: 500; font-size: 0.96rem; padding: 0.8rem 1.5rem;
      border-radius: 980px; border: 1px solid transparent; background: var(--ink); color: var(--paper);
      transition: opacity 0.18s ease; }
    a.button:hover { opacity: 0.85; }
    a.button.ghost { background: transparent; color: var(--ink); border-color: var(--rule); }
    a.button.ghost:hover { background: var(--paper-2); opacity: 1; }
    a.button.appstore { background: #000; color: #fff; padding: 0.55rem 1.3rem; }
    @media (prefers-color-scheme: dark) { a.button.appstore { background: #fff; color: #000; } }
    a.button.appstore .apple { width: 24px; height: 24px; flex-shrink: 0; }
    .as-txt { display: flex; flex-direction: column; line-height: 1; text-align: left; }
    .as-txt small { font-size: 0.6rem; opacity: 0.85; }
    .as-txt b { font-size: 1.08rem; font-weight: 500; margin-top: 3px; letter-spacing: -0.01em; }
    .cta-row { display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: center; }

    /* ---------- hero ---------- */
    .hero { padding: 5.5rem 0 3.5rem; }
    .hero h1 .dim { color: var(--ink3); }
    .hero .lede { margin: 1.8rem 0 2.2rem; }
    .hero-meta { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.06em; color: var(--ink3); margin: 1.6rem 0 0; }

    /* ---------- asset card, 1:1 with AssetGridItem.swift ----------
       AssetGridLayout: width 140, height 230. Card clipped to cornerRadius 32.
       ColorAssetGridItem: swatch 140x140 (aspectRatio 1, frame height 140),
       clipped to cornerRadius 32, full-bleed; Spacer; a 72pt title block with
       .padding(.horizontal) = 16 and VStack spacing 8; Spacer.
       Every length below is that value as a percent of the 140pt width. */
    .asset { container-type: inline-size; }
    .asset-card {
      --card-bg: #ffffff;
      --card-ink: #0b0b0c;
      aspect-ratio: 140 / 230;
      border-radius: 22.857cqw;              /* 32 / 140 */
      text-align: left;                      /* the name is leading-aligned, whatever contains it */
      background: var(--card-bg);
      box-shadow: 0 0.7cqw 2cqw rgba(0,0,0,0.07), 0 3cqw 8cqw rgba(0,0,0,0.07);
      display: flex; flex-direction: column; overflow: hidden;
    }
    @media (prefers-color-scheme: dark) {
      .asset-card { --card-bg: #1e1e22; --card-ink: #f5f5f7;
                    box-shadow: 0 0.7cqw 2cqw rgba(0,0,0,0.5), 0 3cqw 8cqw rgba(0,0,0,0.45); }
    }

    /* colour swatch: full width, square, same 32pt radius as the card */
    .asset-sw {
      width: 100%; height: 100cqw; flex: none;
      border-radius: 22.857cqw;
      background: var(--l);
    }
    @media (prefers-color-scheme: dark) { .asset-sw { background: var(--d, var(--l)); } }

    /* symbol and image previews sit straight on the card, no fill behind them */
    .asset-art { height: 100cqw; flex: none; display: grid; place-items: center; }
    .asset-art--sym { padding: 22.857cqw; }        /* .padding(32) */
    .asset-art--img { padding: 11.429cqw; }        /* .padding()   */
    .asset-art svg { width: 100%; height: 100%; display: block; }
    .asset-art .art { display: block; width: 100%; aspect-ratio: 1; }

    /* the 72pt title block, vertically centred between the two Spacers */
    .asset-body {
      height: 51.429cqw;                     /* 72 / 140 */
      margin-top: 6.429cqw;                  /* Spacer: (230 - 140 - 72) / 2 */
      padding: 0 11.429cqw;                  /* .padding(.horizontal) = 16 */
      display: flex; flex-direction: column; justify-content: center;
      gap: 5.714cqw;                         /* VStack spacing 8 */
    }
    .asset-name {
      font-weight: 700;                      /* .fontWeight(.bold) */
      font-size: 9.286cqw;                   /* .body = 13pt */
      line-height: 1.25; letter-spacing: -0.01em;
      color: var(--card-ink);
      display: -webkit-box; -webkit-box-orient: vertical;
      -webkit-line-clamp: 2; overflow: hidden;   /* .lineLimit(2) */
    }
    .asset-appear { display: flex; gap: 5.714cqw; color: var(--card-ink);
                    flex-wrap: nowrap; }
    .asset-appear svg { width: 7.143cqw; height: 7.143cqw; display: block; }

    /* ---------- the system board ---------- */
    /* Infinite marquee. The track holds two identical sets and each set carries
       its own trailing gap, so one set is exactly half the track and a -50%
       translate lands on a pixel-identical frame with no visible seam. */
    /* overflow:hidden clips the marquee horizontally, so the box needs room
       underneath the cards or their drop shadow gets sliced off flat. */
    .strip { width: 100vw; margin-left: calc(50% - 50vw); overflow: hidden; padding: 3.5rem 0 1.75rem; }
    .strip-track { display: flex; width: max-content; animation: marquee 55s linear infinite; }
    .strip:hover .strip-track { animation-play-state: paused; }
    .strip-set { display: flex; gap: 24px; padding-right: 24px; }
    .strip-set .asset { width: 140px; }
    @keyframes marquee {
      from { transform: translate3d(0, 0, 0); }
      to { transform: translate3d(-50%, 0, 0); }
    }
    @media (prefers-reduced-motion: reduce) { .strip-track { animation: none; } }

    /* ---------- the catalog, both ways ---------- */
    .compare { display: grid; grid-template-columns: 1fr 1.3fr; gap: 20px; align-items: stretch; margin-top: 2.8rem; }
    @media (max-width: 940px) { .compare { grid-template-columns: 1fr; } }
    .pane { border: 1px solid var(--rule-2); border-radius: 14px; background: var(--panel);
            overflow: hidden; display: flex; flex-direction: column; }
    .pane-hd { display: flex; justify-content: space-between; gap: 12px; padding: 0.62rem 0.9rem;
               border-bottom: 1px solid var(--rule-2); font-family: var(--mono); font-size: 0.64rem;
               letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink3); }
    .silos { flex: 1 1 0; min-height: 520px; display: flex; flex-direction: column;
             gap: 10px; padding: 12px; }
    .silo { --xc-bg: #ffffff;
            flex: 1; border: 1px solid var(--rule-2); border-radius: 10px; overflow: hidden;
            display: flex; flex-direction: column; background: var(--xc-bg); }
    @media (prefers-color-scheme: dark) { .silo { --xc-bg: #1c1c1e; } }
    .silo-hd { padding: 6px 10px; border-bottom: 1px solid var(--rule-2);
               font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.08em;
               text-transform: uppercase; color: var(--ink3); }
    /* an Xcode asset-catalog list: preview, name, one selected row */
    .xc-list { flex: 1; position: relative; overflow: hidden; padding: 4px 0; }
    .xc-list::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 26px;
                      background: linear-gradient(to bottom, transparent, var(--xc-bg)); pointer-events: none; }
    .xc-row { display: flex; align-items: center; gap: 7px; padding: 2px 9px;
              font-size: 11.5px; line-height: 1.5; color: var(--ink); white-space: nowrap; }
    .xc-sw { width: 15px; height: 15px; border-radius: 4px; flex: none; }
    .xc-sw--sym { display: grid; place-items: center; }
    .xc-sw--sym svg { width: 11px; height: 11px; }
    /* the Resors pane: grouped runs of the real card */
    .rs-main { flex: 1 1 0; display: flex; min-height: 0; }
    .rs-side { width: 134px; flex: none; border-right: 1px solid var(--rule-2);
               padding: 10px 7px; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
    .rs-sec { font-family: var(--mono); font-size: 0.53rem; letter-spacing: 0.1em;
              text-transform: uppercase; color: var(--ink3); margin: 9px 7px 5px; }
    .rs-sec:first-child { margin-top: 2px; }
    .rs-item { display: flex; align-items: center; gap: 7px; width: 100%; text-align: left;
               padding: 4px 7px; border: 0; border-radius: 6px; background: none; cursor: pointer;
               font-family: inherit; font-size: 11.5px; line-height: 1.5; color: var(--ink2);
               transition: background 0.18s ease, color 0.18s ease; }
    .rs-item svg { width: 12px; height: 12px; flex: none; opacity: 0.85; }
    .rs-item:hover { color: var(--ink); }
    .rs-item[aria-selected="true"] { background: var(--rule-2); color: var(--ink); font-weight: 500; }
    .rs-body { flex: 1 1 0; position: relative; overflow: hidden; padding: 13px 13px 0; }
    .rs-body::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 46px;
                      background: linear-gradient(to bottom, transparent, var(--panel)); pointer-events: none; }
    .rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
    /* filtering: leavers fade first, then the survivors are FLIPped into place */
    .rs-grid .asset.is-out { display: none; }
    .rs-grid .asset.is-fading { opacity: 0; transform: scale(0.93);
                                transition: opacity 0.17s ease, transform 0.17s ease; }

    /* ---------- preview panel: the asset on real controls ---------- */
    .pv { margin-top: 2.2rem; }
    /* each set resolves its own accent, since the rails write --pv-l/--pv-d
       onto the set rather than onto .pv */
    .pv-set { --pv: var(--pv-l, #E08A2C); }
    @media (prefers-color-scheme: dark) { .pv-set { --pv: var(--pv-d, var(--pv-l, #E08A2C)); } }

    .pv-types { display: flex; gap: 6px; margin: 0 0 1.1rem;
                border: 1px solid var(--rule-2); border-radius: 10px; padding: 3px; width: fit-content; }
    .pv-types button { border: 0; background: none; cursor: pointer; font: inherit;
                       font-size: 12.5px; padding: 5px 14px; border-radius: 7px;
                       color: var(--ink2); transition: background 0.18s ease, color 0.18s ease; }
    .pv-types button[aria-selected="true"] { background: var(--ink); color: var(--paper); }
    .pv-set[hidden] { display: none; }

    /* symbol and image previews sit in rows and cards, as the app shows them */
    .pv-ctx { display: flex; flex-direction: column; gap: 10px; }
    .ctx-bar, .ctx-row, .ctx-card { background: var(--panel); border: 1px solid var(--rule-2);
                                    border-radius: 10px; }
    .ctx-bar { display: flex; align-items: center; justify-content: space-between;
               padding: 9px 13px; font-size: 12.5px; font-weight: 600; }
    .ctx-row { display: flex; align-items: center; gap: 11px; padding: 11px 13px; }
    .ctx-row b, .ctx-card b { display: block; font-size: 12.5px; font-weight: 600; }
    .ctx-row em, .ctx-card em { display: block; font-style: normal; font-size: 11.5px; color: var(--ink3); }
    .chev { margin-left: auto; color: var(--ink3); font-size: 16px; line-height: 1; }
    .ctx-card { padding: 14px 13px; display: flex; gap: 13px; align-items: center; }
    .ctx-card--img { display: block; }
    .g { display: block; flex: none; color: var(--pv); }
    /* on a filled button the glyph is knocked out, not tinted */
    .pv-btn--fill .g { color: #fff; }
    .g svg { width: 18px; height: 18px; display: block; }
    .g--lg svg { width: 32px; height: 32px; }
    .pv-btn--icon { padding: 7px 10px; }
    .pv-sizes { display: flex; align-items: flex-end; gap: 18px; }
    .g--s svg { width: 15px; height: 15px; }
    .g--m svg { width: 22px; height: 22px; }
    .g--l svg { width: 32px; height: 32px; }
    .g--xl svg { width: 46px; height: 46px; }

    .img-lg { display: block; width: 100%; aspect-ratio: 16 / 10; border-radius: 8px; }
    .img-md { display: block; width: 100%; aspect-ratio: 16 / 7; border-radius: 8px; margin-bottom: 11px; }
    .img-th { display: block; width: 42px; height: 42px; border-radius: 7px; flex: none; }

    .pv-panel { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
    @media (max-width: 820px) { .pv-panel { grid-template-columns: 1fr; } }
    .pv-col { display: flex; flex-direction: column; }
    .pv-sec { display: block; font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em;
              text-transform: uppercase; color: var(--ink3); margin: 0 0 8px; }
    .pv-sec:not(:first-child) { margin-top: 18px; }
    .pv-box { background: var(--bg-alt); border: 1px solid var(--rule-2);
              border-radius: 12px; padding: 16px; }

    /* type at the sizes and faces a UI actually uses */
    .pv-text p { margin: 0 0 10px; color: var(--pv); line-height: 1.3; }
    .pv-text p:last-child { margin-bottom: 0; }
    .pv-text .s1 { font-size: 13px; font-weight: 400; }
    .pv-text .s2 { font-size: 23px; font-weight: 700; letter-spacing: -0.02em; }
    .pv-text .s5 { font-family: var(--mono); font-size: 12.5px; }
    .pv-text .s6 { font-family: var(--mono); font-size: 21px; }

    .pv-btns { display: flex; flex-wrap: wrap; gap: 9px; align-items: center; }
    .pv-btn { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px;
              font-weight: 500; padding: 7px 13px; border-radius: 999px;
              border: 1.5px solid transparent; }
    .pv-btn svg { width: 13px; height: 13px; flex: none; }
    .pv-btn--plain { color: var(--pv); }
    .pv-btn--tint { background: color-mix(in srgb, var(--pv) 15%, transparent); color: var(--pv); }
    .pv-btn--fill { background: var(--pv); color: #fff; }
    .pv-btn--out { border-color: var(--pv); color: var(--pv); }

    .pv-tog { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .pv-check { width: 21px; height: 21px; border-radius: 6px; background: var(--pv);
                display: grid; place-items: center; color: #fff; flex: none; }
    .pv-check svg { width: 13px; height: 13px; }
    .pv-pill { background: color-mix(in srgb, var(--pv) 15%, transparent); color: var(--pv);
               padding: 6px 13px; border-radius: 8px; font-size: 12.5px; font-weight: 500; }
    .pv-switch { width: 44px; height: 26px; border-radius: 999px; background: var(--pv);
                 position: relative; flex: none; }
    .pv-switch::after { content: ""; position: absolute; top: 3px; right: 3px;
                        width: 20px; height: 20px; border-radius: 50%; background: #fff; }

    .pv-shapes { display: grid; grid-template-columns: 54px 54px 54px minmax(0, 1fr); gap: 11px; }
    .pv-shape { height: 54px; background: var(--pv); }
    .pv-shape--sq { border-radius: 0; }
    .pv-shape--rs { border-radius: 14px; }
    .pv-shape--ci { border-radius: 50%; }
    .pv-shape--cap { border-radius: 999px; }
    .pv-o { background: none; border: 3px solid var(--pv); }

    /* ---------- the catalog, both ways ---------- */
    .compare { display: grid; grid-template-columns: 1fr 1.3fr; gap: 20px; align-items: stretch; margin-top: 2.8rem; }
    @media (max-width: 940px) { .compare { grid-template-columns: 1fr; } }
    .pane { border: 1px solid var(--rule-2); border-radius: 14px; background: var(--panel);
            overflow: hidden; display: flex; flex-direction: column; }
    .pane-hd { display: flex; justify-content: space-between; gap: 12px; padding: 0.62rem 0.9rem;
               border-bottom: 1px solid var(--rule-2); font-family: var(--mono); font-size: 0.64rem;
               letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink3); }
    .silos { flex: 1 1 0; min-height: 520px; display: flex; flex-direction: column;
             gap: 10px; padding: 12px; }
    .silo { --xc-bg: #ffffff;
            flex: 1; border: 1px solid var(--rule-2); border-radius: 10px; overflow: hidden;
            display: flex; flex-direction: column; background: var(--xc-bg); }
    @media (prefers-color-scheme: dark) { .silo { --xc-bg: #1c1c1e; } }
    .silo-hd { padding: 6px 10px; border-bottom: 1px solid var(--rule-2);
               font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.08em;
               text-transform: uppercase; color: var(--ink3); }
    /* an Xcode asset-catalog list: preview, name, one selected row */
    .xc-list { flex: 1; position: relative; overflow: hidden; padding: 4px 0; }
    .xc-list::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 26px;
                      background: linear-gradient(to bottom, transparent, var(--xc-bg)); pointer-events: none; }
    .xc-row { display: flex; align-items: center; gap: 7px; padding: 2px 9px;
              font-size: 11.5px; line-height: 1.5; color: var(--ink); white-space: nowrap; }
    .xc-sw { width: 15px; height: 15px; border-radius: 4px; flex: none; }
    .xc-sw--sym { display: grid; place-items: center; }
    .xc-sw--sym svg { width: 11px; height: 11px; }
    /* the Resors pane: grouped runs of the real card */
    .rs-main { flex: 1 1 0; display: flex; min-height: 0; }
    .rs-side { width: 134px; flex: none; border-right: 1px solid var(--rule-2);
               padding: 10px 7px; display: flex; flex-direction: column; gap: 1px; overflow: hidden; }
    .rs-sec { font-family: var(--mono); font-size: 0.53rem; letter-spacing: 0.1em;
              text-transform: uppercase; color: var(--ink3); margin: 9px 7px 5px; }
    .rs-sec:first-child { margin-top: 2px; }
    .rs-item { display: flex; align-items: center; gap: 7px; width: 100%; text-align: left;
               padding: 4px 7px; border: 0; border-radius: 6px; background: none; cursor: pointer;
               font-family: inherit; font-size: 11.5px; line-height: 1.5; color: var(--ink2);
               transition: background 0.18s ease, color 0.18s ease; }
    .rs-item svg { width: 12px; height: 12px; flex: none; opacity: 0.85; }
    .rs-item:hover { color: var(--ink); }
    .rs-item[aria-selected="true"] { background: var(--rule-2); color: var(--ink); font-weight: 500; }
    .rs-body { flex: 1 1 0; position: relative; overflow: hidden; padding: 13px 13px 0; }
    .rs-body::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 46px;
                      background: linear-gradient(to bottom, transparent, var(--panel)); pointer-events: none; }
    .rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 10px; }
    /* filtering: leavers fade first, then the survivors are FLIPped into place */
    .rs-grid .asset.is-out { display: none; }
    .rs-grid .asset.is-fading { opacity: 0; transform: scale(0.93);
                                transition: opacity 0.17s ease, transform 0.17s ease; }
    .rail { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 1.5rem; }
    .rail button {
      display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer;
      padding: 0.36rem 0.8rem 0.36rem 0.42rem; border-radius: 999px;
      border: 1px solid var(--rule); background: transparent; color: var(--ink2);
      font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.05em;
    }
    .rail button i { width: 14px; height: 14px; border-radius: 4px; display: block; }
    .rail button[aria-selected="true"] { background: var(--ink); color: var(--paper); border-color: var(--ink); }

    /* ---------- one asset vs one per catalog ---------- */
    .dupe { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: stretch; margin-top: 2.8rem; }
    @media (max-width: 900px) { .dupe { grid-template-columns: 1fr; } }
    .dupe-body { flex: 1 1 0; padding: 14px; display: flex; flex-direction: column; }
    .dupe-row { display: flex; align-items: center; gap: 10px; padding: 9px 10px;
                border: 1px solid var(--rule-2); border-radius: 9px; margin-bottom: 8px; }
    .dupe-sw { width: 24px; height: 24px; border-radius: 6px; flex: none; }
    .dupe-name { font-size: 12.5px; font-weight: 600; letter-spacing: -0.01em; }
    .dupe-hex { font-family: var(--mono); font-size: 11px; color: var(--ink2); }
    .dupe-proj { font-family: var(--mono); font-size: 10px; color: var(--ink3); margin-left: auto; }
    .dupe-body .note { margin: auto 0 0; padding-top: 12px; font-size: 0.86rem; color: var(--ink2); }

    .dupe-body--one { align-items: center; text-align: center; }
    .one-asset { width: 132px; margin: 6px auto 0; }
    .fanout { width: 100%; margin-top: 14px; }
    .fan-line { display: block; width: 1px; height: 18px; background: var(--rule); margin: 0 auto; }
    .fan-label { display: block; margin-top: 9px; font-family: var(--mono); font-size: 10px;
                 letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink3); }
    .fan-label .plus { color: var(--accent); text-transform: none; letter-spacing: 0; }
    .fan-groups { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-top: 11px; }
    .fan-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px;
                border: 1px solid var(--rule-2); border-radius: 999px;
                font-family: var(--mono); font-size: 10px; color: var(--ink2); }
    .fan-chip svg { width: 11px; height: 11px; flex: none; opacity: 0.8; }
    .dupe-body--one .note { text-align: left; }

    /* ---------- symbol guides: margins and scale ---------- */
    .sym { margin-top: 3.4rem; padding-top: 2.6rem; border-top: 1px solid var(--rule-2);
           display: grid; grid-template-columns: 1fr 0.66fr; gap: 34px; align-items: center; }
    @media (max-width: 860px) { .sym { grid-template-columns: 1fr; gap: 26px; } }
    .sym-copy { max-width: 60ch; }
    .sym-copy h3 { font-size: 1.3rem; letter-spacing: -0.02em; }
    .sym-copy p { color: var(--ink2); font-size: 1rem; margin: 0.8rem 0 0; }
    .sym-shot { display: block; border: 1px solid var(--rule-2); border-radius: 14px;
                overflow: hidden; background: var(--panel); }
    .sym-shot img { display: block; width: 100%; height: auto;
                    aspect-ratio: var(--ar); object-fit: cover; }
    .sym-points { list-style: none; margin: 1.8rem 0 0; padding: 0; }
    .sym-points li { padding: 1.1rem 0; border-top: 1px solid var(--rule-2); }
    .sym-points li:first-child { border-top: 0; padding-top: 0; }
    .sym-points b { display: block; font-size: 1rem; font-weight: 600;
                    letter-spacing: -0.012em; margin-bottom: 0.35rem; }
    .sym-points span { display: block; color: var(--ink2); font-size: 0.92rem;
                       line-height: 1.55; }

    /* ---------- reuse: one group, three projects ---------- */
    .reuse { margin-top: 2.6rem; }
    .lib { border: 1px solid var(--rule-2); border-radius: 14px; background: var(--panel); padding: 16px; }
    .lib-cap { display: block; font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em;
               text-transform: uppercase; color: var(--ink3); margin-bottom: 13px; }
    .lib-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 13px; }
    @media (max-width: 820px) { .lib-grid { grid-template-columns: repeat(3, 1fr); } }

    .reuse-flow { display: flex; align-items: center; gap: 14px; padding: 18px 0; }
    .reuse-line { flex: 1; height: 1px; background: var(--rule); }
    .reuse-label { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.12em;
                   text-transform: uppercase; color: var(--ink3); }

    .proj-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    @media (max-width: 700px) { .proj-row { grid-template-columns: 1fr; } }
    .proj { border: 1px solid var(--rule-2); border-radius: 12px; background: var(--panel); padding: 14px 15px; }
    .proj b { display: block; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
    .proj-dots { display: flex; gap: 5px; margin: 11px 0 9px; }
    .proj-dots i { width: 17px; height: 17px; border-radius: 5px; display: block; }
    .proj em { font-style: normal; font-size: 11.5px; color: var(--ink3); font-family: var(--mono); }

    /* ---------- ship ---------- */
    .ship { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 860px) { .ship { grid-template-columns: 1fr; } }
    .ship-card { border: 1px solid var(--rule-2); border-radius: 14px; padding: 1.6rem; background: var(--panel); }
    .ship-card .cap { font-family: var(--mono); font-size: 0.64rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink3); }
    .ship-card h3 { margin: 0.7rem 0 0.5rem; font-size: 1.15rem; }
    .ship-card p { margin: 0; color: var(--ink2); font-size: 0.92rem; }
    .ship-card .plus { display: inline-block; font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.06em;
                       border: 1px solid var(--accent); color: var(--accent); border-radius: 999px; padding: 0.1rem 0.45rem; margin-left: 0.4rem; }
    .flow { display: flex; align-items: center; gap: 10px; margin-top: 1.3rem; font-family: var(--mono); font-size: 0.68rem; color: var(--ink3); }
    .flow span.b { border: 1px solid var(--rule); border-radius: 7px; padding: 0.3rem 0.6rem; color: var(--ink); }
    .flow .ar { flex: 1; height: 1px; background: var(--rule); position: relative; }

    /* ---------- screenshots ---------- */
    .shots { display: grid; gap: 5rem; }
    .shot { opacity: 0; transform: translateY(18px); }
    .shot.in { opacity: 1; transform: none; }
    .plate { border-radius: 14px; overflow: hidden; border: 1px solid var(--rule-2); box-shadow: var(--shadow-lg); background: #141119; }
    .plate .chrome { height: 30px; display: flex; align-items: center; gap: 7px; padding: 0 12px; background: #1b1722; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .plate .chrome i { width: 10px; height: 10px; border-radius: 50%; display: block; }
    .crop { position: relative; aspect-ratio: 1468 / 868; overflow: hidden; line-height: 0; background: #0d0b12; }
    .crop img { position: absolute; top: -7.604%; left: -4.496%; width: 108.99%; height: 115.21%; display: block; }
    .shot-cap { display: flex; gap: 18px; align-items: baseline; margin-top: 1.2rem; }
    .shot-cap .n { font-family: var(--mono); font-size: 0.68rem; color: var(--ink3); letter-spacing: 0.1em; flex-shrink: 0; }
    .shot-cap p { margin: 0.3rem 0 0; color: var(--ink2); font-size: 0.94rem; max-width: 62ch; }

    /* ---------- pricing ---------- */
    .plans { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid var(--rule); border-radius: 16px; overflow: hidden; }
    @media (max-width: 760px) { .plans { grid-template-columns: 1fr; } }
    .plan { padding: 2rem; }
    .plan + .plan { border-left: 1px solid var(--rule); }
    @media (max-width: 760px) { .plan + .plan { border-left: 0; border-top: 1px solid var(--rule); } }
    .plan .pn { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink3); }
    .plan .pp { font-size: 2.4rem; font-weight: 700; letter-spacing: -0.035em; margin: 0.6rem 0 0.2rem; }
    .plan .ps { color: var(--ink3); font-size: 0.84rem; margin-bottom: 1.5rem; }
    .plan ul { list-style: none; margin: 0 0 1.8rem; padding: 0; display: grid; gap: 0.65rem; }
    .plan li { display: flex; gap: 0.6rem; font-size: 0.9rem; color: var(--ink2); }
    .plan li svg { flex-shrink: 0; margin-top: 4px; }
    .plan.hi { background: var(--paper-2); }

    /* ---------- close ---------- */
    .close { padding: 8rem 0; text-align: center; border-top: 1px solid var(--rule-2); }
    .close h2 { max-width: 18ch; margin: 0 auto 1.4rem; }
    .close .cta-row { justify-content: center; }
    footer { padding: 2.5rem 0 4rem; font-family: var(--mono); font-size: 0.68rem; letter-spacing: 0.06em;
             color: var(--ink3); display: flex; gap: 18px; flex-wrap: wrap; justify-content: center; }
    footer a { color: var(--ink2); text-decoration: none; }
    footer a:hover { color: var(--ink); }
    .skip-link { position: absolute; left: -9999px; top: 0; z-index: 100; background: var(--ink); color: var(--paper); padding: 10px 16px; }
    .skip-link:focus { left: 0; }
"""

APPLE = ('<svg class="apple" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 '
         '12.94c-.02-2.16 1.76-3.2 1.84-3.25-1-1.47-2.56-1.67-3.12-1.69-1.33-.13-2.59.78-3.26.78-.67 0-1.71'
         '-.76-2.81-.74-1.45.02-2.79.84-3.53 2.14-1.5 2.61-.38 6.47 1.08 8.59.71 1.04 1.56 2.2 2.67 2.16 '
         '1.07-.04 1.48-.69 2.77-.69 1.29 0 1.66.69 2.79.67 1.15-.02 1.88-1.05 2.59-2.09.81-1.2 1.15-2.36 '
         '1.17-2.42-.03-.01-2.24-.86-2.26-3.42zM14.9 6.66c.59-.72.99-1.71.88-2.7-.85.03-1.88.57-2.49 1.28-.55'
         '.63-1.03 1.64-.9 2.61.95.07 1.92-.48 2.51-1.19z"/></svg>')
STORE = ('<a class="button appstore" href="https://apps.apple.com/app/resors/id6748361802" '
         'aria-label="Download Resors on the Mac App Store">' + APPLE +
         '<span class="as-txt"><small>Download on the</small><b>Mac App Store</b></span></a>')
CHECK = ('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" '
         'stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7"/></svg>')

BODY = """<body>
  <a class="skip-link" href="#main">Skip to content</a>

  <nav class="nav" id="nav">
    <div class="nav-in">
      <a class="nav-brand" href="#top"><img src="images/resors-icon.png" alt="" /> Resors</a>
      <span class="nav-links">
        <a href="#system">01 See</a>
        <a href="#write">02 Write</a>
        <a href="#iterate">03 Iterate</a>
        <a href="#reuse">04 Reuse</a>
        <a href="#ship">05 Ship</a>
        <a href="#pricing">Pricing</a>
      </span>
      <a class="nav-cta" href="https://apps.apple.com/app/resors/id6748361802">Download</a>
    </div>
  </nav>

  <header class="hero" id="top">
    <div class="wrap">
      <h1>Xcode has assets.<br><span class="dim">Not a design system.</span></h1>
      <p class="lede">An asset catalog is a pile of folders and JSON. Resors turns your colours, images and SF&nbsp;Symbols into a design system you can actually see, change and reuse. Visually, from first import to shipped catalog.</p>
      <div class="cta-row">__STORE__<a class="button ghost" href="#system">See it work</a></div>
      <p class="hero-meta">FREE ON THE MAC APP STORE &nbsp;/&nbsp; MACOS 26+ &nbsp;/&nbsp; RESORS+ FOR EXPORT &amp; SYNC</p>
    </div>
    <div class="strip" aria-hidden="true">
      <div class="strip-track">
        <div class="strip-set">
          __HERO_STRIP__
        </div>
        <div class="strip-set">
          __HERO_STRIP__
        </div>
      </div>
    </div>
  </header>

  <main id="main">

    <!-- 01 SEE IT -->
    <section class="stage" id="system">
      <div class="wrap">
        <div class="stage-head"><span class="num">01</span><span>See it</span><span class="line"></span><span>Visual</span></div>
        <div class="stage-copy">
          <h2>Your assets live in projects. Your design system lives in one grid.</h2>
          <p class="lede">Xcode previews your assets one catalog at a time, inside the project that owns it, at thumbnail size. Resors keeps every colour, symbol and image you have in structured grids and groups, across every project you ship, at a size you can actually judge.</p>
        </div>
        <div class="compare">
          <div class="pane">
            <div class="pane-hd"><span>Three projects</span><span>Three catalogs</span></div>
            <div class="silos">
            __TREE__
            </div>
          </div>
          <div class="pane">
            <div class="pane-hd"><span>All of them, in Resors</span><span id="rsCount">23 items</span></div>
            <div class="rs-main">
              <div class="rs-side" role="tablist" aria-label="Groups">
              __SIDEBAR__
              </div>
              <div class="rs-body">
              __BOARD__
              </div>
            </div>
          </div>
        </div>
        <p class="lede" style="font-size:0.92rem;margin-top:1.4rem">Nothing is converted or migrated. Import your catalogs by drag and drop, from the file browser, or through catalog sync.</p>
      </div>
    </section>

    <!-- 02 ONE PLACE -->
    <section class="stage" id="write">
      <div class="wrap">
        <div class="stage-head"><span class="num">02</span><span>Change it once</span><span class="line"></span><span>Fast</span></div>
        <div class="stage-copy">
          <h2>One edit, not one per project.</h2>
          <p class="lede">A colour four projects share is four separate colour sets, one in each catalog. Changing it means opening four projects, making the same edit four times, and they drift the moment one gets missed. In Resors it is a single asset. Export it into any catalog, or connect a group and let it sync, so one edit reaches every project without a manual pass through Xcode.</p>
        </div>
        <div class="dupe">
          <div class="pane">
            <div class="pane-hd"><span>In Xcode</span><span>One per catalog</span></div>
            <div class="dupe-body">
              __DUPES__
              <p class="note">Four copies of one decision, with nothing keeping them in step.</p>
            </div>
          </div>
          <div class="pane">
            <div class="pane-hd"><span>In Resors</span><span>One asset</span></div>
            <div class="dupe-body dupe-body--one">
              <div class="one-asset">__ONECARD__</div>
              <div class="fanout">
                <span class="fan-line"></span>
                <span class="fan-label">Export or sync <span class="plus">Resors+</span></span>
                <div class="fan-groups">__FANOUT__</div>
              </div>
              <p class="note">Edit once, then export into any catalog or let a connected group sync it out. New assets are created here too, with every appearance and exact values in reach.</p>
            </div>
          </div>
        </div>

        <div class="sym">
          <div class="sym-copy">
            <h3>And controls the catalog never gave you</h3>
            <p>A custom SF&nbsp;Symbol is more than artwork. It carries leading and trailing margins and a scale that decide how it sits beside text. Resors edits those against live guides and previews the result. Xcode exposes none of it, and the SF&nbsp;Symbols app sends you back to a vector editor and another export.</p>
            <ul class="sym-points">
                <li>
                  <b>Drag a guide, or type the number</b>
                  <span>Leading and trailing move with the handles on the canvas, or take an exact value in the field beside them.</span>
                </li>
                <li>
                  <b>Live text preview</b>
                  <span>See every change as you make it, with the symbol set inline in real text.</span>
                </li>
                <li>
                  <b>Match Content</b>
                  <span>Snap both margins to the artwork&rsquo;s bounds in a click, then nudge from there. No trip back to a vector editor.</span>
                </li>
              </ul>
          </div>
          <picture class="sym-shot" style="--ar:0.7525">
                <source srcset="images/shots/symbol-guides@dark.png" media="(prefers-color-scheme: dark)">
                <img src="images/shots/symbol-guides.png" width="906" height="1204" loading="lazy" alt="The Resors symbol guide editor: leading and trailing margins shown against cap height and baseline" />
              </picture>
        </div>
      </div>
    </section>

    <!-- 03 PREVIEW -->
    <section class="stage" id="iterate">
      <div class="wrap">
        <div class="stage-head"><span class="num">03</span><span>See it in place</span><span class="line"></span><span>Iterative</span></div>
        <div class="stage-copy">
          <h2>Preview without guessing.</h2>
          <p class="lede">Colours land on type, buttons, toggles and the shapes you fill with them. Symbols sit in menu rows, cards and buttons at the weight and scale you ship. Images fill the rows and cards they were made for. A field tells you the value; this tells you whether it works.</p>
        </div>

        <div class="pv" id="pv">
          <div class="pv-types" role="tablist" aria-label="Asset type">
            __PVTYPES__
          </div>

          __PVCOLOR__

          __PVSYMBOL__

          __PVIMAGE__
        </div>
      </div>
    </section>

    <!-- 04 REUSE -->
    <section class="stage" id="reuse">
      <div class="wrap">
        <div class="stage-head"><span class="num">04</span><span>Use it again</span><span class="line"></span><span>Reusable</span></div>
        <div class="stage-copy">
          <h2>Start the next one from your palette.</h2>
          <p class="lede">Save a set of assets as a group and it becomes the starting point for whatever you build next. No copying folders between repositories, and no slowly drifting duplicates of the same blue.</p>
        </div>
        <div class="reuse">
          <div class="lib">
            <span class="lib-cap">Group &middot; Studio Core</span>
            <div class="lib-grid">
              __LIBCARDS__
            </div>
          </div>
          <div class="reuse-flow" aria-hidden="true">
            <span class="reuse-line"></span>
            <span class="reuse-label">Pulled into</span>
            <span class="reuse-line"></span>
          </div>
          <div class="proj-row">
            __PROJECTS__
          </div>
        </div>
      </div>
    </section>

    <!-- 05 SHIP -->
    <section class="stage" id="ship">
      <div class="wrap">
        <div class="stage-head"><span class="num">05</span><span>Ship it</span><span class="line"></span><span>Back to Xcode</span></div>
        <div class="stage-copy">
          <h2>It ends up where it belongs.</h2>
          <p class="lede">The system is only useful if it lands in the project. Export a catalog Xcode reads directly, or connect the project once and let changes move in both directions.</p>
        </div>
        <div class="ship" style="margin-top:2.6rem">
          <div class="ship-card">
            <span class="cap">Export</span>
            <h3>A catalog Xcode reads directly<span class="plus">Resors+</span></h3>
            <p>Generate <code>.colorset</code>, <code>.symbolset</code> and <code>.imageset</code> files for a single asset or the whole group.</p>
            <div class="flow"><span class="b">Resors</span><span class="ar"></span><span class="b">.xcassets</span></div>
          </div>
          <div class="ship-card">
            <span class="cap">Sync</span>
            <h3>Or keep both sides in step<span class="plus">Resors+</span></h3>
            <p>Connect a project and choose a catalog. Edits made in Resors reach Xcode, and changes made in Xcode come back.</p>
            <div class="flow"><span class="b">Resors</span><span class="ar"></span><span class="b">Xcode</span><span class="ar"></span><span class="b">Resors</span></div>
          </div>
        </div>
      </div>
    </section>

    <!-- SCREENSHOTS -->
    <section class="stage" id="screens">
      <div class="wrap">
        <div class="stage-head"><span class="num">&mdash;</span><span>The app</span><span class="line"></span></div>
        <div class="shots">
          <figure class="shot" style="margin:0">
            <div class="plate"><div class="chrome"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><div class="crop"><img src="images/shots/shot-organize.jpg" alt="Resors showing colour assets in a grid with groups in the sidebar" loading="lazy" width="1600" height="1000" /></div></div>
            <figcaption class="shot-cap"><span class="n">/ 01</span><div><h3>Reusable groups</h3><p>Sort assets into system and custom groups, then export, duplicate or manage a whole selection at once.</p></div></figcaption>
          </figure>
          <figure class="shot" style="margin:0">
            <div class="plate"><div class="chrome"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><div class="crop"><img src="images/shots/shot-editor.jpg" alt="The Resors colour editor showing appearances, colour space, hex value and opacity" loading="lazy" width="1600" height="1000" /></div></div>
            <figcaption class="shot-cap"><span class="n">/ 02</span><div><h3>Exact values</h3><p>Each appearance with HEX, RGB and Float components plus an explicit colour space, so what you set is what renders.</p></div></figcaption>
          </figure>
          <figure class="shot" style="margin:0">
            <div class="plate"><div class="chrome"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div><div class="crop"><img src="images/shots/shot-preview.jpg" alt="Resors previewing a colour applied to real buttons, text, toggles and shapes" loading="lazy" width="1600" height="1000" /></div></div>
            <figcaption class="shot-cap"><span class="n">/ 03</span><div><h3>Preview on real UI</h3><p>See every asset on live buttons, text, toggles and shapes before it reaches your project.</p></div></figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section class="stage" id="pricing">
      <div class="wrap">
        <div class="stage-head"><span class="num">&mdash;</span><span>Pricing</span><span class="line"></span></div>
        <div class="stage-copy">
          <h2>Free to build. Paid to publish.</h2>
          <p class="lede">Everything that makes the system is free. Resors+ covers getting it back out to Xcode.</p>
        </div>
        <div class="plans" style="margin-top:2.6rem">
          <div class="plan">
            <span class="pn">Resors</span>
            <div class="pp">Free</div>
            <div class="ps">On the Mac App Store</div>
            <ul>
              <li>__CHECK__Colours, images and SF Symbols</li>
              <li>__CHECK__The whole system in one view</li>
              <li>__CHECK__Light, Dark and High Contrast appearances</li>
              <li>__CHECK__Preview on real UI components</li>
              <li>__CHECK__Drag and drop import with validation</li>
              <li>__CHECK__Reusable groups</li>
            </ul>
            <a class="button ghost" href="https://apps.apple.com/app/resors/id6748361802">Download free</a>
          </div>
          <div class="plan hi">
            <span class="pn">Resors+</span>
            <div class="pp">Subscription</div>
            <div class="ps">Optional, from inside the app</div>
            <ul>
              <li>__CHECK__Everything in the free app</li>
              <li>__CHECK__Export an Xcode-ready catalog</li>
              <li>__CHECK__Two-way sync with a project</li>
              <li>__CHECK__Export a whole group at once</li>
              <li>__CHECK__Conflict-resolution modes, coming soon</li>
            </ul>
            <a class="button" href="https://apps.apple.com/app/resors/id6748361802">Get Resors</a>
          </div>
        </div>
      </div>
    </section>

    <section class="close">
      <div class="wrap">
        <h2>Your design system should outlive the project.</h2>
        <p class="lede" style="margin:0 auto 2rem">Free on the Mac App Store, and the catalog you already have works the moment you drop it in.</p>
        <div class="cta-row">__STORE__</div>
      </div>
    </section>
  </main>

  <div class="wrap">
    <footer>
      <span>&copy; 2025&ndash;2026 RESORS</span>
      <a href="roadmap.html">ROADMAP</a>
      <a href="support.html">SUPPORT</a>
      <a href="privacy.html">PRIVACY</a>
      <a href="https://anathemalabs.com">ANATHEMA LABS</a>
    </footer>
  </div>
"""

PREVIEW_GLYPHS = "".join(glyph_svg(k, "currentColor", 20) for k in ["bolt", "heart", "star", "bell", "gear"])

JS = """
    /* ---------- Preview: a panel per asset type, each driven by its rail ---------- */
    (function () {
      var pv = document.getElementById('pv');
      if (!pv) return;
      var DATA = {
        color: __C__,
        symbol: __S__,
        image: __I__
      };
      var darkQ = window.matchMedia('(prefers-color-scheme: dark)');
      var cur = { color: 0, symbol: 0, image: 0 };

      function paint(kind) {
        var set = pv.querySelector('.pv-set[data-t="' + kind + '"]');
        var row = DATA[kind][cur[kind]];
        if (kind === 'color') {
          set.style.setProperty('--pv-l', row[1]);
          set.style.setProperty('--pv-d', row[2]);
        } else if (kind === 'symbol') {
          set.style.setProperty('--pv-l', row[2]);
          set.style.setProperty('--pv-d', row[2]);
          set.querySelectorAll('[data-glyph]').forEach(function (el) { el.innerHTML = row[1]; });
        } else {
          set.querySelectorAll('[data-art]').forEach(function (el) { el.style.background = row[1]; });
        }
        set.querySelectorAll('[data-rail] button').forEach(function (b, k) {
          b.setAttribute('aria-selected', k === cur[kind] ? 'true' : 'false');
        });
      }

      pv.querySelectorAll('[data-rail]').forEach(function (rail) {
        rail.addEventListener('click', function (e) {
          var b = e.target.closest('button');
          if (!b) return;
          var kind = rail.dataset.rail;
          cur[kind] = +b.dataset.i;
          paint(kind);
        });
      });

      var tabs = pv.querySelector('.pv-types');
      tabs.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var kind = b.dataset.t;
        tabs.querySelectorAll('button').forEach(function (x) {
          x.setAttribute('aria-selected', x === b ? 'true' : 'false');
        });
        pv.querySelectorAll('.pv-set').forEach(function (sx) {
          sx.hidden = sx.dataset.t !== kind;
        });
      });

      darkQ.addEventListener('change', function () { paint('color'); });
      ['color', 'symbol', 'image'].forEach(paint);
    })();

    /* ---------- Resors pane: sidebar groups, cycled automatically ----------
       The grid animates with FLIP so cards glide to their new slots instead of
       snapping when the filter changes. */
    (function () {
      var grid = document.getElementById('rsGrid');
      var side = document.querySelector('.rs-side');
      if (!grid || !side) return;
      var items = [].slice.call(side.querySelectorAll('.rs-item'));
      var cards = [].slice.call(grid.children);
      var countEl = document.getElementById('rsCount');
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var idx = 0, timer = null, pending = null;

      function matches(card, f) {
        if (f === 'all') return true;
        var p = f.split(':');
        return card.dataset[p[0] === 'kind' ? 'kind' : 'proj'] === p[1];
      }

      /* Wipe any inline state a cancelled transition may have left behind,
         otherwise a card can be stranded at opacity 0. */
      function reset(c) {
        c.classList.remove('is-fading');
        c.style.transition = 'none';
        c.style.transform = '';
        c.style.opacity = '';
      }

      function select(i) {
        if (pending) { clearTimeout(pending); pending = null; }
        idx = ((i % items.length) + items.length) % items.length;
        var f = items[idx].dataset.f;
        items.forEach(function (b, k) { b.setAttribute('aria-selected', k === idx ? 'true' : 'false'); });

        var shown = cards.filter(function (c) { return matches(c, f); });
        if (countEl) countEl.textContent = shown.length + (shown.length === 1 ? ' item' : ' items');

        if (reduced) {
          cards.forEach(function (c) { reset(c); c.classList.toggle('is-out', !matches(c, f)); });
          return;
        }

        var first = new Map();
        cards.forEach(function (c) {
          if (!c.classList.contains('is-out')) first.set(c, c.getBoundingClientRect());
        });
        var leaving = cards.filter(function (c) {
          return !c.classList.contains('is-out') && !matches(c, f);
        });
        leaving.forEach(function (c) { c.classList.add('is-fading'); });

        pending = setTimeout(function () {
          pending = null;
          cards.forEach(function (c) {
            reset(c);
            c.classList.toggle('is-out', !matches(c, f));
          });
          shown.forEach(function (c) {                    /* invert */
            var f0 = first.get(c), f1 = c.getBoundingClientRect();
            if (f0) {
              var dx = f0.left - f1.left, dy = f0.top - f1.top;
              if (dx || dy) c.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
            } else {
              c.style.transform = 'scale(0.94)';
              c.style.opacity = '0';
            }
          });
          void grid.offsetWidth;                          /* commit it */
          shown.forEach(function (c) {                    /* play */
            c.style.transition = 'transform 0.4s cubic-bezier(.2,.7,.3,1), opacity 0.32s ease';
            c.style.transform = '';
            c.style.opacity = '';
          });
        }, leaving.length ? 170 : 0);
      }

      function start() { if (!timer && !reduced) timer = setInterval(function () { select(idx + 1); }, 2900); }
      function stop() { clearInterval(timer); timer = null; }

      side.addEventListener('click', function (e) {
        var b = e.target.closest('.rs-item');
        if (!b) return;
        stop();
        select(items.indexOf(b));
        start();
      });
      /* let people read a group they are pointing at */
      var pane = side.closest('.pane');
      pane.addEventListener('mouseenter', stop);
      pane.addEventListener('mouseleave', start);

      /* only cycle while the section is actually on screen */
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          en[0].isIntersecting ? start() : stop();
        }, { threshold: 0.25 }).observe(pane);
      } else { start(); }
    })();

    /* ---------- nav hairline ---------- */
    (function () {
      var nav = document.getElementById('nav');
      if (!nav) return;
      var f = function () { nav.classList.toggle('stuck', window.scrollY > 8); };
      window.addEventListener('scroll', f, { passive: true });
      f();
    })();

    /* ---------- reveal screenshots ---------- */
    (function () {
      var els = document.querySelectorAll('.shot');
      if (!('IntersectionObserver' in window)) {
        els.forEach(function (e) { e.classList.add('in'); });
        return;
      }
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12 });
      els.forEach(function (el) {
        el.style.transition = 'opacity .6s ease, transform .6s ease';
        io.observe(el);
      });
    })();
"""

assets_js = "[" + ",".join(
    '["%s","%s","%s","%s"]' % (n, l, d, h) for n, l, d, h in COLORS[:5]) + "]"
PV_C = "[" + ",".join('["%s","%s","%s","%s"]' % (n, l, d, h) for n, l, d, h in PV_COLORS) + "]"
PV_S = "[" + ",".join('["%s",%s,"%s"]' % (n, json.dumps(_glyph_plain(k, "currentColor")), c)
                      for n, k, c in PV_SYMBOLS) + "]"
PV_I = "[" + ",".join('["%s","%s"]' % (n, g) for n, g in PV_IMAGES) + "]"
JS = (JS.replace("__C__", PV_C).replace("__S__", PV_S).replace("__I__", PV_I))
_unused = JS.replace("__ASSETS__", assets_js).replace("__GLYPHS__", PREVIEW_GLYPHS.replace("'", "\\'"))

BODY = (BODY.replace("__STORE__", STORE)
            .replace("__CHECK__", CHECK)
            .replace("__HERO_STRIP__", hero_strip())
            .replace("__BOARD__", board_all())
            .replace("__TREE__", silo_projects())
            .replace("__SIDEBAR__", rs_sidebar())
            .replace("__DUPES__", dupe_rows())
            .replace("__ONECARD__", one_card())
            .replace("__FANOUT__", fanout_groups())
            .replace("__PVTYPES__", pv_types())
            .replace("__PVCOLOR__", pv_set_color())
            .replace("__PVSYMBOL__", pv_set_symbol())
            .replace("__PVIMAGE__", pv_set_image())
            .replace("__LIBCARDS__", lib_cards())
            .replace("__PROJECTS__", reuse_projects())
            .replace("__DEMO_HTML__", DEMO_HTML))

head = HEAD
head = head.replace(
    "<title>Resors: Xcode Design Systems Made Easy</title>",
    "<title>Resors: a design system for your Xcode asset catalog</title>")
head = head.replace('content="#f6f4f8" media="(prefers-color-scheme: light)"',
                    'content="#f2f0ea" media="(prefers-color-scheme: light)"')
head = head.replace('content="#100a16" media="(prefers-color-scheme: dark)"',
                    'content="#0c0c10" media="(prefers-color-scheme: dark)"')

out = (head + "  <style>\n" + CSS + "\n" + DEMO_CSS + "\n  </style>\n</head>\n"
       + BODY + "\n  <script>\n" + DEMO_JS + "\n" + JS + "\n  </script>\n</body>\n</html>\n")

open(SRC, "w", encoding="utf-8").write(out)
print("wrote", len(out), "bytes")
