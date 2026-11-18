import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const output = "test-results/patio/botanical-specimen";
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

try {
  await page.goto("http://127.0.0.1:5173/experiments/botanical-specimen/");
  await page.getByRole("status").filter({ hasNotText: "Cargando" }).waitFor();
  await settle();
  await page.screenshot({ path: `${output}/syngonium-afternoon-overview.png` });
  await page.getByRole("button", { name: "Acercar" }).click();
  await settle();
  await page.screenshot({ path: `${output}/syngonium-afternoon-close.png` });
  await page.getByRole("button", { name: "Oblicua" }).click();
  await settle();
  await page.screenshot({ path: `${output}/syngonium-afternoon-oblique.png` });

  await page.getByRole("button", { name: "Girasol · Grab3D" }).click();
  await page.getByRole("status").filter({ hasText: "Girasol" }).waitFor();
  await page.getByRole("button", { name: "Vista general" }).click();
  await settle();
  await page.screenshot({ path: `${output}/sunflower-afternoon-overview.png` });
  await page.getByRole("button", { name: "Acercar" }).click();
  await settle();
  await page.screenshot({ path: `${output}/sunflower-afternoon-close.png` });
  await page.getByRole("button", { name: "Oblicua" }).click();
  await settle();
  await page.screenshot({ path: `${output}/sunflower-afternoon-oblique.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await settle();
  await page.screenshot({ path: `${output}/sunflower-afternoon-portrait.png` });
  console.log(JSON.stringify({ errors }, null, 2));
} finally {
  await browser.close();
}
