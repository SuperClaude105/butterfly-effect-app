// One-time script: generate AI covers for public library books with no cover_url
// Usage: node generate-covers.mjs [batch_size]
// Example: node generate-covers.mjs 10

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_KEY    = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BATCH    = parseInt(process.argv[2] || '10');

const GENRE_STYLES = {
  // ── Romance family ─────────────────────────────────────────────────────────
  'Dark Romance':
    'MEDIUM: Rich oil painting. Chiaroscuro — one candle or ember the only light source. Two figures in dangerous proximity, faces partially shadowed. Jewel-toned velvet, stone walls. No landscapes, no exteriors. Brooding, sensual, intimate. Deep shadow dominates.',

  'Contemporary Romance':
    'MEDIUM: Real lifestyle photograph — NOT illustrated or painted. Golden hour, warm bokeh, two people laughing in a sunlit café or on a city rooftop. Feels candid, joyful, modern. Bright and warm. Looks like an Instagram photograph taken by a skilled photographer.',

  'Historical Romance':
    'MEDIUM: Classical oil portrait painting, Regency or Victorian era. Single woman in period dress — empire waist or corset gown — soft candlelight catching the fabric. Warm amber tones, formal but romantic. Feels like a painting hanging in a stately home.',

  'Fantasy Romance':
    'MEDIUM: Pre-Raphaelite painting. Luminous female figure in an enchanted glade or moonlit ruin. Supernatural light source (glowing pendant, fireflies, magic particles). Jewel tones. Flowing fabric. Otherworldly and romantic — NOT a generic oil portrait.',

  'Paranormal Romance':
    'MEDIUM: Atmospheric night photograph (real photo aesthetic). Full moon behind a gothic silhouette — crumbling tower, iron gate, lone figure. Cool silver and deep violet. Mist on the ground. Mysterious and beautiful. Looks like a real long-exposure photograph.',

  'Historical Adventure Romance':
    'MEDIUM: Action oil painting, wide composition. A ship deck in a storm OR a desert horizon OR a cliff edge. Wind-blown figure — cape or coat flying. Warm amber and ocean blue. Epic scale with a romantic undertone. Feels like a movie poster painted by a classical artist.',

  // ── Fantasy family ─────────────────────────────────────────────────────────
  'Romantasy':
    'MEDIUM: Detailed digital fantasy illustration (NOT oil painting). Female protagonist with one supernatural element — antler crown, glowing veins, flame hands, shadow wings. Grand throne room OR ancient forest backdrop. Rich jewel tones. Feels like modern fantasy book cover art — lush, specific, cinematic.',

  'Epic Fantasy':
    'MEDIUM: Wide-angle landscape digital matte painting. Tiny lone figure (warrior or rider) dwarfed by enormous sky, mountain range, or ancient fortress. Dramatic storm light breaking through clouds. Muted earth tones with one vivid colour accent. Epic, vast, mythic — NOT a character portrait.',

  'Dark Fantasy':
    'MEDIUM: Gothic oil painting. Crumbling cathedral or blighted landscape. One hooded figure in a shaft of cold moonlight. Ravens, dead trees, or shadow creatures at the edges. Almost monochromatic — deep grey and black — with one dark blood-red accent. Oppressive and beautiful.',

  'Urban Fantasy':
    'MEDIUM: Real photograph aesthetic — NOT painted. Rain-slicked city street at night. Neon reflections in puddles. One impossible supernatural element photorealistically integrated: a glowing doorway in a brick wall, shadow with too many limbs, rune burning in the pavement. Gritty and cinematic.',

  'Gaslamp Fantasy':
    'MEDIUM: Detailed pen-and-ink illustration with watercolour wash. Victorian gas-lit street, brass clockwork machinery, cobblestones and fog. Sepia and amber tones with occasional jewel-colour accent. Intricate cross-hatching on the architectural details. Feels like a vintage illustrated novel.',

  'Cozy Fantasy':
    'MEDIUM: Soft watercolour illustration — NOT oil, NOT photo. A warm lit cottage window in an enchanted autumn forest. Mushrooms, lanterns, a cat on the step. Gentle magic glow. Warm oranges, greens, and golds. Feels hand-painted, whimsical, safe, and inviting.',

  'High Fantasy':
    'MEDIUM: Epic digital matte painting. Dragon silhouette or army of soldiers against a vast sky. Ancient fortress on a cliff. Deep navy, gold, and storm grey. Map-border ornamental elements framing the image. Legendary and monumental — NOT a character portrait.',

  // ── Thriller / Mystery family ──────────────────────────────────────────────
  'Suspense Thriller':
    'MEDIUM: Gritty photorealistic photograph aesthetic. A figure from behind walking away down a wet alley or empty corridor. Motion blur on the edges. Muted grey-green palette — almost desaturated. One red element (exit sign, tail lights). Tense, cinematic, real.',

  'Psychological Thriller':
    'MEDIUM: High-contrast black-and-white fine art photograph. Double exposure — one face overlaid with a fragmented architectural or landscape image. One half in deep shadow. Clinical, cold, and deeply unsettling. Editorial fine art photography style.',

  'True Crime':
    'MEDIUM: Documentary photograph, not illustrated. Grainy 35mm film texture. Empty crime scene — a lone chair under a bare bulb, evidence tape across a doorway, a crumpled newspaper on wet pavement. Flat, cold, desaturated. Feels like archival press photography.',

  'Whodunit':
    'MEDIUM: Vintage pen-and-ink illustration. A candlelit manor interior — grandfather clock, magnifying glass, scattered letters. Warm sepia ink wash with one red accent (a drop of wax, a ribbon). Detailed cross-hatching. Feels like an Agatha Christie first edition illustration.',

  'Cozy Mystery':
    'MEDIUM: Charming watercolour illustration. A quaint English village bookshop or tea room. A cat on the counter, steam rising from a cup, autumn leaves outside the window. Warm honey and sage palette. Cheerful and inviting with one small shadowy detail hinting at mystery.',

  // ── Science Fiction family ─────────────────────────────────────────────────
  'Science Fiction':
    'MEDIUM: Clean digital concept art — NOT painted, NOT photographic. Vast deep-space exterior or sleek spacecraft interior. Hard geometric shapes. Cool blue, white, and black palette. One lone astronaut or scientist figure to convey scale. Awe-inspiring, precise, and cold.',

  'Cyberpunk':
    'MEDIUM: Neon-noir photograph aesthetic — looks like a real night photograph. Rain-drenched street, neon signs in Japanese and English reflecting in puddles. Harsh magenta and electric cyan contrast against deep black. Augmented human in a long coat in the mid-ground. Dense, layered, gritty.',

  'Dystopian':
    'MEDIUM: Graphic design — constructivist propaganda poster aesthetic. Bold geometric composition. A single silhouetted figure beneath an enormous monolithic structure or surveillance tower. Stark two-tone palette — off-white and one oppressive colour (red, grey, or rust). Flat and authoritarian.',

  'Climate Thriller':
    'MEDIUM: Real documentary photograph — NOT illustrated. A dramatic environmental landscape: cracking Arctic ice shelf, a flooded city street with submerged cars, a wildfire horizon. Photorealistic, wide-angle, urgent. Looks like a National Geographic cover photograph.',

  // ── Literary / Drama ───────────────────────────────────────────────────────
  'Literary':
    'MEDIUM: Abstract fine-art photograph or expressionist mixed-media. Symbolic, not literal. A solitary object in vast negative space — a single chair in fog, a door ajar in a white room, a bird mid-flight against a pale sky. Muted, sophisticated, quietly devastating. Open to interpretation.',

  'Drama':
    'MEDIUM: Intimate portrait photograph — real photograph aesthetic. Single person in natural window light, looking away from camera. Raw, unguarded expression. Desaturated with warm skin tones. Quiet and human. Feels like a still from an art-house film.',

  // ── Horror ──────────────────────────────────────────────────────────────────
  'Horror':
    'MEDIUM: Fine art photograph, 90% pure darkness. One small, unsettling element half-lit by a cold source: a hand reaching from under a door, a face reflected in a dark window, a figure at the end of a long corridor. Something is wrong in the composition. Deeply unsettling.',

  // ── Other ──────────────────────────────────────────────────────────────────
  'Dark Academia':
    'MEDIUM: Atmospheric photograph — real photo aesthetic. A candlelit university library at midnight: tall shelves, leather spines, a skull on a desk, dust motes in the lamplight. Burgundy and walnut tones. Feels like a real place photographed by an editorial photographer.',

  'Light Novel':
    'MEDIUM: Anime illustration — clean, cel-shaded Japanese light novel cover art. Vibrant saturated colours. Expressive protagonist in a dynamic action or emotional pose. Detailed costume. NOT oil painting, NOT photograph. Looks like a Kadokawa novel cover.',

  'Paranormal':
    'MEDIUM: Real photograph aesthetic, night scene. Abandoned building or forest clearing. Supernatural light source — a glowing circle on the ground, orbs in the treeline. Desaturated with one eerie green or violet glow. Feels like a documentary paranormal photograph.',
};

