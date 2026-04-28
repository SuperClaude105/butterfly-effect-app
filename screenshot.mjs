import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const puppeteer = require('C:/Users/super/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer');

import { existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = './temporary screenshots';
if (!existsSync(dir)) mkdirSync(dir);

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-')).length;
const filename = label
  ? `screenshot-${existing + 1}-${label}.png`
  : `screenshot-${existing + 1}.png`;
const outPath = join(dir, filename);

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/super/.cache/puppeteer/chrome/win64-147.0.7727.56/chrome-win64/chrome.exe',
  args: ['--no-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();
console.log('Saved:', outPath);
