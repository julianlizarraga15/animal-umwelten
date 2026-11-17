import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';
import { verifySpiderWeb, verifyWebTouch } from './verify-spider-web.mjs';
import { measureFirstScreen, pixelDifference, pixelStats, readRenderStats } from './scene-page.mjs';

const output = 'test-results/patio';
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
let browser;
let context;
let recording;
const errors = [];
const observations = [];
const transferred = [];
let desktopFirstScreen;
let mobileFirstScreen;
let patioRenderStats;
let flowerRenderStats;
let webEvidence;

try {
  browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    recordVideo: { dir: output, size: { width: 1440, height: 1000 } },
  });
  const page = await context.newPage();
  recording = page.video();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    const url = response.url();
    if (!url.startsWith('http://127.0.0.1:4174')) transferred.push(url);
  });

  await page.addInitScript(() => {
    window.sceneCounters = { raf: 0, draw: 0 };
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (callback) => {
      window.sceneCounters.raf++;
      return originalRaf.call(window, timestamp => callback(window.sceneHoldTime ?? timestamp));
    };
    for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        window.sceneCounters.draw++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto('http://127.0.0.1:4174');
  const canvas = page.locator('canvas');
  await canvas.waitFor({ state: 'visible' });
  await page.waitForFunction(() => document.querySelector('canvas')?.dataset.ready === 'true');
  const settle = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await settle();
  desktopFirstScreen = await measureFirstScreen(page);
  assert.equal(desktopFirstScreen.scrollY, 0, 'Desktop starts at the top');
  assert(desktopFirstScreen.viewportBottom <= desktopFirstScreen.innerHeight, 'Desktop viewport fits the first screen');
  assert(desktopFirstScreen.selectorBottom <= desktopFirstScreen.innerHeight, 'Desktop comparison selector fits the first screen');
  assert(desktopFirstScreen.scrollWidth <= desktopFirstScreen.innerWidth, 'Desktop has no horizontal overflow');
  assert.equal(desktopFirstScreen.occluders, 0, 'No element covers the viewport');
  patioRenderStats = await readRenderStats(page);

  const human = page.getByRole('radio', { name: 'Referencia humana', exact: true });
  const uv = page.getByRole('radio', { name: 'Contraste UV', exact: true });
  const approachBtn = page.getByRole('button', { name: 'Acercarse a la flor', exact: true });
  const returnBtn = page.getByRole('button', { name: 'Volver al patio', exact: true });
  const lookLeft = page.getByRole('button', { name: 'Mirar a la izquierda', exact: true });
  const lookRight = page.getByRole('button', { name: 'Mirar a la derecha', exact: true });

  assert(await human.isChecked(), 'Human-reference mode is initially selected for the art-directed overview');
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Starts at patio viewpoint');
  assert(await approachBtn.isEnabled(), 'Approach button is enabled in patio');
  assert(await returnBtn.isDisabled(), 'Return button is disabled in patio');

  await page.screenshot({ path: `${output}/patio-human-desktop.png`, fullPage: true });
  const lessonToggle = page.getByRole('button', { name: /La ciencia/ });
  await lessonToggle.click();
  assert(await page.locator('#lesson-drawer').evaluate(dialog => dialog.open), 'Science drawer opens as a modal dialog');
  await page.screenshot({ path: `${output}/lesson-drawer-desktop.png`, fullPage: true });
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#lesson-drawer').evaluate(dialog => dialog.open)), 'Escape dismisses the science drawer');
  assert(await lessonToggle.evaluate(button => button === document.activeElement), 'Closing the drawer restores focus to its trigger');
  const patioInitial = await canvas.screenshot();

  await lookLeft.focus();
  await page.keyboard.press('Enter');
  await settle();
  assert(!patioInitial.equals(await canvas.screenshot()), 'Keyboard look-left changes camera orientation');
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Looking around stays in patio state');
  await lookRight.click();
  await settle();
  const restoredViewDifference = await pixelDifference(page, patioInitial, await canvas.screenshot());
  assert(restoredViewDifference < 0.02, `Opposite look button restores the original patio view within anti-aliasing tolerance (changed ${restoredViewDifference})`);

  const bounds = await canvas.boundingBox();
  assert(bounds, 'Canvas has a visible bounding box');
  const cx = bounds.x + bounds.width * 0.5;
  const cy = bounds.y + bounds.height * 0.48;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 80, cy + 25, { steps: 8 });
  await page.mouse.up();
  await settle();
  assert(!patioInitial.equals(await canvas.screenshot()), 'Pointer drag looks around the patio');
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Pointer drag does not trigger approach');

  await approachBtn.click();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'approaching', 'Approach button starts travel');
  assert(await approachBtn.isDisabled(), 'Approach button is disabled during travel');
  await returnBtn.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'patio');
  await settle();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Return button cancels approach and returns to patio');

  await page.mouse.click(bounds.x + bounds.width * 0.385, bounds.y + bounds.height * 0.48);
  await page.waitForFunction(() => document.body.dataset.camera === 'flower');
  await settle();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'flower', 'Clicking the flower completes approach');
  assert(await returnBtn.isEnabled(), 'Return button is enabled at the flower');

  await page.screenshot({ path: `${output}/flower-uv-desktop.png`, fullPage: true });
  const flowerHuman = await canvas.screenshot();
  flowerRenderStats = await readRenderStats(page);

  await uv.check();
  await settle();
  const flowerUv = await canvas.screenshot();
  assert(!flowerHuman.equals(flowerUv), 'Switching to UV changes upper petal rendering at fixed pose');
  await page.screenshot({ path: `${output}/flower-uv-desktop.png`, fullPage: true });
  await human.check();
  await page.screenshot({ path: `${output}/flower-human-desktop.png`, fullPage: true });

  for (let i = 0; i < 5; i++) {
    await uv.check();
    await human.check();
  }
  await uv.check();
  await settle();
  assert(flowerUv.equals(await canvas.screenshot()), 'Repeated mode toggles preserve exact camera pose and UV rendering');

  await uv.focus();
  await page.keyboard.press('ArrowUp');
  assert(await human.isChecked(), 'Keyboard radio selection switches to human mode');
  await page.keyboard.press('ArrowDown');
  assert(await uv.isChecked(), 'Keyboard radio selection returns to UV mode');

  await returnBtn.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'patio');
  await settle();

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await approachBtn.click();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'flower', 'Reduced motion snaps immediately to flower');
  await settle();
  await returnBtn.click();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Reduced motion snaps immediately back to patio');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  await page.evaluate(() => window.scrollTo(0, 0));
  mobileFirstScreen = await measureFirstScreen(page);
  assert(mobileFirstScreen.viewportBottom <= mobileFirstScreen.innerHeight, 'Mobile viewport fits the first screen');
  assert(mobileFirstScreen.selectorBottom <= mobileFirstScreen.innerHeight, 'Mobile comparison selector fits the first screen');
  assert(mobileFirstScreen.sceneBarBottom <= mobileFirstScreen.innerHeight, 'Mobile scene controls fit the first screen');
  assert(mobileFirstScreen.smallestTarget.width >= 36 && mobileFirstScreen.smallestTarget.height >= 36, 'Mobile targets are at least 36px');
  assert.equal(mobileFirstScreen.occluders, 0, 'No element covers the mobile viewport');
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    page: document.documentElement.scrollWidth,
    canvas: {
      width: document.querySelector('canvas')?.width ?? 0,
      height: document.querySelector('canvas')?.height ?? 0,
    },
  }));
  assert(dimensions.page <= dimensions.viewport, 'Narrow layout has no horizontal overflow');
  assert(dimensions.canvas.width > 0 && dimensions.canvas.height > 0, 'Canvas resizes with nonzero drawing area');
  await page.getByRole('radio', { name: 'Referencia humana', exact: true }).check();
  await page.screenshot({ path: `${output}/patio-human-mobile.png`, fullPage: true });

  await approachBtn.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'flower');
  await settle();
  await page.screenshot({ path: `${output}/flower-human-mobile.png`, fullPage: true });
  await returnBtn.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'patio');
  await settle();

  const lossState = await page.evaluate(async () => {
    const el = document.querySelector('canvas');
    const ext = el?.getContext('webgl2')?.getExtension('WEBGL_lose_context');
    if (!ext) throw new Error('Context-loss extension unavailable');
    let eventCamera;
    el.addEventListener('webglcontextlost', () => eventCamera = document.body.dataset.camera, { once: true, capture: true });
    window.sceneHoldTime = performance.now();
    document.querySelector('#approach').click();
    ext.loseContext();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const state = {
      eventCamera,
      messageVisible: !(document.querySelector('#webgl-error')?.hidden ?? true),
      buttonsDisabled: [...document.querySelectorAll('.camera-controls button')].every((b) => b.disabled),
      cameraState: document.body.dataset.camera,
    };
    window.sceneHoldTime = null;
    ext.restoreContext();
    return state;
  });
  assert.equal(lossState.eventCamera, 'approaching', 'Actual context-loss event interrupts active flower travel');
  assert(lossState.messageVisible && lossState.buttonsDisabled, 'Context loss displays recovery guidance and disables controls');
  assert.equal(lossState.cameraState, 'patio', 'Interrupted travel resets cleanly to stationary patio state');
  await page.waitForFunction(() => document.querySelector('#webgl-error')?.hidden && !document.querySelector('canvas')?.hidden);
  await settle();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Interrupted travel does not resume after restoration');
  assert(await approachBtn.isEnabled(), 'Approach button is usable again after context restoration');

  webEvidence = await verifySpiderWeb({ page, output, observations });

  observations.push('Desktop and narrow viewports render patio and flower; look-around, drag-vs-click, approach, cancel, return, reduced motion, 5 mode toggles, and context-loss recovery pass.');

  const fallback = await context.newPage();
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (String(kind).startsWith('webgl')) return null;
      return original.call(this, kind, ...args);
    };
  });
  await fallback.goto('http://127.0.0.1:4174');
  await fallback.locator('#webgl-error').waitFor({ state: 'visible' });
  assert(await fallback.locator('.viewport-footer button, .viewport-footer input').evaluateAll(controls => controls.every(control => control.disabled)), 'Initialization failure disables every scene control');
  await fallback.getByRole('button', { name: /La ciencia/ }).click();
  assert(await fallback.getByRole('link', { name: /Horth/ }).isVisible(), 'Scientific sources remain available without WebGL');
  await fallback.screenshot({ path: `${output}/webgl-fallback.png`, fullPage: true });
  await fallback.close();
  observations.push('Forced WebGL initialization failure shows readable recovery text and source links.');

  const reverse = await context.newPage();
  await reverse.goto('http://127.0.0.1:4174/?pose=reverse');
  await reverse.waitForSelector('canvas[data-ready="true"]');
  const reverseCanvas = reverse.locator('canvas');
  await reverse.getByRole('radio', { name: 'Contraste UV', exact: true }).check();
  await reverse.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const reverseUv = await reverseCanvas.screenshot();
  await reverse.getByRole('radio', { name: 'Referencia humana', exact: true }).check();
  await reverse.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert(await pixelDifference(reverse, reverseUv, await reverseCanvas.screenshot()) < 0.02, 'Petal reverse is identical in both views');
  assert.equal((await pixelStats(reverse, reverseUv)).violet, 0, 'Petal reverse contains no violet guide pixels');
  await reverse.close();
  assert.equal(transferred.length, 0, `External requests: ${transferred.join(', ')}`);

  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  try {
    const touchPage = await touchContext.newPage();
    await touchPage.goto('http://127.0.0.1:4174');
    await touchPage.waitForSelector('canvas[data-ready="true"]');
    const touchCanvas = touchPage.locator('canvas');
    await touchPage.getByRole('button', { name: 'Acercarse a la flor', exact: true }).tap();
    await touchPage.waitForFunction(() => document.body.dataset.camera === 'flower');
    await touchPage.getByRole('button', { name: 'Volver al patio', exact: true }).tap();
    await touchPage.waitForFunction(() => document.body.dataset.camera === 'patio');

    await touchCanvas.scrollIntoViewIfNeeded();
    const touchBounds = await touchCanvas.boundingBox();
    assert(touchBounds, 'Touch canvas is visible');
    const beforeTouch = await touchCanvas.screenshot();
    const session = await touchContext.newCDPSession(touchPage);
    const tx = touchBounds.x + touchBounds.width * 0.5;
    const ty = touchBounds.y + touchBounds.height * 0.5;
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tx, y: ty, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tx + 60, y: ty + 20, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert(!beforeTouch.equals(await touchCanvas.screenshot()), 'Touch drag looks around the patio');
    assert.equal(await touchPage.evaluate(() => document.body.dataset.camera), 'patio', 'Touch drag does not trigger approach');
    await touchPage.reload();
    await touchPage.waitForSelector('canvas[data-ready="true"]');
    await verifyWebTouch(touchPage);
    observations.push('Browser-emulated touch look, approach, and return pass; no physical mobile device tested.');
  } finally {
    await touchContext.close();
  }

  assert.equal(errors.length, 0, `Application errors: ${errors.join('\n')}`);
  await writeFile(`${output}/verification.json`, JSON.stringify({
    browser: browser.version(),
    platform: process.platform,
    desktop: '1440x1000',
    mobile: '390x844',
    graphics: 'Chromium software WebGL via SwiftShader',
    observations,
    errors,
    firstScreen: { desktop: desktopFirstScreen, mobile: mobileFirstScreen },
    renderStats: { patio: patioRenderStats, flower: flowerRenderStats },
    web: webEvidence,
    assetBytes: 0,
    lighting: 'afternoon',
  }, null, 2));
  console.log(observations.join('\n'));
  console.log(`Screenshots, recording, and verification metadata saved in ${output}.`);
} finally {
  await context?.close();
  await recording?.saveAs(`${output}/interaction.webm`);
  await browser?.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => (error ? reject(error) : resolve())));
}
