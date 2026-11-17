import { preview } from 'vite';

export const SCREENS = {
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
};

export async function withPreview(port, run) {
  const server = await preview({ preview: { host: '127.0.0.1', port, strictPort: true } });
  try {
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
  }
}

export async function openScene(context, origin, query = '') {
  const page = await context.newPage();
  await page.goto(`${origin}/${query}`);
  await page.waitForSelector('canvas[data-ready="true"]');
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return page;
}

export function readRenderStats(page) {
  return page.locator('canvas').evaluate((canvas) => ({
    drawCalls: Number(canvas.dataset.drawCalls),
    triangles: Number(canvas.dataset.triangles),
    geometries: Number(canvas.dataset.geometries),
    textures: Number(canvas.dataset.textures),
  }));
}

export function measureFirstScreen(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector('#viewport');
    const selector = document.querySelector('.view-selector');
    const sceneBar = document.querySelector('.viewport-footer');
    const targets = [...document.querySelectorAll('.view-selector label, .camera-controls button, #web-controls button')]
      .map((element) => element.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    const viewportRect = viewport?.getBoundingClientRect();
    const samples = [];
    if (viewportRect) {
      for (const [xRatio, yRatio] of [[0.38, 0.47], [0.67, 0.61]]) {
        const top = document.elementsFromPoint(viewportRect.left + viewportRect.width * xRatio, viewportRect.top + viewportRect.height * yRatio)[0];
        samples.push(Boolean(top && top !== viewport && !viewport?.contains(top)));
      }
    }
    return {
      scrollY,
      innerWidth,
      innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      viewportBottom: viewportRect?.bottom ?? 0,
      selectorBottom: selector?.getBoundingClientRect().bottom ?? 0,
      sceneBarBottom: sceneBar?.getBoundingClientRect().bottom ?? 0,
      smallestTarget: {
        width: Math.min(...targets.map((target) => target.width)),
        height: Math.min(...targets.map((target) => target.height)),
      },
      occluders: samples.filter(Boolean).length,
    };
  });
}

export function pixelStats(page, png) {
  return page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, image.width, image.height).data;
    let violet = 0;
    let clipped = 0;
    let crushed = 0;
    const count = image.width * image.height;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      if (blue > green * 1.2 && blue > red * 1.1) violet++;
      if (red >= 250 || green >= 250 || blue >= 250) clipped++;
      if (0.2126 * red + 0.7152 * green + 0.0722 * blue <= 10) crushed++;
    }
    return { violet: violet / count, clipped: clipped / count, crushed: crushed / count };
  }, png.toString('base64'));
}

export function pixelDifference(page, first, second) {
  return page.evaluate(async ([firstPng, secondPng]) => {
    async function pixels(base64) {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0);
      return { width: image.width, height: image.height, data: context.getImageData(0, 0, image.width, image.height).data };
    }
    const firstImage = await pixels(firstPng);
    const secondImage = await pixels(secondPng);
    if (firstImage.width !== secondImage.width || firstImage.height !== secondImage.height) return 1;
    let changed = 0;
    for (let index = 0; index < firstImage.data.length; index += 4) {
      const difference = Math.max(...[0, 1, 2].map(channel => Math.abs(firstImage.data[index + channel] - secondImage.data[index + channel])));
      if (difference > 8) changed++;
    }
    return changed / (firstImage.width * firstImage.height);
  }, [first.toString('base64'), second.toString('base64')]);
}
