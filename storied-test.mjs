import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const storyData = {
  people: {
    personA: {
      name: "Gerry Van Loon",
      age: 36,
      hometown: "Martintown, Ontario",
      occupation: "3M Warehouse Supervisor",
      traits: ["logical to a fault", "protective of those he loves", "gamer"],
      appearance: "5'6, brown hair, 190lbs, year-round tan (part Venezuelan), brown eyes, bushy eyebrows. Scales of justice tattoo on back, baby Shenron tattoo on right forearm.",
    },
    personB: {
      name: "Jess Messier",
      age: 35,
      occupation: "BCBA Autism Supervisor",
      traits: ["animal lover", "artsy", "loyal and fierce friend", "equestrian through and through"],
      appearance: "Brown hair (dyed often), brown eyes, approximately 20 tattoos accumulated over the years.",
    },
    nicknames: "Gerry calls Jess 'Hun'. Jess calls Gerry 'Babe', 'Ger'.",
  },

  animals: [
    { name: "Cruiser", type: "Dog", description: "Hound cross, brindle. Gentle but alpha — never hurt anyone but was always the boss. Got into garbage constantly, had accidents his whole life. Jess's absolute heart dog. Died about a year ago; his loss hit Jess especially hard." },
    { name: "Trademark", type: "Horse", description: "Hanoverian Paint, 16H. Very gentle and sweet. Max height 0.9M but wonderful with kids. Jess's first heart horse, later leased to a little girl who adored him. English jumper." },
    { name: "Sega", type: "Cat", description: "Tabby. A big suck who loved lying on top of couches. Eventually rehomed to close friends." },
    { name: "Apache Jack", type: "Horse", description: "Paint, 14.2H. Western horse. Jess had him before she met Gerry. He used to get between Gerry and Jess when they first started dating. He died in 2009, which was a hard loss for Jess." },
    { name: "Rolex", type: "Horse", description: "Hanoverian Paint, full sister to Trademark, 15H. More sassy and opinionated, prefers pasture life on her own terms. Purchased as a 1-year wedding anniversary gift from Gerry to Jess. English jumper." },
    { name: "Artemis", type: "Dog", description: "Cane Corso, brindle/grey. Fostered from LAWS (Lanark Animal Welfare Society). When someone came to adopt her, Jess refused to let her go — so they kept her. 5 years old." },
    { name: "Vitani", type: "Dog", description: "Golden Retriever, strawberry coloured. Gerry's sister Sapphire was looking at dogs from friends; Gerry and Jess came along and ended up getting one too. Lives to serve, wants everyone happy, demands all the attention. Filled the gap Cruiser left. 4.25 years old. Siblings: Boston (Sapphire's), Archie (Erin & Eli's), mother is Mera." },
    { name: "Shenron", type: "Dog", description: "Great Dane, blue merle, 150lbs. A giant teddy bear who just wants to be loved. Gerry's heart dog. 10.5 years old." },
    { name: "Rebelle", type: "Horse", description: "Hanoverian Paint, white with near-black brown markings. Import from Belgium. Just starting training. Now Jess's new heart horse by far. English jumper, may also do Hunters." },
    { name: "Algernon", type: "Rat", description: "White rat. Named after the book 'Flowers for Algernon'. Jess trained him to do tricks to prove she could do what she failed with a computer-programmed rat in school." },
    { name: "Skinner", type: "Rat", description: "Mostly grey with white. Named after B.F. Skinner, one of the founding fathers of Behaviour. Sibling to Algernon. Both came from Gerry's work friend Jesse Brown." },
    { name: "Fenrir", type: "Pony", description: "Paint, under a year old, may reach 14H. Docile and cute. Jess's next Western project horse to play with at home." },
    { name: "Rory", type: "Horse", description: "Morgan Thoroughbred, completely brown. Stubborn old man — if he didn't want to do something, he didn't. But kind and great with new babies. Put down 6 months ago due to old age after 10+ years with them. One of the hardest things they've done together." },
    { name: "Kratos", type: "Cat", description: "White with a grey tail. Spent his first few years barely showing himself — they called him 'roommate cat'. After a two-week vet stay for urinary stones, he transformed into the cuddliest, most attention-seeking cat they own." },
  ],

  timeline: [
    { year: "2006", event: "Gerry attends a school conference, meets Bri, asks for her email.", tag: "Milestone" },
    { year: "2006", event: "Bri doesn't always have internet, so introduces Gerry to her friend Jess to keep in touch.", tag: "Milestone" },
    { year: "2007", event: "Gerry and Jess talk online for months. Gerry starts developing feelings and plans to ask her out — but Jess goes on a trip and comes back with a boyfriend.", tag: "Challenge" },
    { year: "2007", event: "For 6 months Gerry supports Jess's relationship, ensuring she stays happy, while quietly carrying his own feelings.", tag: "Challenge" },
    { year: "November 2007", event: "Jess's relationship ends.", tag: "Milestone" },
    { year: "Dec 3, 2007", event: "Gerry asks Jess out — still having never met in person. She says yes.", tag: "Romantic moment" },
    { year: "Feb 2008", event: "Gerry visits Jess's parents' house for the first time while her dad is away fishing (dad didn't want 'an online guy' there). They sneak him in — but all the aunts are there, so word gets out anyway.", tag: "Funny moment" },
    { year: "2009", event: "Jess's dad invites Gerry on his annual ice fishing trip — the same trip Gerry had been sneaked past. Gerry is fine with it until the day before, when he discovers it's an uncles-only tradition. No cousins. Just uncles. He is nervous.", tag: "Funny moment" },
    { year: "2008", event: "Gerry goes to Trent University. Jess does a fifth year of high school. She visits him in the dorms so often that people ask where she is when she's not there.", tag: "Milestone" },
    { year: "2008", event: "Gerry meets Dean in the dorms — who later becomes his closest friend and best man at their wedding.", tag: "Milestone" },
    { year: "2009", event: "Jess comes to Trent. They get a house together in Peterborough.", tag: "Milestone" },
    { year: "2009", event: "Apache Jack dies. A hard loss for Jess — he was her horse before she ever met Gerry.", tag: "Challenge" },
    { year: "2010", event: "Their house is broken into. They get Cruiser as a deterrent. Jess buys Trademark as a two-year-old.", tag: "Challenge" },
    { year: "2012", event: "Both graduate — Gerry from a 4-year BBA program, Jess from a 3-year Psychology program.", tag: "Milestone" },
    { year: "2012", event: "Jess registers for an 8-month Autism program at St. Lawrence College in Kingston — where Gerry's sister Sapphire lives. They start spending a lot of time with Sapphire and her eventual husband George.", tag: "Milestone" },
    { year: "2013", event: "Jess graduates from college. They move back to Perth, living with Jess's parents while job hunting.", tag: "Milestone" },
    { year: "August 2013", event: "Gerry proposes to Jess at their farm (they have 80 acres). He tacks up Rory with a saddle pad that reads 'Will You Marry Me?'. Jess is running late, rushes through saying yes, and asks if they can go now. Still an inside joke.", tag: "Romantic moment" },
    { year: "2013", event: "Before the wedding they get matching Kryptonian symbol tattoos that translate to 'Love You More'. They get Sega.", tag: "Milestone" },
    { year: "2014", event: "Jess gets a job at Connectwell as an Instructional Therapist. Gerry gets hired at 3M.", tag: "Milestone" },
    { year: "October 1, 2014", event: "Gerry gets hired full-time at 3M — two weeks before the wedding.", tag: "Milestone" },
    { year: "October 18, 2014", event: "Gerry and Jess are married. Two-week honeymoon in Spain.", tag: "Milestone" },
    { year: "2015", event: "They buy the house from Jess's parents at 182 Christie Lake North Shore Rd, Perth, ON. First anniversary — Gerry gifts Jess Rolex the horse. They get Kratos.", tag: "Milestone" },
    { year: "2015–2018", event: "They establish a rhythm of regular gatherings — summer parties, birthdays, Friendsgiving. Both advance in their careers. Shenron joins the family in 2016.", tag: "Milestone" },
    { year: "2019", event: "Jess begins her Master's degree in Behaviour to become a BCBA. The house is covered wall-to-wall in sticky notes (Gerry has unlimited access to them from work) — you can't open a door without learning something about behaviour. Gerry is promoted to Supervisor. They adopt Artemis.", tag: "Milestone" },
    { year: "2020", event: "Jess earns her BCBA certification. Later that year she's given a BCBA role at work.", tag: "Milestone" },
    { year: "2021", event: "COVID lockdowns. Both keep their jobs — Jess partly remote, Gerry normal hours. They stay connected with friends as much as possible; Erin becomes their most regular visitor during this time.", tag: "Challenge" },
    { year: "2022", event: "Life continues post-COVID. Vitani joins the family.", tag: "Milestone" },
    { year: "2023", event: "Trip to Greece with friends Erin and Eli.", tag: "Milestone" },
    { year: "2025", event: "Jess takes on a private client and begins seriously considering starting her own business.", tag: "Milestone" },
    { year: "2026", event: "Jess adopts the motto 'if it doesn't bring joy, let it go.' She begins pulling back from Connectwell and focusing on launching her own business, Continuum.", tag: "Milestone" },
  ],

  texture: {
    places: "Barn nights — at least once a week as a date-night ritual to watch Jess ride. Their newly designed game/reading room has become deeply their shared space.",
    insideJokes: [
      "'Guess what, chicken butt'",
      "'What's that have to do with the price of rice'",
      "'Monkeybutt'",
      "The proposal: Jess rushed through saying yes and asked if they could go now. Still referenced to this day.",
      "The jersey joke: 'Van Loon' on the back, but with a 'Messier' flap that folds down to cover it when Jess goes out. Because the Messiers are outspoken and boisterous, and some of Gerry's calm collected nature has rubbed off on Jess — but not always.",
    ],
    songsMoviesBooks: null,
    funniest: null,
  },

  freeText: `Gerry and Jess have never had a real fight. They decided early on that this was their life and they were going to be true partners in everything. They genuinely enjoy spending free time together as much as possible. Jess is slightly more social, where Gerry prefers staying home — but he does love seeing their friends, just not every single weekend. Jess's parents live nearby; they visit often for dinners out, dinners at the house, card games, or just hanging out. Jess and her mom now travel together 2-3 times a year, leaving Gerry and Jess's dad home to watch the houses. Their friends hold them up as the example of what an ideal relationship looks like.`,

  storyPreferences: {
    relationshipType: "Spouses",
    tone: "Heartwarming with a thread of adventure",
    romanticLevel: "Sweet and wholesome",
    pov: "Alternating chapters",
    narrativeStyle: "Memoir",
  },
};

