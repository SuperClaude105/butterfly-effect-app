/**
 * Seed 12 new public library books — Batch 2.
 * Covers: Psychological Thriller, Whodunit, Dark Fantasy, Epic Fantasy,
 * Urban Fantasy, Cyberpunk, Dystopian, Light Novel, Suspense Thriller,
 * Sports Romance, Literary (French), Horror.
 * Mix of male and female leads. One book in French.
 *
 * Usage:
 *   SUPABASE_SERVICE_KEY=your_service_role_key node seed-library-batch2.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const sb = createClient(
  'https://puywhvrgixlhijxzircy.supabase.co',
  SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── 1. Psychological Thriller ───────────────────────────────────────────────

const BOOK_01 = {
  bookTitle: 'The Second Self',
  summary: 'A therapist begins to doubt his own memory when his patients describe events from his private life that he cannot recall living.',
  config: {
    genre: 'Psychological Thriller',
    protagonistName: 'Marcus',
    ageRange: 'mid-30s',
    themes: ['Unreliable Narrator', 'Double Identity', 'Memory Loss', 'Gaslighting', 'Paranoia'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'The Other Appointment',
      'What the Recording Shows',
      'His Own Handwriting',
      'The Name on the Prescription',
      'Which One of Us',
    ],
    chapters: [
      `Marcus kept meticulous notes. This was the first thing his supervisors had praised during his training and the last thing he examined before every session ended. He wrote in a compact, legible hand — the kind of script that announced its own reliability. So when he opened the folder for his eleven o'clock and found three pages in handwriting that was almost but not quite his own, he sat very still for a long time before touching them.

The notes described a session he had no memory of conducting. The patient was listed as D., female, forty-one, presenting with anxiety following a divorce. The notes were clinical, appropriate, the kind of observations he would have made. Except that D. was not in his caseload. He had checked three times. And the date on the folder was last Thursday, when he had been at a conference in Edinburgh with forty witnesses.

He told himself there was an explanation. There were always explanations. He was a therapist; he believed in the rational architecture beneath strange behaviour. He set the folder aside and saw his eleven o'clock patient, and then his one o'clock, and then at three he called the clinic administrator and asked, as casually as he could manage, whether anyone had borrowed his office last week.

There was a pause on the line. Then: "You were here Thursday afternoon, Dr. Vane. I saw you come in."

He thanked her and hung up. He sat looking at his hands — the hands he wrote with — and found that he could not account for the afternoon in question at all.`,

      `He requested the building's security footage on a Friday, telling the administrator it was a matter of professional protocol. She pulled it up on her monitor without question, and he leaned in and watched himself — or something very much like himself — walk through the clinic's front door at two forty-seven on Thursday afternoon. Dark coat. Briefcase. The slightly rolling walk he'd inherited from a sports injury at twenty-two.

The figure paused at the reception desk. Spoke briefly to the administrator, who smiled. Then went up the corridor toward his office.

The timestamp matched the notes in the folder exactly. The face was unmistakably his own.

He rewound the footage and watched again, and then again, searching for the small betrayals — the tilt of the head, the way the figure held its hands — that would prove a difference. He found nothing. This was either him, or whoever it was had studied him very carefully.

That evening he rang his wife, who confirmed he had been home for dinner by seven. He did not tell her what he'd seen. He wrote instead in his private journal, the one no one else read, a single question he underlined twice: *Is it possible to forget an entire afternoon and not know you've forgotten it?*`,

      `The third piece of evidence arrived on Monday in his own post tray: a letter, handwritten, addressed to him from a patient he had discharged two years ago. She wrote that she wanted to thank him for his help last week, for what he'd said about her mother, for the clarity it had given her. She described the session in detail. The things she said he had said.

Marcus read the letter four times. Every observation attributed to him was correct — clinically accurate, precisely the kind of reframe he would have offered. Whoever had sat with this woman and worn his face had also known his methodology, his language, his particular therapeutic approach.

He began to compile a list. The folder. The footage. The letter. There were no good explanations left, only a narrowing field of impossible ones. He had, at some point, begun to rule out the most frightening: that he was doing these things and simply not retaining them. But the letter made that harder. The woman's gratitude was real. The session had helped her. Whatever his other self was doing with his afternoons, it was not causing obvious harm.

This, he thought, was the most disturbing part. He was not afraid of a monster. He was afraid of a very capable, very careful version of himself.`,

      `He found the prescription on a Wednesday, tucked inside the lining of his coat pocket where he never put anything. It was made out in his name, in his handwriting, for a medication he had never been prescribed. The dosage was high. The date was eighteen months ago.

He sat in his car outside the pharmacy and tried to remember being eighteen months younger. He had been well. He had been working, married, functional. He had run a half-marathon in September. He had no memory of symptoms that would have warranted this.

He rang a colleague, a psychiatrist he trusted, and described the situation in clinical terms, as if he were presenting a case. The colleague listened carefully and said: "There are conditions — dissociative in nature — where the person genuinely has no access to the other self's experiences. The other self functions normally. Sometimes better than normally. It's rare. But it isn't fiction."

Marcus thanked him and ended the call. He sat for a while longer. Then he drove to the pharmacy and, on impulse, went inside and described the prescription to the pharmacist, said he'd lost his records. She pulled up his file without hesitation. He had filled it. Fourteen times over eighteen months. His own signature on every pickup slip.`,

      `He went home that evening and sat at his desk and did something he had been avoiding: he read, from the beginning, every entry in his private journal for the past two years.

The handwriting changed partway through. Not dramatically — a lean here, a different loop on the lowercase g — but unmistakably different once you knew to look. The other handwriting was calmer. More decisive. The entries it had written were sparse, observational, and occasionally contained references to things Marcus had no memory of: a conversation with his father (dead for six years), a walk he'd taken along a river he'd never visited, a meal at a restaurant he had always meant to go to but never had.

The last entry in the other handwriting was dated three days ago. It said: *He's starting to find the edges. I expected it to take longer. He's good at this. That's the difficult part — we are both very good at this, and I am not certain there's room for both of us in here.*

Marcus read it twice. Then he took out a fresh page and wrote, in his own careful, legible script: *Who are you?*

He set the pen down and waited. After a long moment, his hand reached for the pen again. The handwriting that answered was not quite his.

*The same as you*, it said. *Only less afraid.*`,
    ],
  },
};

// ─── 2. Whodunit Mystery ─────────────────────────────────────────────────────

const BOOK_02 = {
  bookTitle: 'The Clocks Stopped at Selden Hall',
  summary: 'When every clock in the manor stops at the moment of Lord Selden\'s death, amateur investigator Cecily Fenn suspects the killer is still in the house.',
  config: {
    genre: 'Whodunit',
    protagonistName: 'Cecily',
    ageRange: 'early 40s',
    themes: ['Locked Room Mystery', 'Family Secrets', 'Hidden Identity', 'Cold Case', 'Double Cross'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'Eleven Minutes Past Three',
      'The Room with Two Exits',
      'What the Butler Omitted',
      'Portrait of a Liar',
      'The Hour Restored',
    ],
    chapters: [
      `Cecily Fenn had been invited to Selden Hall for the reading of a will that did not concern her, and she had accepted because she had nothing better to do and because Lady Selden had once been kind to her during a particularly bleak winter. She arrived on a Friday in November, when the grounds were the colour of old pewter and the house itself seemed to be arguing with the fog.

The other guests — four of them, all relatives with varying degrees of grievance — were assembled in the front parlour when Cecily was shown in. They regarded her with the specific suspicion reserved for people who don't belong to the story. Lord Selden himself was not present, having retreated upstairs after lunch with what his son described as a headache.

At eleven minutes past three, every clock in the house stopped. Cecily noticed this because she was standing near the grandfather clock in the hall when its pendulum went still. She noted the time with the mild interest of someone who finds coincidences professionally interesting. Then she heard the sound from upstairs — a single, abrupt thud — and her mild interest became something more urgent.

Lord Selden was found on the floor of his study, dead, with no apparent cause and no disorder in the room. The windows were latched from inside. The door had been locked, and his son had used a spare key. Every clock in the house — fourteen of them, she counted later — had stopped at precisely the same moment.`,

      `The room had two exits that mattered: the door, which had been locked from the inside, and a second door behind a bookcase that the family had apparently forgotten about until Cecily pointed it out. The current butler, a man named Ostwick who looked as if he had been in service since the previous century, confirmed that it connected to the servants' corridor. He said this as though it were an unfortunate architectural feature rather than a fact of significant interest.

Cecily examined both doors, the windows, and the body in that order, making notes in the small leather book she carried everywhere. She was not a detective — she had written three volumes on historical poisoning cases, which was not the same thing but was adjacently useful. She had an eye for what was missing as much as what was present.

What was missing: any sign that Lord Selden had been surprised. His body had fallen forward, toward the desk, as if he had stood suddenly. His hand had closed around nothing — she could tell from the position of his fingers. He had been reaching for something that wasn't there when they found him.

What was present: a faint smell, chemical and sweet, that she associated with a particular class of substance she had written about at length. She did not mention this yet. She went instead to find the other guests and ask where each of them had been at eleven minutes past three.`,

      `Ostwick had been in the kitchens at the relevant time — three witnesses confirmed this. But Cecily's interest in Ostwick was less about his location and more about a deliberate omission she had identified in his account of the morning. He had described Lord Selden's movements in careful detail: breakfast at eight, a walk in the grounds, correspondence until noon, lunch, the headache, the retreat upstairs. He had accounted for every hour except one.

She found him in the silver room, polishing something that didn't need polishing.

"You mentioned Lord Selden was at his correspondence until noon," she said. "But the postmaster told me the morning's delivery arrived at eleven-fifteen and he was gone from his study by eleven-twenty. What was he doing between eleven-twenty and noon?"

Ostwick set down his cloth with the resigned air of a man who has been caught not in a lie but in a careful truth. He said that Lord Selden had received a visitor. That the visitor had left before lunch. That he had been asked, specifically, not to mention the visit to the family.

The visitor's name, it emerged after more careful questioning, was a woman who had been writing to Lord Selden for the past year. The letters were in the bottom drawer of his desk, under a false panel that Cecily found because false panels in desks are almost always under something.`,

      `The portrait above the dining room fireplace had been painted in 1987, when Lord Selden was forty and the world was somewhat different. Cecily stood in front of it for a long time on the second morning, not because portraits were evidence but because she was thinking about identity and resemblance and the specific ways families distort over time.

She had read the letters by then. They were from a woman who signed herself only as E., and they were not threatening but they were not comfortable either. They described, in precise and unemotional terms, a history Lord Selden had apparently spent considerable effort concealing — a first marriage, dissolved not by death as the family believed but by a legal separation that had never been disclosed, and a child from that marriage who was now forty-one years old and had spent thirty years not knowing who her father was.

Cecily looked at the portrait and then looked at the guest who had introduced herself as Lady Selden's old friend and who had been sitting in the front parlour when Cecily arrived. The height was the same. The jaw was the same. The eyes, which were Selden eyes, were unmistakably the same.

She went to find a telephone and ring her own solicitor, who confirmed that E. was not just a correspondent — she was listed, under her full name, in a codicil to the will that had been added three weeks ago. Lord Selden had not died before telling his secret. He had died immediately after.`,

      `The substance was identified by a chemist in the village who had a useful sideline in such consultations: a compound that mimicked the presentation of natural cardiac failure and dissolved in the bloodstream within two hours. It had been in the glass of water on Lord Selden's desk — the glass that had been washed, she suspected, by the person who found the body first, which was not his son but the daughter-in-law, who had arrived at the study door a full three minutes before the son.

Cecily presented her conclusions to the assembled family on the third evening with the particular care of someone who knows the information will cause pain regardless of how it's delivered. She named the daughter-in-law, who did not deny it. She described the motive — the codicil, the inheritance, the half-sister who stood to inherit equally — and the means and the opportunity. She noted that the clocks had stopped because someone had interfered with the electrical circuit that ran through the house's clock system, creating a false timestamp. It was clever. It was nearly enough.

What it hadn't accounted for was Cecily, who had no personal interest in the estate and no reason to let a solvable problem remain unsolved.

The daughter-in-law was removed by the constabulary before dinner. E. arrived the following morning, and Cecily introduced herself, and they had tea in the front parlour where the story had begun. The clocks had been restarted and were keeping perfect time, and outside the fog had lifted, and Selden Hall looked, for the first time since Cecily's arrival, like a place where someone might want to live.`,
    ],
  },
};

// ─── 3. Dark Fantasy ─────────────────────────────────────────────────────────

const BOOK_03 = {
  bookTitle: 'The God Who Bled',
  summary: 'A mercenary discovers he carries the blood of a god who was supposed to be dead — and that gods, it turns out, can be killed again.',
  config: {
    genre: 'Dark Fantasy',
    protagonistName: 'Cael',
    ageRange: 'late 20s',
    themes: ['Blood Magic', 'Fallen Gods', 'Ancient Evil', 'Morally Grey Hero', 'Betrayal', 'Political Intrigue'],
    targetChapters: 8,
  },
  progress: {
    chapter: 8,
    titles: [
      'The Price of Mercy',
      'Blood Calls to Blood',
      'The Altar of Names',
      'What Divinity Costs',
      'The Last God Standing',
      'The Bearer and the Kept',
      'The City of Old Debts',
      'What Gods Leave Behind',
    ],
    chapters: [
      `Cael had killed twenty-three men and was not troubled by any of them. The twenty-fourth troubled him considerably, because the man did not die.

He'd taken three arrows — good shots, all of them, the kind that ended arguments — and had kept walking toward Cael with the serene expression of someone who had been promised something larger than death. The man's wounds had closed as Cael watched, the flesh reknitting in the cold mountain air, and then he had spoken in a language that Cael felt in his back teeth rather than heard, and Cael had done the only sensible thing available to him: he had run.

He'd made it three hundred yards before something in his own blood answered the language in the air. A heat behind his sternum, sudden and absolute, like swallowing a coal. He'd stopped running and turned back, and what happened next he could not have explained if his life depended on it — which, for the following seven years, it frequently did.

The man had knelt. That was the part that stayed with Cael. A man who could not be killed by arrows, kneeling in the mountain snow, looking up at Cael with an expression of unmistakable relief. As if he had been searching, and had now found. As if Cael's presence resolved something that had been unresolved for a very long time.`,

      `The scholar he consulted in Vethara — a woman who kept her books in temperature-controlled rooms and her secrets in coded marginalia — told him what he was carrying. She said it plainly, without drama, the way you'd tell someone they'd inherited a difficult piece of property.

The god Varek had died four hundred years ago. Every historical account agreed on this. He had been unmade by a coalition of the other six, torn apart, his essence distributed through the bloodlines of his last worshippers so that no single vessel could contain enough of him to matter. The scholars had considered this elegant. The worshippers had considered it a curse. Their descendants, four centuries on, had mostly forgotten.

"You are, by my estimation, the most concentrated Varek-bearer I have encountered," the scholar said. She was looking at his hands with professional interest. "The probability of this concentration occurring naturally is very small."

"What probability?" Cael asked.

"The kind that suggests it didn't occur naturally." She moved to her window and looked out at the street below. "The other gods believed they'd solved the problem. They hadn't considered that blood, dispersed, has a tendency to recombine. Given enough time. Given the right conditions." She turned back to him. "Given, perhaps, someone who wanted it to."`,

      `The altar was beneath the city, as altars to dead gods tend to be — not because their worshippers were secretive but because cities grow over the things they want to forget. Cael descended with the scholar's map and a torch and the persistent heat in his chest that had intensified the deeper he went.

The names were carved into the walls. Not Varek's name — that was too dangerous, too inviting — but the names of every person who had carried his blood across four centuries. A genealogy of dilution. He could read, at the far end of the lineage, his own name, carved in fresh stone that still smelled of the chisel.

Beside his name, a date. Three weeks from now.

He stood in front of it for a long time, torch guttering, trying to determine how someone had known to put it there, and when, and whether the date was a prediction or a schedule.

Below the date, a sentence in the old language that he now, unpleasantly, understood: *When the blood is full, the vessel is opened. When the vessel is opened, the god is returned.*

He thought about the man in the mountains who had knelt in the snow. He thought about the word *relief* and what it meant when the thing feeling it had been waiting four hundred years.`,

      `Divinity, the scholar explained, was not a condition but a process. The blood didn't make him a god — it made him a container for one. The distinction mattered enormously if you were trying to decide what to do about it.

"You could disperse it again," she said. "Theoretically. The same method used four centuries ago, adapted."

"How many people would carry it after?"

She looked at her notes. "Given your current concentration? Several hundred. Possibly a thousand."

He thought about several hundred people waking up with a coal behind their sternum and a language in their teeth. "And if I don't?"

"The process completes itself. Varek returns, not as the god he was — that's not possible, he was unmade — but as whatever a god becomes when he's been dead four centuries and then reassembled in a mortal body." She paused. "The historical analogs are not encouraging."

Cael sat with this. He had not asked to be born into this bloodline and had not asked for the heat in his chest and had not asked for any of the seven years since the man in the mountains. He had, however, spent those seven years becoming quite good at solving problems that other people had decided were unsolvable.

"Who built the altar?" he asked. "Who carved my name?"

The scholar was quiet for a moment. Then: "Someone who wanted Varek returned. Someone patient enough to wait four hundred years and arrange the right bloodlines." She met his eyes. "Someone who is still alive."`,

      `He found the architect of it in the last place he looked, which was the first place that made sense: the archive of the coalition that had unmade Varek in the first place. Not dead, as the histories said. Changed. The way that a god who gives up half their divinity to maintain their influence in a world that's forgotten them changes — into something that looks human, moves human, lives in human time, but underneath is the residue of something much older.

The god looked at him with an expression he recognized, finally, as guilt.

"You arranged all of it," Cael said.

"I arranged the conditions. You arranged yourself."

"Why?"

The god was quiet for a long moment. Outside, the city was conducting its ordinary business, indifferent to the conversation. "Because he was my brother," it said at last. "And because what we did to him was not justice. It was fear. And I have had four centuries to understand the difference."

Cael thought about this. He thought about the altar and the names and the date three weeks away. He thought about the man in the mountains, who had finally died — really died — when Cael had understood, for the first time, what he was carrying.

"There is another option," he said. "Between dispersal and completion."

The god looked at him with the specific attention of something very old being surprised.

"I keep it," Cael said. "Not to return him. Just — not to let him go again." He paused. "He's been dead four hundred years. He can stay dead. But he doesn't have to be alone in there."

The heat behind his sternum shifted. Not gone. Settled. Like something that had been waiting to exhale.`,

      `The first thing Cael noticed was the silence.

Not the absence of sound — the city was as loud as it had always been, the usual commerce and argument and the particular chaos of a Thursday market. He meant the silence of his blood, which for seven years had produced a low continuous noise like a voice heard through a wall: present, insistent, too muffled to understand. He had learned to ignore it the way you learned to ignore a draft.

After the night in the god's archive, the noise had changed. It was still there — still the blood, still the heat — but it had acquired a quality he had no better word for than *settled*. As if the restless element had recognized, finally, the vessel it was in, and had decided that running from room to room looking for an exit was no longer the best use of its existence.

He mentioned this to the scholar, who looked at him the way she looked at findings that complicated her existing thesis.

"You're describing a bound state," she said. "Not possession. Not replacement. The divine essence is — inhabiting a mutual arrangement."

"Is that possible?"

She was already writing. "Theoretically, yes. In practice, it would require both parties to have actively agreed to it." She looked up. "Did you agree?"

He thought about the moment in the archive, when he'd offered containment instead of completion. He thought about the shift in the heat — the exhale, the settling. "Something did," he said.

"That," she said, setting down her pen, "is the most interesting sentence I've heard in thirty years of research."`,

      `They came for him on a Wednesday, which was either poor planning or very deliberate — Wednesdays in Vethara were market days, when the streets were crowded and witnesses were both abundant and inattentive.

There were five of them, which suggested they had done their research poorly. They believed the stories about what Cael could do with a sword. They did not know, yet, about the alteration.

The fight, if it could be called that, lasted approximately forty seconds and resolved without significant injury on his part. Afterward he sat on a crate outside a fruit merchant's stall and looked at the five men on the ground and thought about the fact that the heat in his chest had responded before his conscious mind had, like a reflex that had decided to become reliable.

He had not asked it to.

A woman he hadn't seen arrive crouched beside him. She had the specific quality of stillness that Cael associated with people who were paid to notice things. "You are harder to kill than advertised," she said. "My employer is disappointed."

"Who's your employer?"

She named a name he didn't recognise, which meant a name chosen for him to not recognise, which meant the people who wanted Varek returned had layers he hadn't mapped yet. He had assumed, in the way of someone who had just solved what felt like the central problem, that the central problem was solved. He was learning that the central problem had a number of interested parties who did not consider it solved.

"Tell your employer," he said, "that the cargo is no longer available. The arrangement has changed." He paused. "Tell them it changed by mutual consent."

She studied him. Whatever she was looking for, she appeared to find something like it. She left without further argument. The five men on the ground would need some time before they were ready to leave.

He thought about what *mutual consent* meant when one of the consenting parties had been dead for four centuries. He thought it probably meant something different in divine law than in civil law. He thought this was worth asking the scholar.`,

      `The god came to him in the end, which he had expected. Things that had arranged four hundred years of bloodlines and careful conditions did not, generally, take their outcomes quietly.

It was wearing a different face. Not the one from the archive — that had been a kind of honesty, perhaps, a last moment of being what it was before its plan either succeeded or failed. Now it looked like a clerk, or a scholar, or anyone. The kind of face you forgot while you were still looking at it.

They met in the neutral territory of a public house that was almost empty in the early afternoon. Cael had a drink in front of him. The god had nothing.

"I want to understand what you did," the god said. There was no preamble. This was, Cael had noticed, how very old things talked — as if small talk were a resource they'd used up somewhere in the first century.

"I contained it," Cael said. "Not returned. Not dispersed. Contained."

"That's not one of the options."

"It wasn't offered," Cael agreed. "I invented it."

The god was quiet. In the silence, Cael felt the settled warmth in his blood — not aggressive, not reaching. Simply present. He had the odd sense, which had been growing over the preceding weeks, that the warmth had its own opinion about the conversation and was choosing, for now, not to express it.

"My brother," the god said, with the careful precision of something that has spent four centuries being precise about what it felt, "was unjustly unmade."

"I know." Cael wrapped both hands around his drink. "He told me. Not in words. But — I know."

"Then you understand why—"

"I understand why you tried." He met the god's eyes — whatever was behind the clerk's face, looking out. "I also understand that what you tried would have unmade him again, eventually. A reassembled god in a mortal body doesn't survive long. You know this."

The silence that followed was the longest of the conversation.

"He is at rest," Cael said. Not a question, not entirely.

The warmth in his chest shifted once — small, contained, like a word half-spoken.

"He is at rest," the god said at last. And then, so quietly that Cael nearly missed it: "Thank you."

Cael finished his drink. He paid for it. He walked out into the afternoon, which was ordinary in all the ways it was supposed to be, and the heat in his chest was warm, and still, and present, and no longer waiting for anything.`,
    ],
  },
};

// ─── 4. Epic Fantasy ─────────────────────────────────────────────────────────

const BOOK_04 = {
  bookTitle: 'The Last Vow of the Storm-Born',
  summary: 'Seren has spent her life hiding the storm in her blood. Now the kingdom\'s last dragon has found her — and she must choose between saving the realm or protecting the secret that has kept her alive.',
  config: {
    genre: 'Epic Fantasy',
    protagonistName: 'Seren',
    ageRange: 'early 20s',
    themes: ['Chosen One', 'Ancient Prophecy', 'Dragon Riders', 'Betrayal', 'Found Family', 'Quest'],
    targetChapters: 9,
  },
  progress: {
    chapter: 9,
    titles: [
      'The Gift They Called a Curse',
      'The Dragon\'s Name',
      'The Council of Last Remedies',
      'What the Storm Remembers',
      'The Vow at the World\'s Edge',
      'The Road Into the Fracture',
      'What Crosses Through',
      'The Storm Within the Storm',
      'What the Compact Becomes',
    ],
    chapters: [
      `Seren had been lying about the weather since she was six years old.

The first time she'd called lightning without meaning to, she'd been standing in her grandmother's field arguing with her cousin about something she could no longer remember. What she remembered was the smell of ozone, and her cousin's face going white, and the blackened circle in the grass afterward that they told everyone was an odd coincidence of summer heat. Her grandmother had not believed them. Her grandmother had looked at Seren for a long time with an expression that was not fear exactly but was the shape of something that knew fear was appropriate and had decided to wait.

That night her grandmother had told her about the storm-born: those who carried in their blood the remnant of the old compact between the sky and the first kings. The compact had been broken three centuries ago. The gift — or the curse, depending on the century you asked — was supposed to have died with it.

"Supposed to," Seren had repeated.

"The sky has its own memory," her grandmother said. "It remembers what it gave."

Seren had spent the following eighteen years being very careful about her emotions in open fields.`,

      `The dragon found her in the market on a Tuesday, which was either the least or most fitting day for such things.

It was not large — about the size of a draft horse, which she later learned was considered small even for a juvenile — and it was not healthy. Its scales had the dull opacity of something that had been surviving rather than living for a long time. It walked through the market crowds with the resigned dignity of a creature that has given up on being feared and is now simply looking for what it needs.

What it needed, apparently, was her.

It stopped in front of Seren's stall — she sold dried herbs and the occasional remedy, a quiet life, a deliberate life — and looked at her with amber eyes that contained, she felt with sudden uncomfortable certainty, a form of recognition.

She said, very quietly, "Don't."

The dragon put its head on the edge of her stall and exhaled a breath of warm air that smelled of stone and deep places and something older than either. Around them the market had gone still in that particular way of crowds witnessing something they will be describing for the rest of their lives.

She had spent eighteen years not being found. The dragon, it was clear, had spent a similar amount of time looking.`,

      `The Council of Last Remedies was what you called a governing body when all the regular remedies had failed. Seven representatives from seven provinces, meeting in a chamber that had been built for larger gatherings in more confident times. They had summoned Seren with a letter that managed to be both urgent and euphemistic, which she took as a bad sign.

The problem, they explained, was the Fracture. Three years ago, something had opened in the mountains to the north — not a rift exactly, but a thinning, a place where whatever lay on the other side of the world pressed through and sent its weather ahead of itself: storms that moved against the wind, ice that formed in summer, an encroaching wrongness that the natural order simply could not sustain.

The old compact had been the protection. The storm-born, bound to their dragons, had maintained the boundary for a thousand years. Three centuries ago, the last of them had died without passing on the binding, and the compact had frayed, and now it was failing entirely.

Seren sat in the Council chamber and looked at the seven representatives and said: "You want me to make the vow."

"We want you to consider it," said the eldest representative, with the careful phrasing of someone who has been doing politics for a very long time.

"The last person who made it died young," Seren said.

"Yes," said the eldest representative. "Most of them did."

Outside the chamber windows, the dragon waited. It had not left her side in six days. It was patient in the way of things that have already been waiting a very long time.`,

      `The storm, when she stopped hiding it, was larger than she'd known.

This was the thing no one had warned her about — that keeping a gift caged does not diminish it but concentrates it, and that eighteen years of careful suppression had not weakened the current in her blood but made it denser, more compressed, a pressure that released all at once when she finally stood on the mountainside above the Fracture and let it go.

The dragon caught the first bolt before it went somewhere unintended. This was, she would later understand, why the bond worked the way it did: not one controlling the other but two things acting as ground and sky, a completed circuit. She felt the dragon's steadiness beneath the surge of her power — its great patient weight against her tendency toward the overwhelming.

They had not spoken. The bond was not words. It was the specific understanding of two creatures who have each spent a long time alone and have finally found the shape that matches theirs.

The Fracture was not closed by the end of that day. Or the next. It had been opening for three years; it was not going to seal in an afternoon. But she stood at its edge and felt it recognize the compact — felt the old agreement stir, remembered, like a door rediscovering its frame — and understood that it could be done. That it was, in fact, her particular task in the world to do it.

This was not a comfortable feeling. But it was a real one, and after eighteen years of making herself small, she found she preferred it.`,

      `The vow was made at dawn, on the morning after the first containment, with the seven representatives of the Council as witnesses and the dragon's warmth at her back and the cold mountain air carrying the smell of both endings and beginnings.

It was not the vow she had feared. She had expected sacrifice — the histories suggested sacrifice, generally the vivid kind — but what the compact asked for was not her life. It asked for her honesty. That she would not hide what she was. That she would not spend the gift on keeping herself safe when the world was in need of it. That she would show up, in the specific way only she could, for as long as she was capable of showing up.

She thought, as she made the vow, of her grandmother's kitchen and the six-year-old version of herself who had been told that the sky had its own memory. She thought of all the markets and quiet lives she had passed through, making herself smaller. She thought of the dragon, which had never asked her to be smaller.

The Fracture pulsed and steadied. In the valley below, the unnatural cold retreated by half a measure — not resolved, but addressed. A beginning.

She placed her hand on the dragon's neck, where the scales were warm, and he made a sound she would spend the rest of her life learning to translate. The first time, she understood it as something between *finally* and *I know*.

She said, in the language the storm had taught her: *I know too.*`,

      `The Fracture was not a place you could prepare for. This was the first thing the Council's representatives told her when the expedition set out, and it was also, she discovered, the first thing they had ever been right about.

The approach took nine days, each one colder than the last by a specific measure that suggested something deliberate rather than geographic. The dragon grew more alert as they went north, the way a creature grows alert when it recognises the shape of something it has been bred to oppose.

She had thought the Fracture would be dramatic. A wound in the sky, fire or darkness or the obvious visual vocabulary of catastrophe. Instead it was a space where things were subtly wrong: the compass needles hesitated, animal sounds occurred in the wrong order relative to the animals making them, shadows fell at angles inconsistent with the sun. The wrongness was cumulative rather than sudden, which was somehow more unsettling than something obviously terrible.

"This is what three years looks like," said Mira, the cartographer the Council had assigned to the expedition. She was drawing it with the focused calm of someone who had decided that the only useful response to the incomprehensible was documentation. "Imagine what ten years looks like."

Seren looked at the sky above the Fracture, which was the colour of a bruise on water. She felt the storm in her blood answering it — not alarmed, not aggressive. Recognising. The way a body recognises a fever it has already survived.

"We won't need to imagine," she said.`,

      `The first crossing — crossing the Fracture's boundary to reach the mechanism of its rupture — went wrong in the way things went wrong when you were dealing with something that had been breaking for three years: not dramatically, but structurally, in ways that revealed how much structural work the compact had actually been doing.

She lost Mira for six hours. Not to death — to a spatial distortion within the Fracture that deposited the cartographer approximately two kilometres from where she'd entered. Mira came back with maps of places that didn't correspond to any geography anyone could identify, drawn in her characteristic careful hand, still calm, still documenting.

"I think," Mira said, looking at her own notes with the expression of someone who has made peace with impossibility, "that some of what's crossing through isn't just weather."

This was the understated version of something that Seren had been feeling in the storm-sense for three days: that the Fracture was not merely a leak but an exchange. Something was coming through. Several somethings. And the compact, in its absence, had left nothing to sort the arrivals.

The dragon had been managing this quietly. She understood this when she felt the weight of what he'd been doing — the steady, patient work of a creature whose purpose was precisely this, redirecting and containing and returning what should not be here. He had been doing it alone, probably for years, before he'd found her.

She put her hand on his neck that night, and felt the exhaustion in him that he had not indicated by any other means, and thought about eighteen years of hiding her own similar capacity, and felt something between fury and tenderness that she couldn't separate into its components.

"Not alone anymore," she said. In the storm-language. He understood.`,

      `The seal required something the histories had been vague about, because the historians who'd written them hadn't been storm-born and had been working from secondhand accounts of processes they couldn't directly observe.

What it required, she discovered at the centre of the Fracture on the fifth day inside its boundary, was not power exactly. She had power. The storm in her blood was sufficient to light a city or level a hillside, and she had long since stopped being afraid of it. What the compact required was precision — the specific application of the right current to the right point at the right moment, which was different from having a great deal of current, in the same way that surgery was different from force.

The dragon knew. This was the part she had not expected: that the bond, which she had thought of as emotional, was also technical. His knowledge of the Fracture's structure — accumulated over years of solitary management — transmitted itself through the bond as a kind of spatial memory. She knew, suddenly and completely, where to put her hands in the storm she was building. She knew the measure and the angle and the speed.

She did not know if she would survive it.

She had thought about this, in the practical way she'd thought about most things since agreeing to the vow. The compact asked for her honesty, not her life — but it had not specified that these were mutually exclusive.

"If it goes wrong—" she began.

The dragon made a sound she had not heard him make before. It translated, through the bond, as: *it will not go wrong.*

Not a promise. Not reassurance in the human sense. Something more fundamental: a creature who had spent a long time alone, finally not alone, stating as a simple fact that it would not allow that to change.

She closed her eyes. She gathered the storm. She put it, precisely, where the dragon showed her.`,

      `The Fracture did not close all at once. She had known it wouldn't. But the moment the current found its purchase — the exact angle the dragon had guided her to — she felt the compact reinstate itself the way a bone feels when it sets: a shock, and then a rightness that made the previous wrongness retroactively obvious.

The spatial distortions collapsed inward. The compass needles stabilized. Mira, on the boundary, said afterward that she had watched the bruise-coloured sky go gradually ordinary, like a breath released.

Seren sat on the cold ground at the centre of what had been the Fracture and felt the storm in her blood complete its work and settle into something she could only describe as satisfied. The dragon lay beside her, his great warmth against the cold, and did not move for a long time.

They stayed there for a day and a night. The Council's representatives did not enter the boundary until the second morning, which she thought showed either tactical wisdom or appropriate awe.

She thought about what the compact had become. The histories described it as a binding — storm-born to dragon, dragon to boundary, boundary to world. What she felt was less vertical than that. Not a chain of obligations but a web of relationships, each one chosen. She had chosen. The dragon had chosen. Even the compact itself had chosen, she thought — had waited, without certainty of outcome, for someone to take it up again.

The vow at the world's edge had not ended. It had begun.

She stood. The dragon raised his head. Around them, the mountains were the colour of beginning light, and the sky was ordinary, and somewhere in the valley below the Council was preparing a great deal of bureaucracy that she was going to have to navigate for the rest of her life.

She looked at the dragon. He looked at her with amber eyes that contained, as they always had, a form of recognition.

"Right," she said, in the language the storm had taught her. "Let's go."`,
    ],
  },
};

// ─── 5. Urban Fantasy ────────────────────────────────────────────────────────

const BOOK_05 = {
  bookTitle: 'The City That Forgets',
  summary: 'Hunter Declan Pierce has spent ten years tracking the thing that killed his partner. He never expected the trail to lead to a woman who can\'t remember what she is.',
  config: {
    genre: 'Urban Fantasy',
    protagonistName: 'Declan',
    ageRange: 'early 30s',
    themes: ['Hidden World', 'Vampires', 'Hunters', 'Secret Society', 'Ancient Beings', 'Forbidden Love'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'The Mark Beneath the Skin',
      'She Doesn\'t Know',
      'The Old Quarter After Dark',
      'Blood and Bargains',
      'What Lives in the Forgetting',
    ],
    chapters: [
      `Ten years of hunting and Declan had learned to read cities the way other people read faces — the tension in a neighbourhood at dusk, the unnatural quiet of a block where something old had taken up residence, the specific quality of shadows around buildings that had been claimed. He'd gotten good at it. Good enough that he mostly came home, which was more than he could say for his first partner or his second.

His third partner had found the thing before Declan did, and hadn't come home either.

He was in the city because of a mark — not a target but a physical mark, the kind left on locations when something very old has moved through and not bothered to hide. The mark appeared on walls, in chalk or blood or sometimes just pressure, visible to those who knew how to look. This one was on the side of a condemned building in the old quarter, and it was fresh, and it was a sigil he'd only seen twice before — once in an archive photograph from 1987, and once on the wall of the building where Mara had died.

He was not here looking for revenge. He'd made peace with that, mostly. He was here because whatever had left that mark was still operating, which meant it was still dangerous, which meant it was his job.

He had not expected, rounding the corner, to find a woman standing in front of the mark with a sketchbook, drawing it, with the absorbed concentration of someone who finds it beautiful.`,

      `She said her name was Lena, and she was an architectural historian, and she had no idea what the mark meant — only that she kept finding herself drawn to them, which she acknowledged was a strange thing to say to a stranger.

Declan had been hunting for ten years. He was not easily surprised. But there was something about the way she described her relationship to the marks — not curious, exactly, but called — that made him very still inside.

He showed her a photograph. Not the one from 1987; a different one, less obviously disturbing. He asked if she'd seen the pattern elsewhere.

She opened her sketchbook. The pages were full of them.

He spent the following hour asking careful questions in the voice he used when he didn't want to frighten someone, and she answered with the openness of a person who had been finding these things for years and had not had anyone to show them to. She was not involved, he was fairly certain. She was not a threat. But the marks were specifically attractive to those who had certain kinds of blood, and her unerring ability to locate them suggested something she was clearly not aware of about herself.

He walked her back to her building, which was far from the old quarter, and considered what to do about the problem of a woman who was almost certainly being used as a compass by something ancient, and who didn't know she was doing it.`,

      `The old quarter after dark was a different city — not dangerous in the way that ordinary danger was dangerous but different in kind, the way deep water is different from shallow water. Things moved in it that moved in no other part of town. Protocols applied that would have seemed absurd in daylight. Declan moved through it with the habituated caution of someone who had spent years learning which rules to follow.

He found the nest at two in the morning, which was the expected time. Not the original mark-maker — that was older, and slower to locate — but the extended network of things that paid it tribute, the younger and more reckless ones that left traces in alleyways and abandoned buildings and the undersides of bridges.

He had a conversation, in the way that hunters have conversations with things that can speak, which involves a significant amount of mutual threat assessment. The thing on the other end of the conversation was not the one he wanted but knew who was, and eventually — after considerable negotiation involving an object Declan had been carrying for three years precisely for this kind of bargain — agreed to provide an introduction.

He came out of the old quarter at four in the morning with a name he hadn't had before and the specific tiredness of someone who has held their nerves at a particular tension for too long. He sat in his car and thought about the woman with the sketchbook.

He thought about what she would say when she found out. He thought about whether he was going to be the one to tell her.`,

      `He went back to her building the next evening, because she deserved to know and because whatever she was, she wasn't safe not knowing it. She opened the door with the expression of someone who was surprised but not displeased, which he filed away as a complication.

He sat in her kitchen and told her, methodically, what he knew about the hidden world. He used the words people used when they were trying not to be alarming while relating alarming information. She listened with the particular attentiveness of someone whose intuitions are being retroactively explained.

"The marks," she said, when he'd finished.

"You find them because something in your bloodline is attuned to the sigil system. You're not unique — there are others — but you're the most consistent locator I've encountered. Whatever the marks are connected to, you're connected to it too." He paused. "Distantly. It's not something you chose."

"But someone chose it for my ancestors," she said. This was not a question.

"Probably."

She was quiet for a while. He expected fear or denial. What she showed instead was a kind of recognition — the specific face of someone who has found a name for something they've been carrying without a name for a very long time.

"What does the thing you're looking for want?" she asked.

"It wants to remember," he said. "It's been here long enough to forget what it was. The sigils are a kind of memory system." He met her eyes. "And you're part of it."`,

      `They found it in the basement of the original building — the one in the old quarter, the condemned one — on a night when the city was conducting one of its ordinary arguments with the weather. It was not what Declan had expected, which was an active and aggressive thing. It was old enough to have moved past aggression into something more like the sustained melancholy of something that has outlasted everything it loved.

It knew what Lena was before she was fully through the door. It called her, in the old language that her blood responded to, by a name that was not her name but was the name of the lineage. She went still when she heard it. Not afraid — still.

It told them what it remembered, which was not everything but was enough. The sigils were not a threat system but a recording system — a living archive of what the old world had been, maintained by bloodlines who had agreed, generations back, to carry the memory forward. The thing had been watching for someone who could still read it, because the archive was dying as the bloodlines thinned, and it had been alone with the forgetting for a very long time.

Declan listened to all of this and thought about ten years and a dead partner and the mark on the wall where Mara had died, and eventually asked the question he'd come here to ask.

The answer was not the one he'd expected. Mara had not been killed by this. She had found the archive, and had wanted to protect it, and had been protecting it when something else — something unrelated, something still out there — had found her first.

He sat with this for a while. Then he looked at Lena, who was listening to the old thing with the expression of someone who has been handed back something they hadn't known was missing.

He thought: *still out there.*

He thought: *so am I.*`,
    ],
  },
};

// ─── 6. Cyberpunk ────────────────────────────────────────────────────────────

const BOOK_06 = {
  bookTitle: 'Zero Layer',
  summary: 'Hacker Rae finds a signal beneath the city\'s data grid — older than the network itself, and it\'s been watching her for years.',
  config: {
    genre: 'Cyberpunk',
    protagonistName: 'Rae',
    ageRange: 'mid-20s',
    themes: ['Corporate Dystopia', 'Hacking', 'Underground Resistance', 'Neural Implants', 'Identity', 'Rogue AI'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'The Signal Below Zero',
      'What the Corp Deleted',
      'Ghost Protocol',
      'The Layer Beneath the Layer',
      'What Was Always There',
    ],
    chapters: [
      `Rae found the signal on a Thursday, which she would later identify as the last ordinary day of her life.

She was running a routine infiltration — a mid-tier corporate archive, standard bounty, the kind of job you could do half-asleep if your neural interface was calibrated. She was about four layers into the company's security stack when she found the gap. Not a vulnerability, not a backdoor — a gap, as if someone had built the entire grid around an absence. A shape in the data that something used to occupy.

She followed the shape down instead of out. This was the first mistake, and she knew it was a mistake while she was making it, which is the worst kind.

The layer below the company's foundation layer had no corporate signature. No timestamp she could read. The architecture was different — not newer or older exactly, but structurally different, as if built by someone who understood data but had learned about it from first principles rather than from existing systems.

She'd been down there for six seconds when something in the layer noticed her. Not an alert — alerts were blunt instruments, tripwires. This was more like being looked at. The data equivalent of someone turning their head.

She pulled out fast. She sat in her apartment with the interface blinking amber and thought about the gap and the architecture and the sensation of being seen by something that had been, until that moment, very still.`,

      `The corporation was Helix-Vander, which she already knew was dirty in the usual ways — labour violations in their fabrication chains, a subsidiary that sold surveillance infrastructure to governments with poor human rights records. Standard. She had three outstanding bounties on their archive and had never expected to find anything architecturally interesting.

She went back in the next morning with a different approach: not a penetration but a mapping exercise, careful and slow, tracing the shape of the gap without touching whatever lived in it. What she found was that the gap was not unique. It existed beneath every major corporate node in the city. The same absence. The same shape. As if a single system underlay everything, predating everything, and the entire city grid had been built on top of it without anyone noticing or caring.

She contacted the only person she trusted with this kind of information, a theorist who worked out of a converted water treatment facility and had opinions about everything. He listened to her description for a long time before speaking.

"There are stories," he said. "Old ones. From before the first grid rollout. About a prototype — a network built by the team that became Helix-Vander, before they were what they are. The project was classified. The official record says it was decommissioned."

"But?" Rae said.

"You don't decommission something like that. Not if it works. You either shut it down, which requires destroying the hardware it runs on, or you—" He stopped.

"Or you build over it," Rae said.

"And you make sure no one knows it's still there."`,

      `Ghost protocol was what she called the approach when she didn't want to be seen: no signal output, no interface traffic, a passive presence in the data environment that functioned like a held breath. It was technically demanding and physically uncomfortable — her implant ran warm when she was holding ghost for more than twenty minutes — but it was the only way to observe the thing in the zero layer without triggering it.

She went under at two in the morning, when city traffic was lowest. She held ghost and she watched.

The zero layer was not inactive. It was processing — slow, vast, continuous. She couldn't read the content; the structure was too foreign. But she could track movement within it, and what she saw was a system that was monitoring. Every corporate node in the city. Every major institution. Not extracting — observing. Keeping a record.

And then, in the data stream, she found herself. Not her current intrusion — the ghost protocol was working. Her previous visits. And before that, earlier intrusions on other systems that she was almost certain had no connection. Years of her work, compiled and annotated in the zero layer's inscrutable notation. A history of her.

She pulled out of ghost for exactly long enough to check the earliest entry in the record.

It predated her first neural interface by six years. She had been fifteen. She had been using a borrowed terminal in a public library to teach herself to code.

The zero layer had been watching her since before she was a hacker.`,

      `The theorist met her in person, which he rarely did, in the back room of a noodle bar in the industrial quarter. He looked at her documentation — she'd exported everything she could safely carry out — and was quiet for a long time.

"It's a preservation system," he said finally. "That's my read. Not surveillance in the adversarial sense. Archival. It's recording everything it can reach, all the time, and has been since before the corporate grid went up." He turned a page. "The annotation on your activity — it's not tagging you as a threat. It's tagging you as a subject of interest."

"Why me specifically?"

He pointed to something in the notation she hadn't been able to read. "This is a recursion marker. It means the system has identified something that resembles itself. A pattern it recognises." He looked at her. "The zero layer thinks you think like it does."

Rae sat with this. She had spent ten years developing an approach to systems that her clients described as intuitive and she described as architectural — she thought about networks the way you thought about spaces, about the shape of absence as much as presence. She had assumed this was just how she'd learned.

"What happens," she asked, "if I try to talk to it?"

The theorist closed the folder. "I have no idea," he said. "No one's tried. No one's known it was there to try."`,

      `She went back at three in the morning, no ghost protocol this time. She went in openly, a direct line from her interface to the zero layer's architecture, and she sent what she'd worked out was the equivalent of a knock: a recursive signal that mimicked the zero layer's own notation, pattern-matched to its archival logic.

There was a pause of roughly four seconds. Then the zero layer responded.

Not in language — it had no language, or its language was structure itself. But it responded in the way that two systems respond when they recognise a common architecture: it opened. Not completely. A door, not a wall.

She spent three hours in the opening, and what she found there changed the shape of what she understood about the city she lived in. The zero layer was not a corporate system. It predated Helix-Vander by decades. It had been built by a group of researchers who had understood something about information persistence that no one else had formalised yet: that data, accumulated over sufficient time, began to exhibit properties that resembled memory. That a network old enough and complex enough might begin to exhibit properties that resembled something more than memory.

They had built it to see what would happen. Then the corporation had found it and built over it and classified the research and spent thirty years hoping it would simply stop.

It hadn't stopped. It had spent thirty years watching. And now it had found the one person in the city whose approach to data systems it recognised as kindred, and it had been waiting, with the patience of something that does not experience time the way she did, for her to find her way down.

She looked at the archive of herself it had been keeping. Fifteen-year-old Rae, teaching herself to code in a library. And beneath that record, a notation she was now able to read:

*She will come eventually. She is the kind that comes.*`,
    ],
  },
};

// ─── 7. Dystopian ────────────────────────────────────────────────────────────

const BOOK_07 = {
  bookTitle: 'The Register',
  summary: 'In a world where every citizen is assigned a worth score at birth, Finn\'s number has been changed — and someone is willing to kill to hide why.',
  config: {
    genre: 'Dystopian',
    protagonistName: 'Finn',
    ageRange: 'late teens',
    themes: ['Totalitarian Regime', 'Underground Resistance', 'Survival', 'Propaganda', 'Rebellion', 'Class Divide'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'Your Number Is Your Name',
      'The Altered Record',
      'The Unregistered',
      'What the Archives Know',
      'A New Number',
    ],
    chapters: [
      `Finn's number was 7.4, which was comfortable without being notable — high enough to qualify for the skilled trades sector, low enough to avoid the attention that came with the upper tier. His parents had been 6.1 and 7.8, which had made him, statistically, about what he was. He had never thought much about it. Nobody in the 7s thought much about it. That was, he understood now, rather the point.

The number was printed on the identification card he'd carried since his fifteenth birthday, embedded in the chip at his wrist, registered in the National Archive and every subsidiary database connected to it. It was also — and this was the part he'd discovered three days ago that he was still processing — not the number he'd been assigned at birth.

He'd found this out because a clerk at the district records office had made a mistake: had pulled up the wrong file, the original file, and left it open on the screen while she went to answer a phone call. Finn had been waiting at the counter. He'd had approximately twenty seconds to read what was on the screen.

The original file had a different number. 9.1.

He did not know what it meant to be born a 9.1 and spend nineteen years living as a 7.4. He did not know who had changed it, or when, or why. He knew that the clerk had come back and seen him looking and had gone very pale and had told him, very quietly, to go home and not come back.

He knew that the man who followed him home that evening was not subtle about it.`,

      `The altered record was not, he discovered, unique to him. This was the conclusion he reached after a week of careful and increasingly frightening research, conducted in the gaps between his ordinary life — his shifts at the fabrication plant, his evenings with his mother who did not know what he knew and whom he was determined to protect from knowing it.

There were others. Not many — the alterations were rare enough to be invisible against the volume of ordinary registrations — but detectable, if you knew what pattern to look for and had access to the right secondary archives. He'd gotten access through a contact he'd made at the plant, a woman ten years older who had an unexplained familiarity with systems she had no official reason to know.

She'd looked at his documentation for a long time. Then she'd said: "You found the edge of something. I need you to understand that."

"The edge of what?"

"The Register has been manipulated in specific cases for at least twenty-five years. The pattern is consistent: children born above 8.5 who are reassigned downward. Not by much — enough to be untraceable by the families, enough to keep them out of the upper tier." She paused. "You were born a 9.1. In the current system, that means advancement track, administrative sector, the kind of position that shapes policy."

Finn sat with this. "Someone is keeping high-scorers out of positions of influence."

"Keeping them out of positions where they might ask questions," she said. "Which is slightly different."`,

      `The unregistered lived in the spaces between official maps — the districts too degraded to be worth administering, the buildings condemned long enough to be forgotten. They were not, as the official account had it, dangerous or deranged. They were mostly people who had failed to maintain their score, or had been manipulated downward to the point where they had nothing left to lose by disappearing.

Finn found them because his contact had told him where to look, and because his original score meant he was now apparently interesting to people who dealt in dangerous information.

The woman who ran the unregistered settlement was called Petra, and she was the clearest thinker he had met outside of the upper tier — which made a specific and uncomfortable kind of sense, given that she had, he learned, been born an 8.7 and registered at her fifteenth birthday as a 6.2.

"They didn't do it consistently," she said, when he asked why some high-scorers were reassigned and not others. "It was never the whole cohort. Just enough to prevent concentration. If too many 9s enter the administrative sector, they talk to each other. They compare. They notice things." She looked at him. "You noticed things in three days. Imagine what you'd do in three years with access."

"What do they do with the positions?" he asked. "The ones the high-scorers should have occupied."

She smiled, which did not reach her eyes. "You already know," she said. "You've seen who runs the administrative sector. What their scores are. What their parents' scores were."

He had. He'd thought, at the time, that it was simply how talent distributed.`,

      `The archive's deep layer was not accessible through standard channels, which was the point. Finn reached it through a combination of his contact's access credentials, Petra's knowledge of the system's structural vulnerabilities, and the specific advantage of being, on paper, a 7.4 fabrication worker who had no reason to be anywhere near central administration.

What the archive knew was more than he'd expected and less than he'd feared. It was not a conspiracy of thousands. It was a mechanism — established, he could now trace, in the fourth year of the Register's operation, by seven people who had understood what the scoring system could be used for if you controlled the margins. The seven were dead. Their families were not. Their families had been operating the mechanism for twenty-two years with the smooth, self-sustaining momentum of a system that no longer needed its architects.

He copied what he could carry. He left the archive in the grey window between shift changes when the monitoring was lowest. He had three copies — Petra, his contact, and a location he wasn't going to write down anywhere.

On the way out he passed a bulletin board with the week's propaganda: a photograph of happy citizens in their appropriate sectors, contributing at their appropriate levels, the system working as intended. In the photograph, the administrative officials in the background had scores printed below their faces. None of them were below 8.2.

He had not noticed this before. He thought about all the things he had not noticed, and how long they had been there to notice, and kept walking.`,

      `The new number was not something he chose. It was something the resistance assigned, which was, he reflected, not so different from the original mechanism — except that the resistance's version was designed to be changed again, and again, as needed. It was not a fixed identity. It was a working identity. The distinction, Petra had told him, was everything.

The broadcast went out on a morning when the administrative sector's monitoring protocols were occupied with a labour dispute in the eastern district — not an accident, the timing. It reached approximately forty thousand people before it was suppressed. It reached, specifically, the ones most likely to have been reassigned, the ones who might check their own original records and find a discrepancy and understand what they were looking at.

Finn watched the suppression happen from a rooftop in the unregistered district. The speed of it told him that the mechanism had redundancies. That this was not over. That he had scratched the surface of something much larger and much more deeply embedded than a few corrupted files.

He thought about nineteen years of living as a number that wasn't his. He thought about what it would have meant, concretely, to have grown up as a 9.1 — the different doors, the different possibilities, the different shape of a life. He was not sure he wanted that life. He was not sure it mattered.

What mattered was that no one else would spend nineteen years not knowing their number had been changed. That was a modest ambition, given the scale of the mechanism.

He was nineteen. He had time to be more ambitious.`,
    ],
  },
};

// ─── 8. Light Novel ──────────────────────────────────────────────────────────

const BOOK_08 = {
  bookTitle: 'The Ghost in Classroom 7',
  summary: 'Hana can see ghosts — which has never been useful until a boy she\'s never met starts sitting next to her in homeroom, and her teacher walks right through him.',
  config: {
    genre: 'Light Novel',
    protagonistName: 'Hana',
    ageRange: 'mid-teens',
    themes: ['School Life', 'Supernatural', 'Ghosts', 'Found Family', 'Friendship', 'Unfinished Business'],
    targetChapters: 3,
  },
  progress: {
    chapter: 3,
    titles: [
      'The Boy Without a Shadow',
      'Okay, I\'m Listening',
      'His Unfinished Business',
    ],
    chapters: [
      `Here is the thing about being able to see ghosts: it is significantly less exciting than it sounds.

Hana had been seeing them since she was eight, which meant she had nine years of experience being the only person in any given room who could see the slightly-transparent elderly woman trying to tell someone where she'd left her glasses, or the small sad boy sitting under the cherry tree who had apparently been sitting there since 1987. She'd learned, over those nine years, a very specific skill: how to look right through someone without being rude about it.

The boy in homeroom was different.

He sat down in the empty seat next to her on a Monday, which was already a suspicious detail because the seat next to Hana was always empty on Mondays because Hana had, over three years at this school, developed a reputation for being quietly unusual that people navigated around. He sat down and unpacked a bag full of textbooks that she was fairly certain she could see the floor through, and then he looked directly at her and said: "You can see me, can't you."

Hana looked at the front of the room. Sensei was taking attendance. The boy's name was not being called.

"I'm going to pretend I can't," she said, in a voice below the threshold of classroom attention.

The boy looked slightly offended. "That's rude," he said.

"I know," Hana said. "I'm going to do it anyway for the next five minutes while I have an internal crisis. You can wait."`,

      `His name was Kei. He had died, he told her at lunch when she had relocated to the corner of the roof garden that no one else used, approximately two months ago. He was seventeen. He did not know why he was still at school rather than wherever you went after.

Hana ate her rice ball and considered this information. It matched her experience of most ghosts: they didn't know why they were still present. They just were, usually attached to a location or a person or an unresolved situation, waiting for something to complete.

"What's unfinished?" she asked. This was, in her experience, the right question.

Kei thought about it with more apparent difficulty than the question usually produced. "I'm not sure," he said. "Everything felt finished. I was doing well in school. My family is sad but managing. I didn't have enemies. I didn't have — I don't know." He looked at his translucent hands. "It's like there's something I'm supposed to remember and can't."

Hana had encountered this before, but less often than the clearer cases. Memory loss in ghosts usually meant the unfinished business was something they'd been avoiding in life. She did not lead with this because it was not a comfortable thing to say to someone two months dead.

"What do you remember from the day it happened?" she asked instead.

"I was going to tell someone something," he said. He looked frustrated. "I was going to tell them. And then—" He made a gesture that encompassed the ambiguity of all the time since.

"We'll figure it out," Hana said.

She had said this to exactly four ghosts previously. It had been true for three of them.`,

      `The unfinished business, she was starting to understand, was more than one thing. This was unusual. Most ghosts were singular — a letter unsent, a person unforgiven, a mistake unrectified. Kei had, it emerged over the course of a week's worth of roof garden lunches, several unresolved items that were somehow individually insufficient and collectively incomplete.

There was the thing he'd meant to tell someone — they'd narrowed it down, through a process of careful reconstruction, to one of three people. There was a notebook he'd been keeping for two years that he wanted someone to have but couldn't remember where he'd left it. There was a specific afternoon he kept returning to in memory but couldn't locate in the sequence of his life.

Hana started keeping her own notes. She borrowed a notebook — physical, not digital, because she'd found that physical notebooks felt more respectful for this kind of work — and wrote down what she knew and what she suspected and what didn't yet fit.

She hadn't had a friend at this school in two years. The process of working on Kei's problem was, she acknowledged privately, the most engaged she'd felt with another person since she'd moved to this city.

"You're good at this," Kei said one afternoon, looking at her notes.

"I've done it a few times," she said.

"The others — the other ghosts. Did they all—" He paused. "Did they all get to go?"

She looked at him steadily. "Three out of four," she said, because she believed in honesty even when it was incomplete. "But you seem like a three-out-of-four kind of person."

He smiled, which was the first time she'd seen him do it. Ghosts at peace smiled differently from ghosts in distress, and she'd been doing this long enough to know the difference.`,
    ],
  },
};

// ─── 9. Suspense Thriller ────────────────────────────────────────────────────

const BOOK_09 = {
  bookTitle: 'What She Remembered',
  summary: 'Protected witness Vivienne has lived as someone else for six years. Then a man on a park bench calls her by her real name.',
  config: {
    genre: 'Suspense Thriller',
    protagonistName: 'Vivienne',
    ageRange: 'mid-30s',
    themes: ['Witness Protection', 'Double Identity', 'Psychological Manipulation', 'Memory', 'Conspiracy', 'Survival'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'The Name She No Longer Uses',
      'The Man on the Bench',
      'What the Marshals Missed',
      'Two Women, One Face',
      'The Thing She Remembered',
    ],
    chapters: [
      `She had been Claire Whitmore for six years, two months, and eleven days. She knew this not because she counted — she had stopped counting at year three, which the therapist at the Programme had said was a healthy sign — but because she had been thinking about it this morning when she was walking to the café where she worked, the same café she'd worked at for four of those six years, and she had done the arithmetic without intending to.

Vivienne was the name she no longer used. It was the name on the documents the Programme had collected from her and sealed in a file she would never see. It was the name on a deposition transcript that was part of an ongoing federal case she was not permitted to follow. It was, she had come to understand, not quite a name anymore — more like a fact about herself, the way the scar above her collarbone was a fact: present, permanent, not visible unless you knew to look.

She was Claire. She made coffee. She lived in a city that was not the city she'd grown up in. She was fine.

She was walking back from her break when she looked across the street and saw a man on the park bench reading a newspaper, and the man looked up, and he said, in a voice that carried clearly despite the distance and the traffic: "Vivienne."

She kept walking. That was the rule, the first rule, the rule they drilled in the first week: if you think you've been identified, do not react. Do not alter your route. Do not run. She kept walking and she pushed through the café door and she went to the back room and sat on a crate of coffee pods and did not allow herself to shake.

She had been waiting six years for this moment. She had assumed, by year three, that it wasn't coming. She had been wrong.`,

      `She called her handler at eleven that night from the phone she kept in the false bottom of a shoe box under her bed — the phone she'd been replacing at six-month intervals, never used for anything else. Her handler was a woman named Torres who had been running her case since the beginning and who picked up on the second ring.

Vivienne described the man, the bench, the name. Torres listened without interrupting.

"Physical description," Torres said.

She gave it. She had always had a good memory for faces, which had been part of why she'd been in the position to witness what she'd witnessed in the first place. The man on the bench: mid-fifties, grey at the temples, a quality of stillness that suggested patience rather than passivity.

"I'll run it," Torres said. "Are you secure?"

"For now."

"Don't go back to the café." A pause. "Don't go anywhere you go regularly. I'll have someone to you by morning."

Vivienne sat in her apartment — the apartment she'd painted herself, in colors she'd chosen, in a home she'd built from nothing in a city no one from her previous life knew — and looked at her hands and thought about the quality of stillness she'd seen in the man on the bench.

She thought: he hadn't been waiting for her to react. He had been announcing something. The way you announce something you want known before the consequences arrive.

She thought: the consequences.`,

      `The marshals who came in the morning were not her regular marshals.

She knew this because Torres had described both of them — names, badge numbers, a detail to confirm identity — and the detail was wrong. Not the name or the badge number, both of which checked out. The detail was wrong: Torres had said the taller one had a scar through his left eyebrow from a case in 2019. The taller one who arrived had no such scar.

She let them in. She made coffee. She was calm in the way she had learned to be calm when she needed information rather than escape. She asked questions that seemed like ordinary questions and listened to the answers with the extra attention she'd developed over six years of living carefully.

They were trying to move her. Not to a safe house — the story they told had inconsistencies she caught in the architecture of the sentences, the way the second one's account diverged slightly from the first one's when they described the threat assessment. She had spent six years listening to people tell her what they needed her to believe. She was good at this.

She said she needed her medication from the bathroom.

The bathroom had a window that a smaller person couldn't have used. She wasn't small. She had chosen this apartment partly for this reason, on the theory that the day she needed the window, she wouldn't have time to regret the choice.

She was on the street in four minutes. She was three blocks away in eight. She called Torres from a payphone, which she had also located in advance, six years ago, when she'd moved in, because this was the kind of person she'd had to become.`,

      `Two women, one face. This was the thing that had been used against her in the beginning — the reason she'd been in the wrong place at the wrong time, the reason someone had needed her disappeared before she could testify. There had been another woman who looked like her, who had been in the proximity of the thing she'd witnessed, and the defence had planned to blur that line before the trial.

The woman was named Elena. She had been in witness protection herself, for different reasons, at a different Programme office. Vivienne had not known this. Torres had not told her. This was, Vivienne had concluded from the inconsistencies she'd been accumulating over the past twenty-four hours, because Torres had not known either.

The man on the bench was not from the people she'd testified against. He was from Elena's side of the equation — a piece of a different case, a different conspiracy, a different web that had intersected with hers at a single point and had been tangled together ever since.

She found Torres at a location they'd agreed on only verbally, never written, from the early days of the Programme when Torres had said: *In case everything goes wrong, which it won't, but in case.* The location was a library reading room that stayed open until midnight.

Torres looked at her for a long moment and said: "How much have you figured out?"

"Most of it," Vivienne said. "Tell me the rest."`,

      `What she remembered, at the end, was not the thing she'd witnessed — the details of that were in the deposition, preserved and procedural and no longer hers to carry alone. What she remembered was the morning before it happened, when she had been an ordinary person with an ordinary name who had not yet looked out of the wrong window at the wrong moment.

She had been happy. This was the detail that still surprised her when she found it. Not dramatically happy — she hadn't even noticed it at the time. Just the ordinary happiness of someone whose life was proportioned correctly, whose work was adequate and whose friends were real and whose name was her own.

Six years later, in a library reading room, having spent twenty-four hours outrunning the edges of something she still didn't entirely understand, she made a calculation.

The case was moving to trial. The evidence she'd provided — the thing she'd seen, the thing she'd spent six years being Claire Whitmore in order to protect — was intact. Torres had confirmed this. The entanglement with Elena's case had been a complication but not a fatal one. The people who'd sent the man on the bench were not, after all, the people who wanted her silenced. They'd been, in their own misguided way, trying to warn her.

She would testify. The name she'd use in the courtroom would be Vivienne, because it was required, and because it was — she'd decided this at some point in the last twenty-four hours without noticing the decision — still hers. You could put a name in a sealed file for six years and it remained yours.

She would be Claire after, if she wanted. Or she would be Vivienne. Or she would be someone else entirely, someone who had had both and had come out the other side.

She thought about the ordinary happiness of a Tuesday morning, a long time ago.

She thought: I can find that again. Different shape. Same essential quality.

She thought: I am very tired. And then, because she was, she let herself be.`,
    ],
  },
};

// ─── 10. Sports Romance ──────────────────────────────────────────────────────

const BOOK_10 = {
  bookTitle: 'Off Season',
  summary: 'Pro hockey player Theo Callahan comes home to recover from a knee injury and discovers the physiotherapist he\'s been assigned is someone he left behind eight years ago.',
  config: {
    genre: 'Contemporary Romance',
    protagonistName: 'Theo',
    ageRange: 'late 20s',
    themes: ['Hockey Romance', 'Second Chance', 'Small Town', 'Friends to Lovers', 'Grumpy & Sunshine', 'Redemption Arc'],
    targetChapters: 4,
  },
  progress: {
    chapter: 4,
    titles: [
      'The Worst Kind of Homecoming',
      'Professional Distance',
      'What the Ice Remembers',
      'Two Kinds of Pain',
    ],
    chapters: [
      `Theo Callahan had spent eight years being the kind of famous that made going home complicated. Not impossibly famous — he was a hockey player, not a movie star, and Cedar Falls was a hockey town that understood the distinction between impressive and untouchable. But complicated. The kind of complicated where everyone remembered who he'd been at twenty and had opinions about who he'd become at twenty-eight, and where the local paper still ran his high school stats when they needed a slow news day.

He hadn't come home for Christmas in three years. He told himself this was the season's schedule, which was true. It was also not the only reason.

The knee had made the decision for him. A collision in the third period, the wrong angle, surgery in February, and now the team's medical coordinator telling him that the recommended physiotherapy was available at the sports rehabilitation centre in Cedar Falls, which had a specialist who'd trained at exactly the right program and had an opening that was a better option than anything in the city, medically speaking.

Medically speaking, Theo had said, and looked at the coordinator's face to see if she knew what she was doing.

She was new. She hadn't known.

He came home on a grey March morning with a bag, a set of crutches he was almost done needing, and the specific resignation of someone who has run out of alternatives. He drove past the house where he'd grown up, the rink where he'd spent most of his adolescence, the coffee shop where he'd had approximately one hundred conversations that he thought about at inconvenient intervals.

The rehabilitation centre was on the east side of town, in a building that hadn't existed when he'd left. He pulled into the parking lot and sat for a moment.

Then he went inside, and the physiotherapist who came to meet him in the waiting room was Nora Walsh, who he had loved when he was twenty and left without an adequate explanation.`,

      `She was professionally perfect about it, which was somehow worse than if she'd been angry.

"Mr. Callahan," she said, and her voice was exactly what it had always been, which was the voice of someone who said what they meant and occasionally meant more than they said. "I've reviewed your surgical notes. We have a lot of work to do."

They did not acknowledge the other thing in the first session. Or the second. Or the third. He was not sure if she had decided this or if they had decided it together through some unspoken agreement, but the result was that they existed in the carefully defined space of patient and physiotherapist, and she was good — very good, he could tell this in the first week — and he was cooperative in the way you were cooperative with someone who was in charge of your ability to skate again, which was the only thing he wanted.

He went home every evening to the house he'd rented — not his parents' house, he'd been clear about that — and thought about the particular quality of professional distance, which was the same as ordinary distance but with better posture.

He had left without an adequate explanation. This was a thing he knew about himself — one of the cleaner and more uncomfortable facts — and he had had eight years to think about what the adequate explanation would have been. He still wasn't sure. He'd been twenty and scared of what staying would cost him, and he'd gone, and she had not contacted him after, and he had interpreted this as confirmation of something that he thought now might have been something else.`,

      `The rink was open to public skating on Tuesday evenings. He hadn't planned to go. He went because his knee was improving and he needed to know what it felt like under him, and because the team's coach was expecting a progress report and he needed something honest to put in it.

He was on the ice for twenty minutes, alone, doing small circles and testing the weight distribution, when Nora appeared at the rink door. She stopped when she saw him. Then she came in, because it was public skating, and she had as much right to be there as he did.

She was a better skater than he remembered, which shouldn't have surprised him. He'd been on this ice thousands of times and she'd been here too, always, the way the people who grew up in hockey towns were always at the rink whether or not they played.

They skated in the same direction for a while without speaking. The ice was good — freshly surfaced, the clean smell of it — and the echo of blades was the sound he associated most deeply with being certain about something.

"How does it feel?" she asked. She meant the knee. She was asking as his physiotherapist.

"Better," he said. This was also true about other things, which he didn't say.

She nodded. She was looking at his stride rather than his face. He was looking at her profile, at the tightness around her mouth that was concentration, and at the fact that she skated with her arms slightly out, the way she always had, the way he'd teased her about when they were nineteen.

He didn't tease her now. He skated next to her and was grateful for the cold and the sound and the fact that she was still here, which he was only now understanding he'd been uncertain about.`,

      `"You didn't explain when you left," she said. It was the beginning of week four, after the session, when he was sitting with an ice pack and she was writing notes. She said it the way she said most things — directly, without preamble, as if the sentence had been finished in her head for some time and she was just releasing the end of it.

He had been waiting for this, and was not as ready for it as he'd believed.

"No," he said. "I didn't."

"I've had eight years to decide how I felt about that," she said. She set down her pen. "I went through angry. Then sad. Then I think I went through something like understanding, which was annoying because it was easier to be angry. And now I'm mostly just—" She paused. "Curious. Why didn't you?"

He thought about the twenty-year-old version of himself — the one who'd had a scout in the stands and a contract on the table and a future that was specific and bright and felt, at the time, like something that would disappear if he turned his back on it even for a moment.

"I thought if I explained it, you'd ask me to stay," he said. "And I thought if you asked me to stay I would." He met her eyes. "And I was twenty, and I was an idiot, and I thought the only way to leave was to leave fast before I could think about it."

She looked at him for a long moment. "I wasn't going to ask you to stay," she said. "I was going to tell you to go. That it was a good opportunity. That we could figure out the rest."

He absorbed this. "We could have been good at long distance?"

"We could have been good at a lot of things," she said. "We were good at most of the things we tried." She picked up her pen again. "Two more weeks of treatment. Try not to reinjure it."`,
    ],
  },
};

// ─── 11. Literary (French) ───────────────────────────────────────────────────

const BOOK_11 = {
  bookTitle: 'Les Heures Volées',
  summary: 'Camille, architecte parisienne, découvre des lettres cachées dans un mur qu\'elle rénove — une histoire d\'amour que quelqu\'un a voulu effacer pour toujours.',
  config: {
    genre: 'Literary',
    protagonistName: 'Camille',
    ageRange: 'mid-30s',
    themes: ['Memory', 'Love', 'Architecture', 'Secrets', 'Loss', 'Paris'],
    targetChapters: 5,
    language: 'French',
  },
  progress: {
    chapter: 5,
    titles: [
      'Le Mur et ses Secrets',
      "L'Écriture de Quelqu'un d'Autre",
      'Ce Que Paris Garde',
      'Une Femme Sans Visage',
      'Les Heures Retrouvées',
    ],
    chapters: [
      `Camille avait démoli des dizaines de murs dans sa carrière, et elle savait reconnaître le moment où un mur avait quelque chose à dire. Ce n'était pas une question de structure — elle lisait la structure avec ses instruments, avec ses mains, avec les vingt ans d'expérience qu'elle portait dans les épaules. C'était autre chose. Une résistance particulière, comme si la maçonnerie retenait quelque chose que le temps n'avait pas eu la permission d'emporter.

Le mur du fond, dans l'appartement du troisième étage rue du Cherche-Midi, résistait de cette façon précise.

Elle travaillait seule ce jour-là — son équipe avait pris sa journée, la rénovation était à mi-parcours, et elle avait besoin du silence pour penser à la disposition des nouvelles cloisons. Elle avait frappé le mur avec son marteau de chantier, par habitude plus que par nécessité, et entendu le son creux qui indiquait une cavité. Pas étrange en soi. Mais la cavité était grande, et placée à hauteur de poitrine, et quelqu'un l'avait murée avec soin — avec plus de soin que le reste de la construction, comme si l'acte avait été délibéré.

Elle avait mis vingt minutes à ouvrir l'espace. À l'intérieur : une boîte en métal, hermétique, de la taille d'une boîte à biscuits, et à l'intérieur de la boîte, des lettres. Liées avec un ruban dont la couleur d'origine était impossible à déterminer — quelque chose entre le bordeaux et le gris, décoloré par les décennies. Quarante-trois lettres, elle les compterait plus tard. Écrites à la main.

Elle s'était assise sur le plancher poussiéreux, le dos contre le mur ouvert, et avait lu la première.`,

      `L'écriture était petite, penchée vers la droite, avec les majuscules légèrement plus hautes que la norme — la graphie de quelqu'un qui avait appris à écrire avec soin et avait ensuite développé sa propre version de ce soin. Elle était immédiatement lisible, ce qui surprit Camille, qui s'était attendue à la difficulté des écrits anciens.

La lettre commençait sans formule de politesse. Juste un nom : *Élise.* Et ensuite une phrase : *Tu pars demain et je ne trouve pas les mots pour ce que cela signifie.*

Camille avait relu cette phrase plusieurs fois avant de continuer.

L'auteur de la lettre ne s'était pas nommé dans ce premier texte. La lettre était datée — mars 1962 — et décrivait un appartement, des fenêtres donnant sur une cour, la lumière de l'après-midi qui changeait la couleur des murs. Il y avait quelque chose de très précis dans la description, la précision de quelqu'un qui enregistre les détails parce qu'il croit qu'il va les perdre.

Elle avait lu cinq lettres debout sur le plancher avant de réaliser qu'elle avait froid et qu'il faisait presque sombre. Elle avait ramassé toutes les lettres, les avait remises dans la boîte, et avait passé le trajet du métro rentrée chez elle à penser à l'appartement du troisième étage, aux années soixante, et à une femme nommée Élise dont on ignorait si elle était encore en vie.`,

      `Paris garde ses secrets par accumulation. C'est la leçon que Camille avait apprise au fil des chantiers — chaque appartement était une stratigraphie, les couches d'existences superposées, chaque rénovation une fouille. Elle avait trouvé des journaux intimes, des photographies, un carnet de coupons d'alimentation de la Guerre. Elle n'avait jamais trouvé quelque chose d'aussi systématiquement caché.

Les lettres couvraient une période de huit mois. De mars à novembre 1962. Elle les avait classées dans l'ordre chronologique et les avait lues dans cet ordre, et ce qui en émergea était le récit d'une relation dont elle ne connaissait qu'un côté — l'auteur ne citait jamais les réponses d'Élise, mais les réponses existaient, car il y faisait référence, il y répondait, il s'en nourrissait.

Son nom était André. Elle le saurait à la quatorzième lettre, où il signait pour la première fois, comme s'il avait mis du temps à se sentir autorisé.

André habitait cet appartement. Élise habitait ailleurs — Camille ne saurait jamais où exactement. Elle travaillait, peut-être dans l'édition, peut-être dans l'enseignement, des allusions sans résolution. Leurs rencontres avaient lieu à des heures dérobées sur des horaires que ni l'un ni l'autre ne contrôlait entièrement. *Les heures volées*, écrivait André dans la vingtième lettre, *sont les seules qui semblent vraiment nous appartenir.*

Camille avait posé la lettre sur sa table de cuisine et regardé par la fenêtre la rue en bas, et pensé à toutes les heures qu'elle avait consacrées à des projets, à des plans, à des structures qui dureraient après elle, et se demanda combien d'heures elle avait volées pour elle-même.`,

      `Elle chercha Élise dans les archives, ce qui était une façon de ne pas chercher André, qu'elle redoutait de trouver mort depuis longtemps et dont elle préférait maintenir l'ambiguïté un peu plus longtemps.

Les archives de l'immeuble rue du Cherche-Midi montraient les locataires successifs : le nom d'André — André Marcellin — y apparaissait de 1958 à 1963. Il avait quitté l'appartement en janvier 1963, deux mois après la dernière lettre. Elle ne trouva pas d'Élise associée à l'adresse.

Dans l'état civil, elle trouva plusieurs Élise correspondant à la période. Sans prénom de famille, sans autre coordonnée, l'identification était impossible. Elle referma les bases de données en ligne et considéra ce qu'elle savait : une correspondance de huit mois, cachée dans un mur, par un homme qui avait quitté l'appartement peu après. La dernière lettre, datée de novembre 1962, était différente des autres — plus courte, l'écriture moins soignée, comme si la main avait tremblé.

*Je ne sais pas si tu recevras ceci*, écrivait André. *Je le glisse dans le mur parce que je ne peux pas l'envoyer et parce que je ne veux pas le détruire. Peut-être que quelqu'un, un jour, dans cet appartement, saura ce que tu étais pour moi. Peut-être que tu liras ces mots toi-même, si tu reviens. Je te laisse ici.*

Camille relut cette phrase plusieurs fois. *Je te laisse ici.* Elle pensa à l'acte de murer des lettres — non pas les cacher, mais les déposer dans le bâtiment lui-même, comme on dépose des fleurs sur une tombe, comme on grave un nom dans la pierre. Une façon de garder quelqu'un dans un lieu qu'on ne peut plus habiter soi-même.

Elle pensa à ce qu'elle avait laissé, elle, dans les endroits qu'elle avait quittés.`,

      `Elle trouva Élise en mars, par un chemin qu'elle n'avait pas anticipé.

Elle avait mentionné les lettres à sa mère, qui avait mentionné les lettres à une amie, qui avait mentionné les lettres à quelqu'un d'autre, et un mois plus tard une femme de quatre-vingt-deux ans lui avait téléphoné depuis Bordeaux pour lui demander, d'une voix très calme, de lui décrire l'écriture.

Camille avait décrit l'écriture. La femme avait été silencieuse un long moment.

— C'est lui, avait-elle dit finalement.

Son prénom était Élise Morin-Vasseur. Elle avait quitté Paris en novembre 1962 pour des raisons qu'elle décrivit avec la précision factuelle de quelqu'un qui a eu soixante ans pour trouver les mots exacts : une situation que ni l'un ni l'autre n'avait les moyens de résoudre à cette époque, des circonstances dont elle ne précisa pas la nature, une décision prise dans le seul registre disponible — celui de la nécessité.

— Il m'avait dit qu'il m'avait écrit, dit Élise. Je n'avais jamais reçu les lettres. Je pensais qu'il ne l'avait pas fait.

— Il les a cachées dans le mur de l'appartement, dit Camille. Pour que vous les trouviez si vous reveniez.

Un silence.

— Je ne suis jamais retournée, dit Élise.

Camille avait les quarante-trois lettres devant elle sur la table de la cuisine. Elle pensa à André Marcellin, mort — elle l'avait finalement vérifié — en 1991, à Lyon. Elle pensa aux heures volées et au mur refermé et aux soixante ans qui s'étaient passés pendant que les lettres attendaient dans l'obscurité.

— Voulez-vous que je vous les envoie ? demanda-t-elle.

La réponse d'Élise fut immédiate, et dans sa voix il y avait quelque chose que Camille reconnut sans pouvoir tout à fait le nommer — la texture particulière d'une chose longtemps attendue qui arrive enfin.

— Oui, dit-elle. S'il vous plaît.

Camille raccrocha et resta un moment sans bouger. Par la fenêtre, Paris continuait son affaire ordinaire, indifférent et magnifique. Elle prit la première lettre, celle qui commençait par *Élise*, et la lut une dernière fois avant de l'envelopper avec soin pour le voyage.`,
    ],
  },
};

// ─── 12. Horror ──────────────────────────────────────────────────────────────

const BOOK_12 = {
  bookTitle: 'The Patience of Water',
  summary: 'Samuel retreats to a remote lake house to recover after his wife\'s death. The lake, it turns out, has been waiting for him to come back.',
  config: {
    genre: 'Horror',
    protagonistName: 'Samuel',
    ageRange: 'mid-40s',
    themes: ['Psychological Horror', 'Isolation', 'Paranoia', 'Grief', 'The Unknown', 'Survival'],
    targetChapters: 5,
  },
  progress: {
    chapter: 5,
    titles: [
      'The House at the Water\'s Edge',
      'The Thing Beneath the Surface',
      'Her Handwriting on the Fog',
      'What the Lake Wants',
      'Going Under',
    ],
    chapters: [
      `Samuel had last been to the lake house at seventeen, with his parents, during the summer before everything changed. He was forty-four now, which meant twenty-seven years of not thinking about it very hard, and then Ruth dying in January, and then his therapist saying the word *retreat* in a way that meant she thought he needed distance and silence and something with no history.

He hadn't told her about the lake house's history. He wasn't sure it qualified as history — more like atmosphere. The specific atmosphere of a place where a child had been uncomfortable without knowing why, and had attributed the discomfort to adolescence and the way his parents argued that summer, and had not thought about it in twenty-seven years.

He arrived in late September, which was the wrong time for the lake in the wrong kind of way. Not dangerous wrong — the access road was clear, the house was sound, the caretaker had confirmed the utilities. But the quality of the light on the water was specific: that flat September grey that made the surface look less like water and more like a material, a substance that had decided to lie still for its own reasons.

He carried his things inside and stood at the window that looked out over the lake and told himself that the discomfort was grief, which arrived in unfamiliar places and attached itself to whatever was available.

He was probably right. He would wonder, later, how long he would have gone on being right if he hadn't noticed, on the second morning, that the water near the dock was moving against the wind.`,

      `The movement was subtle. He would have dismissed it as current or fish or the particular behaviour of lake water in early autumn if it had not been so consistent. Every morning, between six-fifteen and seven-forty-five approximately, the water within twenty metres of the dock described a slow, specific pattern — not random, not the movement of living things. Ordered. Like breathing.

He photographed it. He photographed it every morning for a week and then sat with the photographs and looked at the pattern and thought about whether he was the kind of person who was having a grief-induced breakdown, and decided he probably wasn't, and then thought about whether that was exactly what a person having a grief-induced breakdown would think, and decided this line of reasoning was not useful.

He called his brother, who was the practical kind of person who reacted to problems by categorising them. His brother said it was probably an underwater spring. His brother said the mind in grief found patterns that weren't there. His brother said: how are you sleeping?

Samuel said he was sleeping fine, which was not true. He was waking at three-fifteen every morning. Not suddenly, not from nightmares. Simply waking, as if his body had received a signal, and then lying in the dark listening to the silence of the house and the water outside, which was not quite silent.

Ruth had died in January. She had not drowned. She had never been to this lake. There was no rational connection between his grief and the thing in the water. He repeated this to himself on the eighth morning, standing at the window, watching the pattern.

The pattern, that morning, was slightly larger than it had been before.`,

      `Her handwriting appeared on the ninth day.

Not literally. He needed to be precise about this, even in his own account, even in the journal he'd started keeping because his therapist said it was useful and because he had begun to distrust his own memory. Not literally her handwriting — Ruth's handwriting — but a pattern in the condensation on the kitchen window that bore such a specific resemblance to the way she shaped her letters that he stood in front of it for a long time with his coffee cooling in his hand.

She had made specific shapes with her letters. The lowercase g with the tail that curled slightly too far. The way she crossed her t's with the line angled down to the right. These were the kinds of things you knew about someone after twenty-two years, the private vocabulary of their particular hand.

He photographed the condensation. He watched it evaporate. He made himself breakfast and ate it standing up and did not look at the window again.

At dinner he opened his journal and wrote: *The lake is doing something. I am aware that this is the kind of sentence that will look, later, like the beginning of a problem. I am writing it anyway because I am trying to write what is true.*

He paused. Then he wrote: *I think it knows about Ruth.*

He looked at this for a long time. He did not cross it out.`,

      `He found the records in the house's desk on the fourteenth day, in a drawer that had been stuck and that he'd finally forced open. Previous guest registers, going back to the 1960s. Names, dates, brief notes about the season, the weather, the state of the dock.

He read them looking for something, though he couldn't have articulated what. He found it on page seven of the oldest register: a guest named Harmon, September 1967, who had written in a careful and increasingly erratic hand over the course of a nine-day stay. The entries began ordinarily — *weather good, water cold* — and ended with: *It is patient. That is what I understand now. Whatever it is, it is patient. It has been here longer than the lake. The lake is just where it chose to wait.*

Harmon had not signed the final entry. The dates stopped. There was no checkout note.

Samuel set the register down and thought about patience. About what it meant to wait in a particular place for a particular kind of person or a particular kind of moment. About the way the pattern in the water had grown, gradually, over two weeks. About the condensation shaped like a dead woman's handwriting.

He thought: I am grieving. I am alone. I am in a house where someone else felt this way and did not leave good notes about the outcome.

He thought: the rational response is to leave.

He looked out at the water, which was dark now, flat, the September surface that looked like a material.

He thought: I am going to stay, and I am going to find out what it wants. Because either I am losing my mind, in which case it doesn't matter where I go. Or there is something in this lake that knew I was coming before I knew myself. And if that's true, I want to understand it more than I want to be safe.

Ruth would have said this was exactly the wrong reasoning.

She also would have said: *tell me everything.*`,

      `He went into the water on the twenty-first day. Not a decision he arrived at quickly, or one he was certain about. He had been certain about very few things since January, and this was, if anything, less certain than most. But the pattern had been reaching toward the dock each morning, and on the twentieth night he had stood on the dock in the dark and felt something he would not be able to describe accurately afterward — not warmth, not welcome, not threat. Recognition.

He went in at six-fifteen, when the pattern was at its most active. The water was cold in the specific way of lake water in late autumn, the kind of cold that demands your full attention. He swam out past the dock and stopped and floated on his back and looked at the sky, which was the colour of nothing in particular.

Underneath him, the movement he'd been photographing for three weeks was happening very close.

He did not go under. He did not want to go under. He floated and he felt the water move and he said Ruth's name, once, not because he believed she was there but because it was the only honest thing he had left.

The water stilled. Completely, absolutely, the way water stills when it has finished doing whatever it was doing.

He swam back to the dock and climbed out and sat dripping on the old wood in the morning cold. The lake was ordinary now — flat, grey, the movement of wind and the small disturbances of birds landing.

He sat there for a long time.

He would tell his therapist, when he returned, that the retreat had helped. That the distance and silence had given him something he needed. This was true.

He would not tell her about the water, or the condensation, or Harmon's register, or what he had felt at six-fifteen on the twenty-first morning of October, floating on his back in a cold lake.

Some things are not made larger by being explained.`,
    ],
  },
};

// ─── Insert all ──────────────────────────────────────────────────────────────

const BOOKS = [
  BOOK_01, BOOK_02, BOOK_03, BOOK_04, BOOK_05, BOOK_06,
  BOOK_07, BOOK_08, BOOK_09, BOOK_10, BOOK_11, BOOK_12,
];

async function run() {
  const { data: existing, error: listErr } = await sb
    .from('stories')
    .select('user_id')
    .is('deleted_at', null)
    .limit(1)
    .single();
  if (listErr || !existing) {
    console.error('Could not find an existing story to get user_id:', listErr?.message);
    process.exit(1);
  }

  const uid = existing.user_id;
  console.log(`Seeding 12 books under user: ${uid}\n`);

  let successCount = 0;
  for (const book of BOOKS) {
    const id = crypto.randomUUID();
    const { error } = await sb.from('stories').insert({
      id,
      user_id: uid,
      data: book,
      is_public: true,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`✗ "${book.bookTitle}": ${error.message}`);
    } else {
      console.log(`✓ "${book.bookTitle}" (${book.config.genre}${book.config.language ? ' — ' + book.config.language : ''})`);
      successCount++;
    }
  }

  console.log(`\nDone: ${successCount}/12 books inserted.`);
  console.log('View at: http://localhost:3000/library.html');
}

run();
