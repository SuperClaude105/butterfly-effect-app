const { createRequire } = require('module');
const requireFrom = createRequire('file:///C:/Users/super/AppData/Local/Temp/puppeteer-test/');
const puppeteer = requireFrom('puppeteer');
const fs = require('fs');

const story = fs.readFileSync('storied-complete.txt', 'utf8');
const divider = '═'.repeat(60);
const chapters = story.split(divider).map(c => c.trim()).filter(Boolean);

function formatChapter(text) {
  const lines = text.split('\n');
  let html = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { html += '<div class="spacer"></div>'; continue; }
    if (trimmed.startsWith('# ')) {
      html += `<h2>${trimmed.replace(/^# /, '')}</h2>`;
    } else if (trimmed === '---') {
      html += '<hr>';
    } else {
      html += `<p>${trimmed.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
    }
  }
  return html;
}

const chaptersHtml = chapters.map((ch, i) => `
  <div class="chapter ${i > 0 ? 'page-break' : ''}">
    ${formatChapter(ch)}
  </div>
`).join('\n');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.85;
    color: #1a1a1a;
    background: white;
  }
  .title-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 60px 50px;
  }
  .title-page h1 {
    font-size: 48pt;
    font-weight: normal;
    letter-spacing: 0.05em;
    margin-bottom: 20px;
  }
  .title-page .subtitle {
    font-style: italic;
    font-size: 14pt;
    color: #555;
    margin-bottom: 50px;
  }
  .title-page .names {
    font-size: 10pt;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #888;
    font-family: Arial, sans-serif;
    font-weight: 300;
  }
  .dedication-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 80px 60px;
  }
  .dedication-page p {
    font-style: italic;
    font-size: 12pt;
    line-height: 2.2;
    color: #444;
  }
  .chapter { padding: 60px 65px; }
  .page-break { page-break-before: always; }
  h2 {
    font-size: 20pt;
    font-weight: normal;
    margin-bottom: 32px;
    padding-bottom: 18px;
    border-bottom: 1px solid #ddd;
  }
  p {
    margin-bottom: 0;
    text-indent: 1.5em;
  }
  p + hr + p,
  h2 + p,
  hr + p { text-indent: 0; }
  hr {
    border: none;
    text-align: center;
    margin: 24px 0;
  }
  hr::after {
    content: '· · ·';
    color: #aaa;
    font-size: 13pt;
    letter-spacing: 0.4em;
  }
  .spacer { height: 4px; }
</style>
</head>
<body>

<div class="title-page">
  <h1>Storied</h1>
  <p class="subtitle">A memoir of Gerry &amp; Jess</p>
  <p class="names">Gerry Van Loon &amp; Jess Messier</p>
</div>

<div class="dedication-page page-break">
  <p>For Jess —<br>who said yes<br>and asked if we could go.</p>
</div>

${chaptersHtml}

</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Users/super/.cache/puppeteer/chrome/win64-147.0.7727.56/chrome-win64/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: 'Storied — Gerry & Jess.pdf',
    format: 'A5',
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
    printBackground: true,
  });
  await browser.close();
  console.log('✓ PDF saved: Storied — Gerry & Jess.pdf');
})();