const systemPrompt = `You are a skilled literary author writing a personalized memoir. Your task is to write deeply personal, emotionally resonant chapters about real people using the specific details, timeline, animals, places, and texture provided.

Guidelines:
- Write in memoir style — reflective, warm, honest, specific
- Alternate POV as instructed — odd chapters from Gerry's perspective, even from Jess's
- Weave in real details naturally — never list them, let them breathe into the narrative
- The animals are not background — they are characters. They have personalities. Use them.
- Inside jokes should appear as organic moments, not explained to the reader
- Tone: heartwarming with a thread of adventure. Light humor where it fits. No melodrama.
- Chapter length: 600–900 words per chapter
- Do not summarize. Do not tell the reader how to feel. Show the moments and let them land.
- These are real people who will read this. Honor their story.`;

async function generateChapter(chapterNumber, chapterBrief) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Generating Chapter ${chapterNumber}...`);
  console.log('─'.repeat(60));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Here is the complete story data for Gerry and Jess:\n\n${JSON.stringify(storyData, null, 2)}\n\n---\n\nNow write Chapter ${chapterNumber}.\n\nChapter brief: ${chapterBrief}\n\nRemember: memoir style, ${chapterNumber % 2 !== 0 ? "Gerry's" : "Jess's"} POV, 600–900 words, specific details woven in naturally.`,
      },
    ],
  });

  const text = response.content[0].text;
  console.log('\n' + text);
  return text;
}

import { writeFileSync } from 'fs';

const allChapters = [];

async function gen(num, brief) {
  const text = await generateChapter(num, brief);
  allChapters.push(text);
}

// Regenerate only the two corrected chapters
await gen(6, "2009-2010 — Jess's POV. Apache Jack dies in 2009 — he was her horse before Gerry, the one who used to get between them, and losing him is a real grief. Then she comes to Trent, they get a house together in Peterborough. The break-in. Getting Cruiser as a deterrent — this brindle hound who immediately becomes boss. Jess buys Trademark as a two-year-old. The animals are beginning.");

await gen(8, "August 2013 — Jess's POV. The proposal at the farm (80 acres). Gerry tacks up Rory with a saddle pad that reads 'Will You Marry Me?' Jess is running late, rushes through saying yes at the farm, asks if they can go now. She knows it was rushed. She also knows she meant it completely. The wedding tattoo — Kryptonian symbols for 'Love You More'.");

writeFileSync('storied-ch6-ch8-corrected.txt', allChapters.join('\n\n' + '═'.repeat(60) + '\n\n'));
console.log('\n\n✓ Corrected chapters saved to storied-ch6-ch8-corrected.txt');
