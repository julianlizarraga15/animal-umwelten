import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { readRenderStats, withPreview } from './scene-page.mjs';

// Run after `npm run build`. Pass --gpu to try hardware WebGL instead of SwiftShader.
const gpu = process.argv.includes('--gpu');
const output = 'test-results/patio/garden-rudbeckia';
const reference = 'docs/art-direction/jardin-de-la-tarde.png';
await mkdir(output, { recursive: true });

const args = gpu ? ['--use-angle=d3d11', '--ignore-gpu-blocklist'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ args });
const errors = [];

async function settle(page) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

/** Median wall time of look-around renders; the one-pixel read waits for the GPU. */
function timeRenders(page, frames = 60) {
  return page.evaluate((count) => {
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2');
    const pixel = new Uint8Array(4);
    const times = [];
    for (let index = 0; index < count; index++) {
      const key = index % 2 === 0 ? 'ArrowLeft' : 'ArrowRight';
      const start = performance.now();
      canvas.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      medianMs: Number(times[Math.floor(times.length / 2)].toFixed(2)),
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown',
    };
  }, frames);
}

async function sideBySide(path, name) {
  const dataUrl = async (file) => `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
  const compare = await browser.newPage({ viewport: { width: 1640, height: 461 }, deviceScaleFactor: 1 });
  await compare.setContent(`<body style="margin:0;display:flex;gap:8px;background:#1d1611">
    <img src="${await dataUrl(reference)}" style="height:461px"><img src="${await dataUrl(path)}" style="height:461px">
  </body>`);
  await compare.waitForFunction(() => [...document.images].every((image) => image.complete));
  await compare.screenshot({ path: `${output}/${name}` });
  await compare.close();
}

try {
  const result = await withPreview(4175, async (origin) => {
    const page = await browser.newPage({ viewport: { width: 1456, height: 819 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const started = Date.now();
    await page.goto(origin);
    await page.waitForSelector('canvas[data-ready="true"]');
    const startupMs = Date.now() - started;
    await settle(page);
    const suffix = gpu ? 'gpu' : 'swiftshader';
    await page.screenshot({ path: `${output}/garden-${suffix}.png` });
    await sideBySide(`${output}/garden-${suffix}.png`, `garden-vs-reference-${suffix}.png`);
    const patio = { stats: await readRenderStats(page), timing: await timeRenders(page) };
    await page.getByRole('button', { name: 'Acercarse a la flor', exact: true }).click();
    await page.waitForFunction(() => document.body.dataset.camera === 'flower');
    await settle(page);
    await page.screenshot({ path: `${output}/flower-human-${suffix}.png` });
    await page.getByRole('radio', { name: 'Contraste UV', exact: true }).check();
    await settle(page);
    await page.screenshot({ path: `${output}/flower-uv-${suffix}.png` });
    const flower = { stats: await readRenderStats(page), timing: await timeRenders(page) };
    await page.goto(`${origin}/?pose=reverse`);
    await page.waitForSelector('canvas[data-ready="true"]');
    await page.getByRole('radio', { name: 'Contraste UV', exact: true }).check();
    await settle(page);
    await page.screenshot({ path: `${output}/reverse-uv-${suffix}.png` });
    return { gpu, startupMs, patio, flower };
  });
  const report = { ...result, errors };
  await writeFile(`${output}/measurements-${gpu ? 'gpu' : 'swiftshader'}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
