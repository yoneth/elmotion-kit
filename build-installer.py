#!/usr/bin/env python3
"""
Build a clean installer ZIP for El MotionKit plugin.

Excludes:
  - node_modules/ (dev only)
  - tools/ (dev only)
  - vendor/ (composer autoload, unused)
  - composer.json, package.json, gulpfile.js, phpstan.neon (dev configs)
  - .DS_Store, Thumbs.db, *.log, *.bak, *.tmp
  - README.md (duplicate of readme.txt for WP)
"""
import os
import re
import zipfile
from pathlib import Path

SRC = Path("/Users/rio/Pi/El Motion kit/el-motionkit-raw/el-motionkit-main")
OUT_DIR = Path("/Users/rio/Pi/El Motion kit/release")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Plugin folder name inside the zip. Becomes the WP plugin slug when
# uploaded via Plugins → Add New → Upload. Stable across releases so WP
# upgrades in place instead of creating a new folder.
PLUGIN_SLUG = "el-motion-kit-clean"

# Exclusions: top-level dirs / files to skip entirely
SKIP_DIRS = {
    "node_modules",
    "tools",
    "vendor",
    ".git",
    ".github",
    "__pycache__",
}
SKIP_FILES = {
    ".DS_Store",
    "Thumbs.db",
    "composer.json",
    "composer.lock",
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "gulpfile.js",
    "phpstan.neon",
    "README.md",  # duplicate of readme.txt
    ".gitignore",
    ".gitkeep",
}
SKIP_EXTENSIONS = {".log", ".bak", ".tmp", ".swp", ".DS_Store"}

# Read version from plugin header.
version = "0.0.0"
for line in (SRC / "el-motionkit.php").read_text().splitlines():
    if "Version:" in line:
        version = line.split("Version:")[-1].strip()
        break
if version == "0.0.0":
    m = re.search(r"EMK_VERSION',\s*'([^']+)'", (SRC / "el-motionkit.php").read_text())
    if m:
        version = m.group(1)

print(f"Building El MotionKit v{version} into {PLUGIN_SLUG}/")

out_path = OUT_DIR / f"{PLUGIN_SLUG}-{version}.zip"

with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(SRC):
        rel_root = Path(root).relative_to(SRC)

        # Filter dirs in-place so os.walk skips them
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]

        for f in files:
            src_path = Path(root) / f
            rel_path = src_path.relative_to(SRC)

            # Skip files we don't want
            if f in SKIP_FILES:
                continue
            if f.startswith("."):
                continue
            if src_path.suffix in SKIP_EXTENSIONS:
                continue

            # WP expects the plugin folder at the top level of the zip so
            # it extracts into wp-content/plugins/<slug>/ with the main
            # file inside.
            archive_path = Path(PLUGIN_SLUG) / rel_path
            zf.write(src_path, archive_path)

print(f"\nWrote {out_path}")
print(f"Size: {out_path.stat().st_size} bytes ({out_path.stat().st_size / 1024:.1f} KB)")
print(f"Files: {sum(1 for _ in zipfile.ZipFile(out_path).namelist())}")
