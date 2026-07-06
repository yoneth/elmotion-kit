/**
 * Entry point for Paper Shaders browser bundle.
 * This file is bundled by esbuild into an IIFE that exposes all Paper Shaders
 * exports as `window.EMKPaperShaders`.
 */
import * as PaperShaders from '@paper-design/shaders';

window.EMKPaperShaders = PaperShaders;

// Signal that the bundle is ready for consumers that load asynchronously.
window.dispatchEvent(new CustomEvent('emk:paper-shaders-ready'));
