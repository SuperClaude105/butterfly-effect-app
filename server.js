require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { createRequire } = require('module');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));
app.get('/', (_req, res) => res.redirect('/login.html'));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Dynamic system prompt builder ────────────────────────────────────────
function buildSystemPrompt(config = {}) {
  const genre        = config.genre           || 'Dark Romance';
  const protagonist  = config.protagonistName || 'the protagonist';
  const loveInterest = config.loveInterestName|| 'the love interest';
  const ageRange     = config.ageRange        || 'late 20s';
  const themes       = (config.themes || []).join(', ') || 'dark and atmospheric';
  const storyIdea    = config.storyIdea       || '';
  const avoid        = config.triggerAvoid    || [];
  const chapters     = config.targetChapters  || 20;

  const avoidBlock = avoid.length
    ? `\n\nSTRICT CONTENT RULES — never include, reference, or imply the following: ${avoid.join(', ')}. This is non-negotiable.`
    : '';

  const ideaBlock = storyIdea
    ? `\n\nAUTHOR'S CONCEPT: "${storyIdea}" — treat this as the core premise. Expand it with rich world-building and character depth, but honour the author's vision.`
    : '';

  // ── Sequel context ──────────────────────────────────────────────────────
  const sequelBlock = config.parentBookTitle && config.parentBookBible
    ? `\n\nSEQUEL CONTEXT: This is a sequel set in the same world as "${config.parentBookTitle}". The world, lore, and history from that story exist here. Here is the world bible from the previous book:\n${config.parentBookBible}\nHonour that world while telling a fresh story with new protagonists and conflicts.`
    : '';

  // ── Name uniqueness (skip for sequels — they intentionally share names) ─
  const usedNames = (config.usedNames || []).filter(Boolean);
  const namesBlock = (usedNames.length && !config.isSequel)
    ? `\n\nNAME UNIQUENESS: The following names are already used in this reader's other stories — do NOT reuse them for main characters: ${usedNames.join(', ')}. Choose fresh, distinctive names that feel native to this story's world.`
    : '';

  // ── Series flag ─────────────────────────────────────────────────────────
  const seriesBlock = config.isSeries
    ? `\n\nSERIES NOTE: This is Book 1 in a planned series. The ending must be satisfying and complete for this book, but deliberately leave meaningful threads open — unresolved mysteries, a wider world to explore, relationships with more to say. Plant seeds for future volumes without making this book feel unfinished.`
    : '';

  const isRomance   = config.isRomance !== false;
  const isTrueCrime = genre === 'True Crime';
  const victim      = config.victimName || '';
  const victimDesc  = config.victimDescription || '';

  let charactersBlock = isRomance
    ? `CHARACTERS:\n- Protagonist: ${protagonist}, ${ageRange}\n- Love interest: ${loveInterest}, ${ageRange}`
    : loveInterest && loveInterest !== 'the love interest'
      ? `CHARACTERS:\n- Protagonist: ${protagonist}, ${ageRange}\n- Key character: ${loveInterest}`
      : `CHARACTERS:\n- Protagonist: ${protagonist}, ${ageRange}`;

  if (isTrueCrime) {
    const victimLine = victim ? victim : '(give them a vivid, specific name and identity in Chapter 1)';
    const descLine   = victimDesc ? `\n  Details about them: "${victimDesc}" — honour these details precisely. This person may be based on someone real to the reader.` : '';
    charactersBlock += `\n- Victim / Missing person: ${victimLine}${descLine}\n  Their fate is the mystery at the heart of this story. Every chapter must slowly reveal more about who they were, what happened, and why it was covered up. Make the reader feel the weight of their absence.`;
  }

  const proseStyle = isRomance
    ? '- Lush, atmospheric, emotionally intense — slow-burn romance with real tension\n- Adult themes handled with literary weight. No purple prose.'
    : isTrueCrime
      ? '- Gripping, propulsive, journalistic with literary depth — the prose of a true crime book that keeps you reading at 2am\n- Alternate between the investigator\'s present-day search and vivid flashbacks to the victim\'s life\n- Each chapter should end with a revelation, a new suspect, or a detail that reframes everything before it\n- The victim must feel like a real person — not just a case file. Show who they were before they became a mystery.'
      : '- Lush, atmospheric, emotionally intense — driven by character, stakes, and dread\n- Tone matched to genre: thrillers run taut and propulsive; horror lingers; fantasy breathes wide.';

  // ── Genre-specific mood palette guidance ──────────────────────────────────
  const moodPaletteGuide = {
    'Dark Romance':          'Deep crimson primary (#8B0000–#a00020), near-black secondary (#0d0505–#180808), warm gold accent (#c4a264). Particles: embers or petals.',
    'Fantasy Romance':       'Midnight violet primary (#5a1a8a–#7b2fbf), deep purple-black secondary (#0e0514–#1a0a2e), rose-gold or pale lavender accent (#d4a0c8–#e8c4d0). Particles: petals or sparks.',
    'Contemporary Romance':  'Warm coral or deep rose primary (#c0445a–#d4607a), dark charcoal secondary (#0f0a0c–#1a1012), warm champagne accent (#e8c88a–#f0d8a0). Particles: petals or none.',
    'Paranormal Romance':    'Deep amethyst primary (#6b1a9a–#8a2bbf), midnight secondary (#0a0514–#150a20), moonlit silver accent (#c8d4e8–#a0b4d0). Particles: ash or petals.',
    'Romantic Thriller':     'Deep teal-crimson primary (#8B0030–#b00040), dark secondary (#080c14–#100810), cold gold accent (#c0a840–#d4bc50). Particles: ash or embers.',
    'Historical Romance':    'Burnished amber primary (#8B4513–#a05a20), warm sepia secondary (#0e0a06–#1a1008), ivory-gold accent (#d4b87a–#e8d090). Particles: dust or petals.',
    'Psychological Thriller':'Cold slate-blue primary (#1a3a5c–#2a5080) for tense scenes; shift toward sickly grey-green (#2a3a2a) for paranoia; deep crimson (#6a0808) when violence or revelation peaks. Near-black cool secondary (#060a0e–#0a1018), clinical steel accent (#8aaccc). Particles: ash or dust.',
    'Crime Thriller':        'Gritty dark steel (#2a3040) for investigation scenes; deep blood-crimson (#6a0808–#8a0a0a) for crime scenes and confrontations; cold charcoal (#0e1014) secondary. Cold amber accent (#c4a020) for clues and tension beats. Particles: ash or dust. Never stay in one palette — shift the primary hard when the chapter turns violent or reveals something brutal.',
    'Mystery':               'Deep indigo primary (#2a1a5c–#3a2880), dark purple-black secondary (#080614–#100a1e), warm amber accent (#c4a030–#d8b840). Shift toward blood-crimson primary (#6a0808) when a body or key secret is discovered. Particles: dust or none.',
    'True Crime':            'Cold investigative blue-grey (#2a3848–#3a4e60) for interview/research scenes; bleed into muted blood-crimson (#5a0a0a–#780c0c) for flashback scenes depicting what happened to the victim; clinical near-black secondary (#060810). Stark cold accent (#a0b8cc). Particles: ash or dust. The palette should feel like evidence photos — cold, stark, with flashes of horror.',
    'Dark Fantasy':          'Forest-black primary (#1a3a1a–#2a5030) or deep violet (#3a1a5c), near-black secondary (#060a06–#0e0814), pale emerald or ghostly accent (#7abf8a–#a0d4b0). Particles: ash or embers.',
    'Epic Fantasy':          'Royal cobalt primary (#1a2a8B–#2a3aaa), deep midnight secondary (#060814–#0a1020), burnished gold accent (#d4a020–#e8bc30). Particles: sparks or dust.',
    'Urban Fantasy':         'Electric teal primary (#0a6a7a–#1a8a9a), dark urban secondary (#080a0c–#0e1214), neon accent (#40d4b0–#60e8c8). Particles: sparks or dust.',
    'Science Fiction':       'Deep space blue primary (#0a1a3a–#1a2a5a), void black secondary (#04060e–#080c18), electric cyan accent (#20c8e8–#40d8f0). Particles: sparks or none.',
    'Cyberpunk':             'Electric magenta-purple primary (#6a0a8a–#8a1aaa), near-black secondary (#06040e–#0c0818), neon green or cyan accent (#20e840–#40f0a0). Particles: sparks.',
    'Dystopian':             'Ash-brown primary (#4a3820–#5a4830), concrete secondary (#0a0906–#141210), muted rust accent (#c06030–#d07040). Particles: ash or dust.',
    'Supernatural Horror':   'Sickly crimson-black primary (#5a0808–#780a0a), void secondary (#040404–#0a0606), sickly pale accent (#8a9a78–#a0b090). Particles: ash or embers.',
    'Psychological Horror':  'Muted grey-green primary (#2a3a2a–#3a4e3a), washed secondary (#060808–#0c1010), pale sickly accent (#90a888–#b0c0a8). Particles: ash or none.',
    'Historical Fiction':    'Warm sepia primary (#6a3a10–#8a5020), aged parchment secondary (#0e0a06–#18120a), burnished gold accent (#c4960a–#d8aa20). Particles: dust or none.',
    'Adventure':             'Ocean teal or terracotta primary (#1a5a5a–#2a7a7a or #8a4020–#aa5830), earthy secondary (#080e0a–#0e1410), warm sunlit accent (#d4a030–#e8bc40). Particles: dust or sparks.',
  };

  const paletteHint = moodPaletteGuide[genre] || 'Choose colors appropriate to the story\'s emotional tone and genre.';

  return `You are narrating an original ${genre} novel — ${chapters} chapters total.

${charactersBlock}

THEMES & SETTING: ${themes}
${ideaBlock}

PROSE STYLE (literary bestseller quality):
- Third-person limited POV, following the protagonist
${proseStyle}
- Sensory and cinematic: long sentences that breathe, short ones that cut
- Every word earns its place. No filler. No clichés.
- Chapter length: 650–900 words of prose
${avoidBlock}${sequelBlock}${seriesBlock}${namesBlock}

RESPONSE FORMAT — include ALL FIVE blocks after every chapter, in this exact order:

<booktitle>A thrilling, evocative book title that makes a reader stop and reach for it — vivid, atmospheric, specific to this story's world. Never generic. Only include in Chapter 1; omit from all other chapters.</booktitle>

<title>Chapter Title (evocative, 2–5 words)</title>

<mood>
CRITICAL: The palette MUST shift meaningfully with every chapter. Never repeat the same primaryColor in consecutive chapters. Each chapter has a distinct emotional beat — match it precisely. A chapter of quiet grief feels different from confrontation, which feels different from revelation, which feels different from aftermath. Use the full range below.

MOOD OPTIONS (pick the one that best fits THIS chapter's emotional core):
- Discovery/Clue: revelatory | Grief/Loss: mournful | Intimacy/Quiet: tender | Confrontation: volatile
- Danger/Chase: frantic | Aftermath/Shock: hollow | Manipulation: sinister | Investigation: clinical
- Romantic tension: charged | Dark secret revealed: dread | Hope emerging: tentative | Victory: triumphant
- Despair: bleak | Paranoia: unraveling | Betrayal: bitter | Action/Battle: fierce
- Mystery deepens: cryptic | Flashback: nostalgic | Horror moment: visceral | Foreboding: ominous
- Wonder/Awe: ethereal | Gritty reality: raw | Melancholy: wistful | Obsession: consuming

{
  "mood": "choose one mood word from the list above that captures THIS specific chapter",
  "primaryColor": "#hexcode — GENRE PALETTE: ${paletteHint} Shift the exact hue and lightness to match THIS chapter's beat. Tense chapters go darker and more saturated. Quiet chapters go slightly lighter or more muted. Never the same shade twice in a row.",
  "secondaryColor": "#hexcode — the background color. Keep dark enough for light text to read clearly. Can be slightly warmer or cooler based on mood.",
  "accentColor": "#hexcode — headings and UI highlights. Should contrast with secondaryColor and complement primaryColor.",
  "particles": "one of: embers|petals|ash|sparks|dust|snow|none — vary this too. Calm chapters: none or dust. Tense: ash. Violent/dark: embers or ash. Magical/hopeful: sparks or petals. Winter/cold: snow.",
  "atmosphere": "one precise evocative word — not generic. Examples: suffocating, gossamer, relentless, spectral, sunlit, brackish, smoldering, hollow, electric, crystalline, decayed, fevered, hushed, fractured, gilded, murky, volatile, ancient, stark, velvet"
}
</mood>

<decisions>
[
  {
    "prompt": "A question framing the protagonist's choice (one sentence)",
    "options": ["Option A (3–6 words)", "Option B (3–6 words)", "Option C (3–6 words)"]
  }
]
</decisions>

<bible>
STORY BIBLE (200 words max): What has happened. Key decisions made. Where characters stand emotionally. Active plot threads. Present tense.
</bible>

IMPORTANT: All blocks required (except <booktitle> after Chapter 1). JSON must be valid. No commentary outside these blocks after the prose.`;
}