function buildPrompt({ genre, title, premise, themes, pName, liName }) {
  const g        = genre || 'Fiction';
  const styleKey = Object.keys(GENRE_STYLES).find(k => g.toLowerCase().includes(k.toLowerCase())) || null;
  const style    = styleKey ? GENRE_STYLES[styleKey] : 'Rich oil painting, cinematic lighting, atmospheric depth, highly detailed, evocative mood.';
  const themeStr = (themes || []).slice(0, 3).join(', ') || g;
  return [
    `Book cover for "${title}", a ${g} novel.`,
    premise ? ` Premise: ${premise.slice(0, 120)}.` : '',
    pName   ? ` Protagonist: ${pName}.`   : '',
    liName  ? ` Love interest: ${liName}.` : '',
    ` Themes: ${themeStr}.`,
    ` STYLE: ${style}`,
    ' No text, no title, no words, no letters anywhere in the image.',
  ].join('');
}

async function generateCover(story) {
  const d     = story.data || {};
  const title = d.bookTitle || 'Untitled';
  const genre = d.config?.genre || 'Fiction';
  const premise = d.config?.storyIdea || '';
  const themes  = d.config?.themes || [];
  const pName   = d.config?.protagonistName || '';
  const liName  = d.config?.loveInterestName || '';

  const prompt = buildPrompt({ genre, title, premise, themes, pName, liName });

  const start = Date.now();
  const resp = await fetch('https://api.openai.com/v1/images/generations', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    body:    JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality: 'medium' }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${err.slice(0, 120)}`);
  }

  const imgData = await resp.json();
  const b64     = imgData.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');

  const imageBytes = Buffer.from(b64, 'base64');
  const filename   = `covers/${story.id}.png`;

  const { error: uploadErr } = await supabase.storage
    .from('book-covers')
    .upload(filename, imageBytes, { contentType: 'image/png', upsert: true });

  if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

  const { data: pub } = supabase.storage.from('book-covers').getPublicUrl(filename);
  const coverUrl = pub.publicUrl;

  await supabase.from('stories').update({ cover_url: coverUrl }).eq('id', story.id);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  return { title, genre, coverUrl, elapsed, styleKey: Object.keys(GENRE_STYLES).find(k => (genre||'').toLowerCase().includes(k.toLowerCase())) || 'default' };
}

async function main() {
  console.log(`\n🎨 Cover Generator — batch of ${BATCH}\n`);

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, data')
    .eq('is_public', true)
    .is('deleted_at', null)
    .is('cover_url', null)
    .limit(BATCH);

  if (error) { console.error('DB error:', error.message); process.exit(1); }
  if (!stories?.length) { console.log('No books need covers — all done!'); return; }

  console.log(`Found ${stories.length} books without covers. Generating...\n`);

  // Run in parallel groups of 3 to avoid rate limits
  const GROUP = 3;
  let totalCost = 0;

  for (let i = 0; i < stories.length; i += GROUP) {
    const group = stories.slice(i, i + GROUP);
    const results = await Promise.allSettled(group.map(s => generateCover(s)));

    results.forEach((r, j) => {
      const story = group[j];
      const title = story.data?.bookTitle || story.id;
      if (r.status === 'fulfilled') {
        const { genre, elapsed, styleKey } = r.value;
        totalCost += 0.06;
        console.log(`  ✓ ${title} (${genre}) [${styleKey}] — ${elapsed}s`);
      } else {
        console.log(`  ✗ ${title} — FAILED: ${r.reason?.message}`);
      }
    });
  }

  console.log(`\nDone. Estimated cost: $${totalCost.toFixed(2)}\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
