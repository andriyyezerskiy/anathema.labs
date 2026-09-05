#!/usr/bin/env python3
"""Find (and optionally strip) dead CSS across the site.

    python3 tools/sweep.py            report only
    python3 tools/sweep.py --strip    also remove the rules it reports as dead

A class counts as used if it appears in any class attribute of the matching
markup, or anywhere in the matching JavaScript. Selector lists are split, so a
rule like `code, .mono {}` keeps `code` when only `.mono` is dead.

Two kinds of finding:

  dead      a rule nothing references, safe to drop
  unstyled  a class in the markup with no rule at all. Usually harmless, but
            this is how `.mini-board` silently grew a card to 3933px once the
            layout around it changed, so it is worth eyeballing.
"""
import argparse
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def rel(*p):
    return os.path.join(ROOT, *p)


# (label, css sources, markup sources, script sources)
TARGETS = [
    ("root site", ["css/design-system.css", "css/style.css"],
     ["index.html", "404.html"], ["js/*.js"]),
    ("umbraa", ["umbraa/umbraa.css"], ["umbraa/*.html"], ["umbraa/umbraa.js"]),
    ("resors/index.html", ["resors/index.html"], ["resors/index.html"], ["resors/index.html"]),
    ("resors/support.html", ["resors/support.html"], ["resors/support.html"], ["resors/support.html"]),
    ("resors/roadmap.html", ["resors/roadmap.html"], ["resors/roadmap.html"], ["resors/roadmap.html"]),
    ("resors/privacy.html", ["resors/privacy.html"], ["resors/privacy.html"], ["resors/privacy.html"]),
]


def expand(pats):
    out = []
    for p in pats:
        out.extend(sorted(glob.glob(rel(p))))
    return out


def read(paths):
    return [(p, open(p, encoding="utf-8").read()) for p in expand(paths)]


def css_of(text, path):
    """Inline <style> for a page, or the whole file for a stylesheet."""
    if path.endswith(".css"):
        return text
    return "".join(re.findall(r"<style>(.*?)</style>", text, re.S))


def markup_of(text, path):
    if path.endswith(".css"):
        return ""
    body = text[text.rindex("</style>"):] if "</style>" in text else text
    return re.sub(r"<script>.*?</script>", "", body, flags=re.S)


def script_of(text, path):
    if path.endswith(".js"):
        return text
    return "".join(re.findall(r"<script>(.*?)</script>", text, re.S))


def selector_classes(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    found = {}
    for m in re.finditer(r"([^{}]+)\{", css):
        sel = m.group(1)
        if "@" in sel:
            continue
        for c in re.findall(r"\.([a-zA-Z][\w-]*)", sel):
            found[c] = found.get(c, 0) + 1
    return found


def markup_classes(markup):
    out = set()
    for attr in re.findall(r'class="([^"]*)"', markup):
        out.update(attr.split())
    return out


def scrub(block, dead):
    """Drop selector parts naming a dead class; drop rules left with none.

    The selector region can be preceded by comments, and a comment may contain
    commas ("the menu bar, the marker, and the fill"). Splitting the raw text on
    commas therefore cuts through prose and corrupts the rule, so the comment
    prefix is separated off first and passed through untouched.
    """
    out, i, n = [], 0, len(block)
    while i < n:
        brace = block.find("{", i)
        if brace == -1:
            out.append(block[i:])
            break
        sel = block[i:brace]
        depth, j = 1, brace + 1
        while j < n and depth:
            if block[j] == "{":
                depth += 1
            elif block[j] == "}":
                depth -= 1
            j += 1
        body = block[brace + 1:j - 1]

        # split any leading comments away from the selector itself
        ends = [m.end() for m in re.finditer(r"\*/", sel)]
        cut = ends[-1] if ends else 0
        prefix, selector = sel[:cut], sel[cut:]

        if selector.strip().startswith("@"):
            inner = scrub(body, dead)
            if inner.strip():
                out.append(sel + "{" + inner + "}")
            else:
                out.append(prefix)
        else:
            parts = selector.split(",")
            keep = [p for p in parts
                    if not any(c in dead for c in re.findall(r"\.([a-zA-Z][\w-]*)", p))]
            if len(keep) == len(parts):
                out.append(sel + "{" + body + "}")      # untouched, byte for byte
            elif keep:
                # the dropped part carried the newline after the comment, so
                # put the selector back on its own line
                lead = selector[:len(selector) - len(selector.lstrip())]
                text = ", ".join(p.strip() for p in keep)
                if prefix.strip():
                    out.append(prefix.rstrip() + "\n" + text + " {" + body + "}")
                else:
                    out.append(lead + text + " {" + body + "}")
            else:
                out.append(prefix)                      # keep the comment, drop the rule
        i = j
    return "".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--strip", action="store_true", help="remove the dead rules")
    args = ap.parse_args()

    total_dead = 0
    for label, css_p, mk_p, js_p in TARGETS:
        css_files = read(css_p)
        css = "".join(css_of(t, p) for p, t in css_files)
        markup = "".join(markup_of(t, p) for p, t in read(mk_p))
        script = "".join(script_of(t, p) for p, t in read(js_p))

        defined = selector_classes(css)
        used = markup_classes(markup)
        dead = {c for c in defined
                if c not in used
                and not re.search(r"[\"'\s.=]%s\b" % re.escape(c), script)}
        unstyled = sorted(c for c in used if c not in defined)
        total_dead += len(dead)

        print("%-22s defined:%-4d dead:%-3d unstyled:%-3d" %
              (label, len(defined), len(dead), len(unstyled)))
        if dead:
            print("   dead    :", ", ".join(sorted(dead)))
        if unstyled:
            print("   unstyled:", ", ".join(unstyled))

        if args.strip and dead:
            for path, text in css_files:
                block = css_of(text, path)
                cleaned = re.sub(r"\n{3,}", "\n\n", scrub(block, dead))
                if cleaned != block:
                    open(path, "w", encoding="utf-8").write(text.replace(block, cleaned, 1))
                    print("   stripped:", os.path.relpath(path, ROOT))

    print("\n%d dead class groups%s" % (total_dead, " removed" if args.strip else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