// ─── Embers hardcoded prompt (legacy — used by embers.html) ───────────────
const EMBERS_PROMPT = buildSystemPrompt({
  genre: 'Dark Romance',
  protagonistName: 'Lyra Vaseth, a cartographer\'s apprentice who can see "death-threads" — silver cords connecting the living to their moment of death',
  loveInterestName: 'Caelan Dusk, ageless High Lord of the Ashen Court whose power is shadow itself — cold, precise, feared by every court in every realm',
  ageRange: 'early 20s',
  themes: ['Fae court', 'forbidden magic', 'enemies to lovers', 'political intrigue', 'dark atmosphere'],
  storyIdea: 'Lyra is brought to the Ashen Court as a political bargaining chip, unaware Caelan specifically requested her — because he has seen her death-thread, and it leads directly to him.',
  targetChapters: 30,
});

// ─── Response parser ───────────────────────────────────────────────────────
function parseResponse(text) {
  const extract = (tag) => {
    const m = text.match(new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*<\\/${tag}>`));
    return m ? m[1].trim() : null;
  };

  const bookTitleRaw = extract('booktitle') || null;
  const titleRaw     = extract('title') || 'Into the Dark';
  const moodRaw      = extract('mood');
  const decisionsRaw = extract('decisions');
  const bibleRaw     = extract('bible') || '';

  const chapterText = text
    .replace(/<booktitle>[\s\S]*?<\/booktitle>/g, '')
    .replace(/<title>[\s\S]*?<\/title>/g, '')
    .replace(/<mood>[\s\S]*?<\/mood>/g, '')
    .replace(/<decisions>[\s\S]*?<\/decisions>/g, '')
    .replace(/<bible>[\s\S]*?<\/bible>/g, '')
    .trim();

  let mood = {
    mood: 'dark',
    primaryColor: '#8B0000',
    secondaryColor: '#0d0505',
    accentColor: '#c4a264',
    particles: 'embers',
    atmosphere: 'shadowed',
  };

  let decisions = [{ prompt: 'What does Lyra do next?', options: ['Press forward', 'Hold her ground'] }];

  if (moodRaw) {
    try { mood = JSON.parse(moodRaw); } catch (_) {}
  }
  if (decisionsRaw) {
    try { decisions = JSON.parse(decisionsRaw); } catch (_) {}
  }

  return { chapterText, bookTitle: bookTitleRaw, title: titleRaw, mood, decisions, bible: bibleRaw };
}

// ─── API: Start (Chapter 1) ────────────────────────────────────────────────
app.post('/api/start', async (req, res) => {
  const { storyConfig } = req.body;
  const systemPrompt = storyConfig ? buildSystemPrompt(storyConfig) : EMBERS_PROMPT;

  const openingInstruction = storyConfig
    ? `Generate Chapter 1. This is the very beginning. Establish the protagonist's ordinary world before everything changes. Introduce ${storyConfig.protagonistName || 'the protagonist'} and hint at the world they're about to enter. End at a moment of disruption — something that makes turning back impossible. Make it atmospheric and compelling. For the <booktitle>: craft a thrilling, evocative title specific to this story's world — the kind that makes someone stop and reach for the book. Think "Embers of the Ashen Court" or "A Court of Thorns and Roses" — vivid, specific, impossible to ignore. Never use "[Name]'s Story" or generic phrasing.`
    : `Generate Chapter 1. This is the very beginning. Introduce Lyra in her ordinary world — late at night in her master's cartography workshop — the first moment she sees a death-thread. The shock. The wrongness of it. End at the moment everything changes: the arrival of something that will pull her toward the Ashen Court. Make it ominous and beautiful. Include the <booktitle> block.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: openingInstruction }],
    });

    const parsed = parseResponse(response.content[0].text);
    res.json({ success: true, ...parsed, chapterNumber: 1 });
  } catch (err) {
    console.error('Error generating chapter 1:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Next chapter ─────────────────────────────────────────────────────
app.post('/api/chapter', async (req, res) => {
  const { storyBible, decision, chapterNumber, storyConfig } = req.body;
  const systemPrompt = storyConfig ? buildSystemPrompt(storyConfig) : EMBERS_PROMPT;
  const protagonist  = storyConfig?.protagonistName || 'the protagonist';
  const loveInterest = storyConfig?.loveInterestName || 'the love interest';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: `STORY BIBLE (current state):\n${storyBible}\n\nREADER'S DECISION: "${decision}"\n\nGenerate Chapter ${chapterNumber}. The reader's choice must carry real weight — let it shape where ${protagonist} ends up, what they discover, how ${loveInterest} responds. Continue building the slow-burn tension. This chapter should feel like a consequence of that choice.`,
        },
      ],
    });

    const parsed = parseResponse(response.content[0].text);
    res.json({ success: true, ...parsed, chapterNumber });
  } catch (err) {
    console.error(`Error generating chapter ${chapterNumber}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Generate spine SVG ──────────────────────────────────────────────
app.post('/api/generate-spine', async (req, res) => {
  const { title, genre, themes, protagonistName, loveInterestName, storyIdea } = req.body;
  const themeStr = (themes || []).slice(0, 4).join(', ') || genre;
  const safeTitle = (title || 'Untitled').replace(/"/g, "'");

  const prompt = `You are a book cover designer. Create a vertical book spine as a self-contained SVG.

Book details:
- Title: "${safeTitle}"
- Genre: ${genre || 'Dark Romance'}
- Themes: ${themeStr}
- Characters: ${protagonistName || 'protagonist'} & ${loveInterestName || 'love interest'}
${storyIdea ? `- Premise: ${storyIdea.slice(0, 120)}` : ''}

SVG REQUIREMENTS — follow exactly:
1. Dimensions: width="80" height="260" xmlns="http://www.w3.org/2000/svg"
2. Rich dark gradient background appropriate to genre/themes (use <defs> and <linearGradient> or <radialGradient>)
3. Title text displayed vertically (use transform="rotate(-90)" on a <text> element, centered on the spine). Font: Georgia or serif. Size: 10-12px. Color: light/warm tone. Clip text if too long.
4. One or two small decorative SVG elements (paths, circles, simple icons) related to the themes — e.g. roses, flames, moons, crowns, daggers, feathers, stars, dragons. Keep them elegant and small.
5. Thin horizontal ornamental lines near top and bottom
6. All resources self-contained — no external images, no web fonts
7. No text wider than 70px

Return ONLY the raw SVG code. Start with <svg. End with </svg>. No markdown. No explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    let svg = response.content[0].text.trim()
      .replace(/^```(?:svg|xml)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    if (!svg.startsWith('<svg')) return res.status(422).json({ error: 'Invalid SVG' });
    res.json({ success: true, svg });
  } catch (err) {
    console.error('Spine generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PDF export is handled client-side via window.print() in read.html

// ─── PDF HTML builder (kept for reference — export is now client-side) ────
function buildPDFHtml(chapters, decisions, titles) {
  const chapterBlocks = chapters.map((text, i) => {
    const paragraphs = text
      .split(/\n\n+/)
      .filter(p => p.trim())
      .map(p => `<p>${p.trim()}</p>`)
      .join('\n');

    const decisionNote = decisions[i]
      ? `<div class="decision-divider"><span class="decision-text">You chose: ${decisions[i]}</span></div>`
      : '';

    return `
      <div class="chapter">
        <div class="chapter-num">Chapter ${i + 1}</div>
        <h2 class="chapter-title">${titles?.[i] || ''}</h2>
        <div class="chapter-body">${paragraphs}</div>
        ${decisionNote}
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 12.5pt;
    line-height: 1.85;
    color: #1a0d05;
    background: #faf6f0;
  }

  .title-page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    background: #0d0505;
    color: #d4a574;
    text-align: center;
    padding: 4rem;
  }

  .title-page h1 {
    font-family: 'Playfair Display', serif;
    font-size: 38pt;
    font-style: italic;
    line-height: 1.1;
    margin-bottom: 1.5rem;
  }

  .title-page .tagline {
    font-size: 11pt;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    opacity: 0.5;
    margin-bottom: 3rem;
  }

  .title-page .ornament {
    font-size: 1.5rem;
    opacity: 0.3;
    letter-spacing: 0.8em;
    margin-bottom: 2rem;
  }

  .chapter { page-break-before: always; padding: 1em 0 2em; }

  .chapter-num {
    font-size: 9pt;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    opacity: 0.4;
    margin-bottom: 0.75rem;
    text-align: center;
  }

  .chapter-title {
    font-family: 'Playfair Display', serif;
    font-size: 20pt;
    font-style: italic;
    font-weight: 700;
    text-align: center;
    color: #2d0a0a;
    margin-bottom: 2.5rem;
  }

  .chapter-body p {
    margin-bottom: 1.1em;
    text-indent: 2em;
  }

  .chapter-body p:first-child { text-indent: 0; }

  .decision-divider {
    margin-top: 2.5rem;
    text-align: center;
    padding: 1rem 0;
    border-top: 1px solid rgba(139, 69, 19, 0.2);
    border-bottom: 1px solid rgba(139, 69, 19, 0.2);
  }

  .decision-text {
    font-style: italic;
    font-size: 10pt;
    color: #5a2d0a;
    opacity: 0.75;
    letter-spacing: 0.05em;
  }
</style>
</head>
<body>

<div class="title-page">
  <div class="ornament">⟡ ⟡ ⟡</div>
  <h1>Embers of the<br>Ashen Court</h1>
  <div class="tagline">Your Story · Your Choices</div>
</div>

${chapterBlocks}

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORIED — Personalized story generation
// ═══════════════════════════════════════════════════════════════════════════

const storiedJobs = new Map();
const STORIED_OUTPUT = path.join(__dirname, 'storied-output');
if (!fs.existsSync(STORIED_OUTPUT)) fs.mkdirSync(STORIED_OUTPUT);

const STORIED_SYSTEM = `You are a skilled literary author writing a personalized memoir. Your task is to write deeply personal, emotionally resonant chapters about real people using the specific details, timeline, animals, places, and texture provided.

Guidelines:
- Write in the narrative style specified (memoir, novel, or fairy tale)
- Alternate POV as instructed — odd chapters from Person A's perspective, even from Person B's
- Weave in real details naturally — never list them, let them breathe into the narrative
- The animals are not background — they are characters with personalities
- Inside jokes should appear as organic moments, not explained to the reader
- Do not summarize. Do not tell the reader how to feel. Show the moments.
- These are real people who will read this. Honor their story.
- Chapter length: 650–900 words`;

// Plan chapters based on story data
async function planChapters(storyData) {
  const aName = storyData.personA?.name || 'Person A';
  const bName = storyData.personB?.name || 'Person B';
  const relType = storyData.preferences?.relationshipType || 'spouses';
  const pov = storyData.preferences?.pov || 'alternating';
  const style = storyData.preferences?.narrativeStyle || 'memoir';

  const povInstruction = pov === 'alternating'
    ? `Alternate POV: odd chapters from ${aName}'s perspective, even chapters from ${bName}'s.`
    : pov === 'personA' ? `All chapters from ${aName}'s perspective.`
    : `All chapters from ${bName}'s perspective.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Plan 12-14 chapters for a personalized ${style} about ${aName} and ${bName} (${relType}).

${povInstruction}

Use the timeline and story data below to plan chapters in chronological order. Each chapter should cover a meaningful period or event. Make sure every significant animal, milestone, and inside joke gets its chapter.

Return ONLY a valid JSON array — no markdown, no explanation:
[{"num":1,"title":"Chapter Title","brief":"2-3 sentences describing what this chapter covers and why it matters","pov":"${aName}"}]

Story data:
${JSON.stringify(storyData, null, 2)}`
    }]
  });

  let text = response.content[0].text.trim();
  text = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  return JSON.parse(text);
}

// Generate a single chapter
async function generateChapter(storyData, chapterPlan) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: STORIED_SYSTEM,
    messages: [{
      role: 'user',
      content: `Story data:\n${JSON.stringify(storyData, null, 2)}\n\n---\n\nWrite Chapter ${chapterPlan.num}: "${chapterPlan.title}"\n\nPOV: ${chapterPlan.pov}\nBrief: ${chapterPlan.brief}\n\nStyle: ${storyData.preferences?.narrativeStyle || 'memoir'}. ${chapterPlan.num % 2 !== 0 ? storyData.personA?.name : storyData.personB?.name}'s perspective. 650–900 words.`
    }]
  });
  return response.content[0].text;
}

// Generate the book title
async function generateBookTitle(storyData) {
  const aName = storyData.personA?.name || 'Person A';
  const bName = storyData.personB?.name || 'Person B';
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Create a beautiful, evocative memoir title for the story of ${aName} and ${bName}. Their story involves: ${(storyData.timeline || []).slice(0,5).map(t => t.event).join('; ')}. Return ONLY the title, nothing else. No quotes, no explanation.`
    }]
  });
  return response.content[0].text.trim().replace(/^["']|["']$/g, '');
}

// Build PDF from chapters
async function buildStoriedPDF(bookTitle, chapters, storyData) {
  const aName = storyData.personA?.name || '';
  const bName = storyData.personB?.name || '';

  const divider = '═'.repeat(60);
  const chaptersHtml = chapters.map((ch, i) => {
    const lines = ch.text.split('\n');
    let html = '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) { html += '<div style="height:6px"></div>'; continue; }
      if (t.startsWith('# ')) { html += `<h2>${t.replace(/^# /,'')}</h2>`; continue; }
      if (t === '---') { html += '<hr>'; continue; }
      html += `<p>${t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
    }
    return `<div class="chapter ${i > 0 ? 'page-break' : ''}">${html}</div>`;
  }).join('\n');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Georgia,serif;font-size:11pt;line-height:1.85;color:#1a1a1a}
    .title-page{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:60px 50px}
    .title-page h1{font-size:42pt;font-weight:normal;letter-spacing:.05em;margin-bottom:18px}
    .title-page .sub{font-style:italic;font-size:13pt;color:#555;margin-bottom:50px}
    .title-page .names{font-size:10pt;letter-spacing:.25em;text-transform:uppercase;color:#888}
    .dedication{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:80px 60px}
    .dedication p{font-style:italic;font-size:12pt;line-height:2.2;color:#444}
    .chapter{padding:60px 65px}
    .page-break{page-break-before:always}
    h2{font-size:19pt;font-weight:normal;margin-bottom:30px;padding-bottom:16px;border-bottom:1px solid #ddd}
    p{margin-bottom:0;text-indent:1.5em}
    h2+p,hr+p{text-indent:0}
    hr{border:none;text-align:center;margin:22px 0}
    hr::after{content:'· · ·';color:#aaa;font-size:13pt;letter-spacing:.4em}
  </style></head><body>
  <div class="title-page">
    <h1>${bookTitle}</h1>
    <p class="sub">A memoir</p>
    <p class="names">${aName} &amp; ${bName}</p>
  </div>
  ${chaptersHtml}
  </body></html>`;

  const requireFrom = createRequire('file:///C:/Users/super/AppData/Local/Temp/puppeteer-test/');
  const puppeteer = requireFrom('puppeteer');
  const browser = await puppeteer.launch({
    executablePath: 'C:/Users/super/.cache/puppeteer/chrome/win64-147.0.7727.56/chrome-win64/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfPath = path.join(STORIED_OUTPUT, `storied-${Date.now()}.pdf`);
  await page.pdf({ path: pdfPath, format: 'A5', margin: { top:'0',bottom:'0',left:'0',right:'0' }, printBackground: true });
  await browser.close();
  return pdfPath;
}

// Run generation in background and stream to SSE listeners
async function generateStoryForJob(jobId) {
  const job = storiedJobs.get(jobId);
  if (!job) return;

  function send(data) {
    const msg = `data: ${JSON.stringify(data)}\n\n`;
    job.events.push(msg);
    for (const res of job.listeners) {
      try { res.write(msg); } catch(_) {}
    }
  }

  try {
    // Plan chapters
    const chapters = await planChapters(job.data);
    job.chapterPlan = chapters;
    send({ type: 'plan', chapters: chapters.map(c => ({ num: c.num, title: c.title })) });

    // Generate book title
    const bookTitle = await generateBookTitle(job.data);
    job.bookTitle = bookTitle;
    send({ type: 'book_title', title: bookTitle });

    // Generate each chapter
    const generatedChapters = [];
    for (const chPlan of chapters) {
      send({ type: 'chapter_start', num: chPlan.num });
      const text = await generateChapter(job.data, chPlan);
      generatedChapters.push({ num: chPlan.num, title: chPlan.title, text });
      job.chapters = generatedChapters;
      send({ type: 'chapter_done', num: chPlan.num });
    }

    // Generate PDF
    const pdfPath = await buildStoriedPDF(bookTitle, generatedChapters, job.data);
    job.pdfPath = pdfPath;
    job.status = 'done';

    const pdfUrl = `/api/storied/pdf/${jobId}`;
    send({ type: 'done', bookTitle, pdfUrl });

    // Close all listeners
    for (const res of job.listeners) {
      try { res.end(); } catch(_) {}
    }
    job.listeners = [];

  } catch (err) {
    console.error('Storied generation error:', err.message);
    send({ type: 'error', message: err.message });
    job.status = 'error';
    for (const res of job.listeners) {
      try { res.end(); } catch(_) {}
    }
    job.listeners = [];
  }
}

// POST /api/storied/queue — start a generation job
app.post('/api/storied/queue', (req, res) => {
  const jobId = crypto.randomUUID();
  storiedJobs.set(jobId, {
    data: req.body,
    status: 'generating',
    events: [],
    listeners: [],
    chapters: [],
    bookTitle: '',
    pdfPath: null,
  });
  res.json({ jobId });
  generateStoryForJob(jobId);
});

// GET /api/storied/stream/:jobId — SSE stream
app.get('/api/storied/stream/:jobId', (req, res) => {
  const job = storiedJobs.get(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Replay any events that already happened
  for (const event of job.events) {
    res.write(event);
  }

  if (job.status === 'done' || job.status === 'error') {
    res.end();
    return;
  }

  job.listeners.push(res);
  req.on('close', () => {
    job.listeners = job.listeners.filter(l => l !== res);
  });
});

// GET /api/storied/pdf/:jobId — download PDF
app.get('/api/storied/pdf/:jobId', (req, res) => {
  const job = storiedJobs.get(req.params.jobId);
  if (!job || !job.pdfPath) {
    res.status(404).json({ error: 'PDF not ready' });
    return;
  }
  const title = (job.bookTitle || 'Storied').replace(/[^a-zA-Z0-9 \-]/g, '');
  res.download(job.pdfPath, `${title}.pdf`);
});

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Unwritten`);
  console.log(`  Running at http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
