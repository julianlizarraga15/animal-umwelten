import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const output = "test-results/patio/botanical-specimen";
const reference = "docs/art-direction/jardin-de-la-tarde.png";
const includeCatalog = process.argv.includes("--catalog");
await mkdir(output, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});

async function settle() {
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function captureViews(name, button, statusText) {
  await page.getByRole("button", { name: button }).click();
  await page.getByRole("status").filter({ hasText: statusText }).waitFor();
  const paths = [];
  for (const [view, label] of [["overview", "Vista general"], ["close", "Acercar"], ["oblique", "Oblicua"]]) {
    await page.getByRole("button", { name: label }).click();
    await settle();
    const path = `${output}/${name}-afternoon-${view}.png`;
    await page.screenshot({ path });
    paths.push([view, path]);
  }
  return paths;
}

async function sideBySide(views) {
  const dataUrl = async (path) => `data:image/png;base64,${(await readFile(path)).toString("base64")}`;
  const referenceUrl = await dataUrl(reference);
  const compare = await browser.newPage({ viewport: { width: 1640, height: 480 }, deviceScaleFactor: 1 });
  for (const [view, path] of views) {
    await compare.setContent(`<body style="margin:0;display:flex;gap:8px;background:#1d1611">
      <img src="${referenceUrl}" style="height:480px">
      <img src="${await dataUrl(path)}" style="height:480px">
    </body>`);
    await compare.waitForFunction(() => [...document.images].every((image) => image.complete));
    await compare.screenshot({ path: `${output}/rudbeckia-vs-reference-${view}.png` });
  }
  await compare.close();
}

try {
  await page.goto("http://127.0.0.1:5173/experiments/botanical-specimen/");
  await page.getByRole("status").filter({ hasText: "Rudbeckia" }).waitFor();
  await sideBySide(await captureViews("rudbeckia", "Rudbeckia modelada", "Rudbeckia"));
  if (includeCatalog) {
    await captureViews("syngonium", "Syngonium · Poly Haven", "Syngonium");
    await captureViews("sunflower", "Girasol · Grab3D", "Girasol");
  }
  console.log(JSON.stringify({ errors }, null, 2));
} finally {
  await browser.close();
}
