import assert from 'node:assert/strict';
import { measureFirstScreen, pixelDifference } from './scene-page.mjs';

export async function verifySpiderWeb({ page, output, observations }) {
  const layoutEvidence = {};
  const idleEvidence = [];
  const canvas = page.locator('canvas');
  const web = page.getByRole('button', { name: 'Acercarse a la red', exact: true });
  const back = page.getByRole('button', { name: 'Volver al patio', exact: true });
  const status = page.locator('#web-status');
  const sector = (id) => page.getByRole('button', { name: `Sector ${id}`, exact: true });
  const human = page.getByRole('radio', { name: 'Red: referencia humana', exact: true });
  const vibrations = page.getByRole('radio', { name: 'Vibraciones', exact: true });
  const next = page.getByRole('button', { name: 'Buscar una mosca', exact: true });
  const repeat = page.getByRole('button', { name: 'Repetir señal', exact: true });
  const phase = () => page.evaluate(() => document.body.dataset.webPhase);
  const counters = () => page.evaluate(() => ({ ...window.sceneCounters }));
  const idle = async (description) => {
    await page.waitForTimeout(2000);
    const before = await counters();
    await page.waitForTimeout(150);
    const after = await counters();
    assert.deepEqual(after, before, `${description}: no idle RAF requests or WebGL draws`);
    idleEvidence.push({ description, before, after });
  };
  const fit = async (label) => {
    await page.evaluate(() => scrollTo(0, 0));
    const dimensions = await measureFirstScreen(page);
    layoutEvidence[label] = dimensions;
    assert(dimensions.sceneBarBottom <= dimensions.innerHeight, `${label}: every contextual control fits first screen`);
    assert(dimensions.scrollWidth <= dimensions.innerWidth, `${label}: no horizontal overflow`);
    assert.equal(dimensions.occluders, 0, `${label}: canvas is uncovered`);
    assert(await page.locator('.specimen-heading').evaluate(heading => {
      const bottom = heading.getBoundingClientRect().bottom;
      return [...heading.children].every(child => child.getBoundingClientRect().bottom <= bottom);
    }), `${label}: species and heading text stay above the canvas`);
    assert(dimensions.smallestTarget.width >= 36 && dimensions.smallestTarget.height >= 36, `${label}: visible controls retain 36px targets`);
  };
  const source = async () => {
    const match = (await status.textContent()).match(/Señal más intensa hacia el sector ([1-4])/);
    assert(match, 'Visible signal includes equivalent accessible direction');
    return Number(match[1]);
  };
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await web.click();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'approaching');
  await back.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'patio');
  await web.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.body.dataset.camera === 'web');
  await fit('Desktop web');
  await page.getByRole('button', { name: /La ciencia/ }).click();
  assert(await page.locator('#spider-lesson').isVisible(), 'Web has its own scientific explanation');
  assert(await page.locator('#bee-lesson').isHidden(), 'Flower explanation yields to web explanation');
  await page.keyboard.press('Escape');
  await sector(1).focus();
  await page.keyboard.press('Enter');
  assert.equal(await source(), 1, 'Keyboard sector 1 creates first directional cue');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(80);
  const firstCue = await canvas.screenshot();
  await page.waitForTimeout(120);
  assert(await pixelDifference(page, firstCue, await canvas.screenshot()) < 0.02, 'Enabling reduced motion midpulse immediately settles a static cue');
  let hitBounds = await canvas.boundingBox();
  assert(hitBounds);
  await page.mouse.click(hitBounds.x + hitBounds.width * 0.69, hitBounds.y + hitBounds.height * 0.5);
  assert.equal(await source(), 2, 'Actual canvas hit at the right creates sector 2 cue');
  const distinctSectorDifference = await pixelDifference(page, firstCue, await canvas.screenshot());
  assert(distinctSectorDifference > 0.0001, `Distinct sectors produce distinct rendered static signals (changed ${distinctSectorDifference})`);
  await page.mouse.click(hitBounds.x + hitBounds.width * 0.5, hitBounds.y + hitBounds.height * 0.3);
  assert.equal(await source(), 1, 'Second distinct canvas hit creates sector 1 cue');
  assert(await pixelDifference(page, firstCue, await canvas.screenshot()) < 0.02, 'Canvas hit uses the same numbered-sector table as accessible buttons');
  const beforeDrag = await status.textContent();
  let bounds = await canvas.boundingBox();
  assert(bounds);
  await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.7, bounds.y + bounds.height * 0.45, { steps: 5 });
  await page.mouse.up();
  assert.equal(await status.textContent(), beforeDrag, 'Dragging the web does not generate a signal or guess');
  assert.equal(await phase(), 'explore');
  await human.check();
  const hiddenPreyBaseline = await canvas.screenshot();
  await next.click();
  assert.equal(await phase(), 'search');
  assert(await pixelDifference(page, hiddenPreyBaseline, await canvas.screenshot()) < 0.02, 'Searching hides prey in human mode');
  assert.match(await status.textContent(), /oculta en ambos modos/);
  assert.doesNotMatch(await status.textContent(), /Señal más intensa hacia el sector/, 'Human reference explains how to enable vibration cues');
  await vibrations.check();
  const answer = await source();
  const searchCue = await canvas.screenshot();
  await human.check();
  await vibrations.check();
  assert(await pixelDifference(page, searchCue, await canvas.screenshot()) < 0.02, 'Mode switches preserve camera pose and searching round');
  assert.equal(await source(), answer);
  assert.equal(await phase(), 'search');
  const wrong = answer === 4 ? 1 : answer + 1;
  await sector(wrong).click();
  assert.match(await status.textContent(), /Ese sector no es/);
  assert.equal(await phase(), 'search', 'Wrong answer allows retry');
  await repeat.click();
  assert.equal(await source(), answer, 'Replay preserves challenge source');
  assert.equal(await phase(), 'search');
  const publicControls = await page.locator('#web-controls button').allTextContents();
  assert.deepEqual(publicControls, ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Buscar una mosca', 'Repetir señal'], 'Button names do not leak the challenge answer');
  assert.equal(await page.locator('[data-answer], [data-source], [data-target-sector]').count(), 0, 'No hidden answer attributes exist');
  await page.screenshot({ path: `${output}/web-vibrations-desktop.png`, fullPage: true });
  await sector(answer).focus();
  await page.keyboard.press('Enter');
  assert.equal(await phase(), 'found');
  assert.match(await status.textContent(), /¡Encontrada!/);
  await human.check();
  assert(await pixelDifference(page, hiddenPreyBaseline, await canvas.screenshot()) > 0.02, 'Successful search reveals the insect in human mode');
  await page.screenshot({ path: `${output}/web-found-human-desktop.png`, fullPage: true });
  await next.click();
  assert.equal(await phase(), 'search');
  assert(await pixelDifference(page, hiddenPreyBaseline, await canvas.screenshot()) < 0.02, 'New round hides the found insect again');
  await vibrations.check();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  await fit('Mobile searching web');
  await page.screenshot({ path: `${output}/web-vibrations-mobile.png`, fullPage: true });
  await back.click();
  assert.equal(await phase(), 'explore', 'Leaving clears unfinished round and signal');
  await web.click();
  assert.equal(await phase(), 'explore');
  assert.match(await status.textContent(), /Aún no hay una señal/);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await sector(4).click();
  await back.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'patio');
  assert.equal(await phase(), 'explore', 'Departure during pulse cancels its signal');
  await idle('Patio after departing midpulse');
  await web.click();
  await page.waitForFunction(() => document.body.dataset.camera === 'web');
  await sector(3).click();
  await idle('Bounded web pulse');

  for (const state of ['pulse', 'search', 'travel']) {
    if (state === 'search') await next.click();
    if (state === 'travel') {
      await back.click();
      await page.waitForFunction(() => document.body.dataset.camera === 'patio');
    }
    const loss = await page.evaluate(async (state) => {
      const ext = document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context');
      assertExtension(ext);
      function assertExtension(value) { if (!value) throw new Error('Context-loss extension unavailable'); }
      let eventCamera;
      document.querySelector('canvas').addEventListener('webglcontextlost', () => {
        eventCamera = document.body.dataset.camera;
      }, { once: true, capture: true });
      if (state === 'travel') {
        window.sceneHoldTime = performance.now();
        document.querySelector('#approach-web').click();
      }
      if (state === 'pulse') {
        window.sceneHoldTime = performance.now();
        document.querySelector('#web-sectors button').click();
      }
      const before = document.body.dataset.camera;
      ext.loseContext();
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = {
        before,
        eventCamera,
        disabled: [...document.querySelectorAll('.viewport-footer button, .viewport-footer input')].every(control => control.disabled),
        error: !document.querySelector('#webgl-error').hidden,
        phase: document.body.dataset.webPhase,
      };
      window.sceneHoldTime = null;
      ext.restoreContext();
      return result;
    }, state);
    assert.equal(loss.before, state === 'travel' ? 'approaching' : 'web', `${state}: context loss is triggered in the intended live state`);
    assert.equal(loss.eventCamera, state === 'travel' ? 'approaching' : 'web', `${state}: actual context-loss event interrupts the intended state`);
    assert(loss.disabled && loss.error, `${state}: context loss disables every scene control including radios`);
    assert.equal(loss.phase, 'explore', `${state}: context loss clears challenge`);
    await page.waitForFunction(() => document.querySelector('#webgl-error').hidden && !document.querySelector('canvas').hidden);
    assert.equal(await phase(), 'explore');
    if (state === 'travel') assert.equal(await page.evaluate(() => document.body.dataset.camera), 'patio', 'Interrupted web travel never resumes');
    else assert.match(await status.textContent(), /Aún no hay una señal/, `${state}: restoration retains no stale signal`);
    await idle(`Restored after ${state}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const overviewBounds = await canvas.boundingBox();
  assert(overviewBounds);
  await page.mouse.click(overviewBounds.x + overviewBounds.width * 0.68, overviewBounds.y + overviewBounds.height * 0.61);
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'web', 'Clicking the visible web in the patio approaches the web');
  await back.click();
  observations.push('Web has four rendered numbered sectors, distinct keyboard/pointer signals, fixed-pose human/vibration comparison, hidden prey, retry, success, replay, new rounds, responsive controls, motion-change settling, bounded RAF/WebGL draws, exit cancellation, and context-loss cancellation during pulse/search/travel.');
  return { layouts: layoutEvidence, idle: idleEvidence, contextLossProbe: 'Real WEBGL_lose_context with test-only RAF timestamp hold during pulse and travel' };
}

export async function verifyWebTouch(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Acercarse a la red', exact: true }).tap();
  assert.equal(await page.evaluate(() => document.body.dataset.camera), 'web');
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds = await page.locator('canvas').boundingBox();
  assert(bounds);
  const beforeDrag = await page.locator('#web-status').textContent();
  const session = await page.context().newCDPSession(page);
  const from = { x: bounds.x + bounds.width * 0.5, y: bounds.y + bounds.height * 0.3, id: 1 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...from, x: from.x + 50, y: from.y + 30 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await session.detach();
  assert.equal(await page.locator('#web-status').textContent(), beforeDrag, 'Touch drag across the web does not generate a signal');
  await page.touchscreen.tap(bounds.x + bounds.width * 0.69, bounds.y + bounds.height * 0.5);
  assert.match(await page.locator('#web-status').textContent(), /Has tocado el sector 2/, 'Touch on the rendered web creates a sector signal');
  await page.getByRole('button', { name: 'Buscar una mosca', exact: true }).tap();
  const match = (await page.locator('#web-status').textContent()).match(/Señal más intensa hacia el sector ([1-4])/);
  assert(match);
  await page.getByRole('button', { name: `Sector ${match[1]}`, exact: true }).tap();
  assert.equal(await page.evaluate(() => document.body.dataset.webPhase), 'found', 'Touch controls complete the challenge');
  await page.getByRole('button', { name: 'Volver al patio', exact: true }).tap();
}
