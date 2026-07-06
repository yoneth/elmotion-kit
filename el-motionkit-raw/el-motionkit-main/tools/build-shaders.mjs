/**
 * Build script for Paper Shaders bundle and EMK shader presets.
 *
 * Steps:
 * 1. Bundle emk-paper-shaders-entry.mjs → emk-paper-shaders.js (esbuild, IIFE).
 * 2. Minify emk-paper-shaders.js → emk-paper-shaders.min.js (terser).
 * 3. Minify emk-shader-presets.js → emk-shader-presets.min.js (terser).
 * 4. Minify emk-shaders.js           → emk-shaders.min.js (terser).
 * 5. Minify emk-shaders.css          → emk-shaders.min.css (basic minifier).
 */

import * as esbuild from 'esbuild';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ASSETS = resolve(ROOT, 'assets');

function banner() {
  return '/*! Paper Shaders v0.0.77 | Apache-2.0 | https://github.com/paper-design/shaders */';
}

// --- Step 1: Bundle paper-shaders entry ---
async function bundleShaders() {
  const entry = resolve(ASSETS, 'js/emk-paper-shaders-entry.mjs');
  const out = resolve(ASSETS, 'js/emk-paper-shaders.js');

  await esbuild.build({
    entryPoints: [entry],
    outfile: out,
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'EMKPaperShadersBundle',
    target: 'es2020',
    banner: { js: banner() },
  });

  console.log('✓ emk-paper-shaders.js built');
}

// --- Step 2: Minify a JS file with terser ---
async function minifyJS(srcRelative, destRelative) {
  const src = resolve(ASSETS, 'js', srcRelative);
  const dest = resolve(ASSETS, 'js', destRelative);

  if (!existsSync(src)) {
    console.warn(`⚠  Source not found, skipping: ${srcRelative}`);
    return;
  }

  const { minify } = await import('terser');
  const code = readFileSync(src, 'utf-8');
  const result = await minify(code, {
    sourceMap: false,
    compress: { passes: 2 },
    output: { comments: false },
  });

  writeFileSync(dest, result.code, 'utf-8');
  console.log(`✓ ${destRelative} minified`);
}

// --- Step 3: Minify CSS ---
function minifyCSS(srcRelative, destRelative) {
  const src = resolve(ASSETS, 'css', srcRelative);
  const dest = resolve(ASSETS, 'css', destRelative);

  if (!existsSync(src)) {
    console.warn(`⚠  Source not found, skipping: ${srcRelative}`);
    return;
  }

  let css = readFileSync(src, 'utf-8');
  // Simple CSS minification: remove comments, collapse whitespace
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  css = css.replace(/[\r\n]+/g, '');
  css = css.replace(/\s{2,}/g, ' ');
  css = css.replace(/\s*([{}:;,])\s*/g, '$1');
  css = css.replace(/;}/g, '}');

  writeFileSync(dest, css, 'utf-8');
  console.log(`✓ ${destRelative} minified`);
}

async function main() {
  console.log('Building shaders assets...\n');

  // Step 1: Bundle
  await bundleShaders();

  // Step 2: Minify JS
  await minifyJS('emk-paper-shaders.js', 'emk-paper-shaders.min.js');
  await minifyJS('emk-shader-presets.js', 'emk-shader-presets.min.js');
  await minifyJS('emk-shaders.js', 'emk-shaders.min.js');

  // Step 3: Minify CSS
  minifyCSS('emk-shaders.css', 'emk-shaders.min.css');

  console.log('\n✓ All shaders assets built successfully.');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
