import assert from 'node:assert/strict';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { measureFirstScreen, openScene, pixelStats, readRenderStats, SCREENS, withPreview } from './scene-page.mjs';

const treatment = process.argv[2];
const queries = {
  baseline: '',
  'treatment-a': '?light=soft',
  'treatment-b': '?light=directional',
  candidate: '',
};
assert(Object.hasOwn(queries, treatment), 'Use baseline, treatment-a, treatment-b, or candidate');
const output = `test-results/patio/visual-quality/${treatment}`;
const temporary = `${output}.tmp`;
await rm(temporary, { recursive: true, force: true });
await mkdir(temporary, { recursive: true });

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const shots = [];
const firstScreen = {};
const transferred = [];

try {
  await withPreview(4175, async (origin) => {
    for (const [screen, viewport] of Object.entries(SCREENS)) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const responseTasks = [];
      context.on('response', (response) => {
        const task = (async () => {
          const headers = await response.allHeaders();
          let bytes = 0;
          try {
            bytes = (await response.body()).byteLength;
          } catch {
            bytes = Number(headers['content-length'] ?? 0);
          }
          transferred.push({
            url: response.url(),
            contentType: headers['content-type'] ?? '',
            bytes,
          });
        })();
        responseTasks.push(task);
      });
      const page = await openScene(context, origin, queries[treatment]);
      firstScreen[screen] = await measureFirstScreen(page);
      await page.screenshot({ path: `${temporary}/patio-uv-${screen}-firstscreen.png` });
      await page.screenshot({ path: `${temporary}/patio-uv-${screen}-full.png`, fullPage: true });
      const canvas = page.locator('canvas');
      for (const view of ['uv', 'human']) {
        await page.getByRole('radio', { name: view === 'uv' ? 'Contraste UV' : 'Referencia humana', exact: true }).check();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const png = await canvas.screenshot({ path: `${temporary}/patio-${view}-${screen}-canvas.png` });
        shots.push({ station: 'patio', view, screen, renderStats: await readRenderStats(page), pixels: await pixelStats(page, png) });
      }
      await page.getByRole('button', { name: 'Acercarse a la flor', exact: true }).click();
      await page.waitForFunction(() => document.body.dataset.camera === 'flower');
      for (const view of ['uv', 'human']) {
        await page.getByRole('radio', { name: view === 'uv' ? 'Contraste UV' : 'Referencia humana', exact: true }).check();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const png = await canvas.screenshot({ path: `${temporary}/flower-${view}-${screen}-canvas.png` });
        shots.push({ station: 'flower', view, screen, renderStats: await readRenderStats(page), pixels: await pixelStats(page, png) });
      }
      await page.close();
      const reverse = await openScene(context, origin, `${queries[treatment]}${queries[treatment] ? '&' : '?'}pose=reverse`);
      const reverseCanvas = reverse.locator('canvas');
      for (const view of ['uv', 'human']) {
        await reverse.getByRole('radio', { name: view === 'uv' ? 'Contraste UV' : 'Referencia humana', exact: true }).check();
        await reverse.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const png = await reverseCanvas.screenshot({ path: `${temporary}/reverse-${view}-${screen}-canvas.png` });
        shots.push({ station: 'reverse', view, screen, renderStats: await readRenderStats(reverse), pixels: await pixelStats(reverse, png) });
      }
      await Promise.all(responseTasks);
      await context.close();
    }
  });
} finally {
  await browser.close();
}

const assetBytes = transferred
  .filter((entry) => /^(image|font)\//.test(entry.contentType) || /\.(glb|gltf|hdr)(\?|$)/.test(entry.url))
  .reduce((sum, entry) => sum + entry.bytes, 0);
const metadata = {
  capturedAt: new Date().toISOString(),
  treatment,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
  browser: browser.version(),
  graphics: 'Chromium software WebGL via SwiftShader',
  deviceScaleFactor: 1,
  firstScreen,
  transferred,
  assetBytes,
  shots,
};
await writeFile(`${temporary}/metadata.json`, JSON.stringify(metadata, null, 2));

if (treatment === 'baseline') {
  const existing = JSON.parse(await readFile(`${output}/metadata.json`, 'utf8'));
  const baselinePng = await readFile(`${output}/patio-uv-desktop-canvas.png`);
  const candidatePng = await readFile(`${temporary}/patio-uv-desktop-canvas.png`);
  assert(baselinePng.equals(candidatePng), 'Diagnostics changed the baseline canvas');
  await writeFile(`${output}/metadata.json`, JSON.stringify({ ...existing, renderStats: shots[0].renderStats }, null, 2));
  await rm(temporary, { recursive: true, force: true });
} else {
  await rm(output, { recursive: true, force: true });
  await mkdir(output.substring(0, output.lastIndexOf('/')), { recursive: true });
  await rename(temporary, output);
}

console.log(JSON.stringify({ treatment, firstScreen, assetBytes, shots }, null, 2));
