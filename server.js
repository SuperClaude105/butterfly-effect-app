require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { createRequire } = require('module');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.get('/', (_req, res) => res.redirect('/landing.html'));
app.use(express.static(path.join(__dirname)));

// ─── GET /api/credits ──────────────────────────────────────────────────────
app.get('/api/credits', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.json({ credits: 0, is_comped: false, share_credits: 0 });
  const profile = await getProfile(user.id);
  if (!profile.referral_code) await ensureReferralCode(user.id);
  res.json(profile);
});

// ─── GET /api/share-credits ────────────────────────────────────────────────
app.get('/api/share-credits', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const profile = await getProfile(user.id);
  res.json({ share_credits: profile.share_credits || 0 });
});

// ─── POST /api/checkout ────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
  const { tier, bundle, giftEmail, giftFrom, giftMessage, type, shareBundle } = req.body;
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Illustrated edition addon
  if (type === 'illustrated_addon') {
    const storyTier = req.body.storyTier;
    const storyId   = req.body.storyId || null;
    const ip = ILLUSTRATED_PRICING[storyTier];
    if (!ip) return res.status(400).json({ error: 'Invalid tier' });
    try {
      const successUrl = storyId
        ? `${process.env.APP_URL}/shelf.html?illustrated_paid={CHECKOUT_SESSION_ID}&story_id=${storyId}`
        : `${process.env.APP_URL}/index.html?illustrated_paid={CHECKOUT_SESSION_ID}`;
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: `Unwritten — ${ip.label}` }, unit_amount: ip.amount }, quantity: 1 }],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: storyId ? `${process.env.APP_URL}/shelf.html` : `${process.env.APP_URL}/index.html`,
        metadata: { userId: user.id, type: 'illustrated_addon', storyId: storyId || '' },
      });
      return res.json({ url: session.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Your Story purchase
  if (type === 'storied') {
    const sp = STORIED_PRICING[req.body.storiedBundle] || STORIED_PRICING['storied_1'];
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: `Unwritten — ${sp.label}` }, unit_amount: sp.amount }, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/storied.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${process.env.APP_URL}/storied.html`,
        metadata: { userId: user.id, storiedCredits: String(sp.storiedCredits) },
      });
      return res.json({ url: session.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Library Pass purchase
  if (type === 'library_pass') {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Unwritten — Library Pass (3 simultaneous borrows)' }, unit_amount: 499 }, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/shelf.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${process.env.APP_URL}/shelf.html`,
        metadata: { userId: user.id, librarySlots: '3' },
      });
      return res.json({ url: session.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Share credit bundle purchase
  if (type === 'share_credits') {
    const price = SHARE_PRICING[shareBundle];
    if (!price) return res.status(400).json({ error: 'Invalid share bundle' });
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price_data: { currency: 'usd', product_data: { name: `Unwritten — ${price.label}` }, unit_amount: price.amount }, quantity: 1 }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/shelf.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:  `${process.env.APP_URL}/shelf.html`,
        metadata: { userId: user.id, shareCredits: String(price.shareCredits) },
      });
      return res.json({ url: session.url });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const key = `${tier}_${bundle ? 'bundle' : 'single'}`;
  const price = TIER_PRICING[key];
  if (!price) return res.status(400).json({ error: 'Invalid tier' });

  // $2 loyalty discount for users with 3+ public stories
  const { count: publicCount } = await supabaseAdmin
    .from('stories').select('id', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_public', true).is('deleted_at', null);
  const discount = (publicCount >= 3 && !giftEmail) ? 200 : 0;
  const finalAmount = Math.max(price.amount - discount, 100);

  const label = giftEmail
    ? `Gift — ${price.label}`
    : discount > 0 ? `${price.label} (Library Contributor $2 off)` : price.label;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Unwritten — ${label}` },
          unit_amount: finalAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/shelf.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.APP_URL}/index.html?payment=cancelled`,
      metadata: {
        userId:    user.id,
        credits:   String(price.credits),
        giftEmail: giftEmail || '',
        giftFrom:    giftFrom    || '',
        giftMessage: giftMessage || '',
      },
    });
    res.json({ url: session.url, discount });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/payment/confirm — verify session after redirect ─────────────
app.post('/api/payment/confirm', async (req, res) => {
  const { sessionId } = req.body;
  const user = await getUserFromToken(req.headers.authorization);
  if (!user || !sessionId) return res.status(400).json({ error: 'Missing fields' });

  // Prevent double-crediting
  const { data: existing } = await supabaseAdmin
    .from('processed_payments')
    .select('id')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (existing) return res.json({ success: true, already: true, credits: 0 });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Not paid' });
    if (session.metadata.userId !== user.id) return res.status(403).json({ error: 'Forbidden' });

    const credits        = parseInt(session.metadata.credits) || 0;
    const shareCredits   = parseInt(session.metadata.shareCredits) || 0;
    const storiedCredits = parseInt(session.metadata.storiedCredits) || 0;
    const librarySlots   = parseInt(session.metadata.librarySlots) || 0;
    const giftEmail      = session.metadata.giftEmail || '';
    const giftFrom       = session.metadata.giftFrom  || '';
    const giftMessage    = session.metadata.giftMessage || '';

    if (librarySlots) {
      await supabaseAdmin.rpc('add_library_slots', { p_user_id: user.id, p_slots: librarySlots });
      await supabaseAdmin.from('processed_payments').insert({ session_id: sessionId, user_id: user.id, credits: 0 });
      return res.json({ success: true, librarySlots });
    }

    if (storiedCredits) {
      await supabaseAdmin.rpc('add_storied_credits', { p_user_id: user.id, p_credits: storiedCredits });
      await supabaseAdmin.rpc('add_share_credits', { p_user_id: user.id, p_credits: storiedCredits * 2 });
      await supabaseAdmin.from('profiles').update({ has_purchased: true }).eq('user_id', user.id);
      await supabaseAdmin.from('processed_payments').insert({ session_id: sessionId, user_id: user.id, credits: 0 });
      return res.json({ success: true, storiedCredits });
    }

    if (shareCredits) {
      await supabaseAdmin.rpc('add_share_credits', { p_user_id: user.id, p_credits: shareCredits });
      await supabaseAdmin.from('processed_payments').insert({ session_id: sessionId, user_id: user.id, credits: 0 });
      return res.json({ success: true, shareCredits });
    }

    if (giftEmail) {
      // Gift flow — find recipient
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const recipient = (users || []).find(u => u.email?.toLowerCase() === giftEmail.toLowerCase());

      await supabaseAdmin.from('processed_payments').insert({ session_id: sessionId, user_id: user.id, credits });

      if (recipient) {
        await supabaseAdmin.rpc('add_credits', { p_user_id: recipient.id, p_credits: credits });
        const fromEmail = giftFrom || user.email || 'Someone';
        await resend.emails.send({
          from: 'Unwritten <noreply@entertheunwritten.com>',
          to:   giftEmail,
          subject: `You've received ${credits} Unwritten credit${credits !== 1 ? 's' : ''}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0d0a07;color:#e8d5b0;">
              <h1 style="font-size:26px;color:#c8a96e;margin-bottom:4px;">Unwritten</h1>
              <p style="color:#7a6a58;font-size:13px;margin-bottom:36px;">A gift has been sent your way</p>
              <h2 style="font-size:22px;color:#f0e8d0;margin-bottom:14px;">${credits} Story Credit${credits !== 1 ? 's' : ''}</h2>
              <p style="font-size:16px;line-height:1.75;color:#c0a880;margin-bottom:${giftMessage ? '20px' : '32px'};">
                ${fromEmail} sent you ${credits} credit${credits !== 1 ? 's' : ''} on Unwritten — ${credits === 1 ? 'it has' : "they've"} been added to your account automatically. Log in anytime to use ${credits === 1 ? 'it' : 'them'}.
              </p>
              ${giftMessage ? `<blockquote style="margin:0 0 28px;padding:16px 20px;background:rgba(255,255,255,0.04);border-left:3px solid #c8a96e;border-radius:2px;font-style:italic;font-size:15px;color:#e8d5b0;line-height:1.7;">${giftMessage}</blockquote>` : ''}
              <a href="${process.env.APP_URL}/shelf.html" style="display:inline-block;padding:13px 30px;background:#c8a96e;color:#0d0a07;text-decoration:none;font-size:15px;font-weight:bold;border-radius:3px;">
                Go to My Library →
              </a>
            </div>`,
        }).catch(() => {});
        return res.json({ success: true, gift: true, delivered: true, credits, giftEmail });
      } else {
        // Recipient not registered — create pending gift + send email
        const { data: gift } = await supabaseAdmin
          .from('pending_gift_credits')
          .insert({ from_user_id: user.id, to_email: giftEmail, credits, tier: 'gift' })
          .select().single();

        const claimUrl = `${process.env.APP_URL}/accept-gift.html?token=${gift.token}`;
        const fromEmail = giftFrom || user.email || 'Someone';
        await resend.emails.send({
          from: 'Unwritten <noreply@entertheunwritten.com>',
          to:   giftEmail,
          subject: `You've received ${credits} Unwritten credit${credits !== 1 ? 's' : ''}`,
          html: `
            <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0d0a07;color:#e8d5b0;">
              <h1 style="font-size:26px;color:#c8a96e;margin-bottom:4px;">Unwritten</h1>
              <p style="color:#7a6a58;font-size:13px;margin-bottom:36px;">A gift has been sent your way</p>
              <h2 style="font-size:22px;color:#f0e8d0;margin-bottom:14px;">${credits} Story Credit${credits !== 1 ? 's' : ''}</h2>
              <p style="font-size:16px;line-height:1.75;color:#c0a880;margin-bottom:${giftMessage ? '20px' : '32px'};">
                ${fromEmail} sent you ${credits} credit${credits !== 1 ? 's' : ''} on Unwritten — use ${credits === 1 ? 'it' : 'them'} to generate your own AI-written novel, personalized to your characters and choices.
              </p>
              ${giftMessage ? `<blockquote style="margin:0 0 28px;padding:16px 20px;background:rgba(255,255,255,0.04);border-left:3px solid #c8a96e;border-radius:2px;font-style:italic;font-size:15px;color:#e8d5b0;line-height:1.7;">${giftMessage}</blockquote>` : ''}
              <a href="${claimUrl}" style="display:inline-block;padding:13px 30px;background:#c8a96e;color:#0d0a07;text-decoration:none;font-size:15px;font-weight:bold;border-radius:3px;">
                Claim Your Credits →
              </a>
              <p style="margin-top:40px;font-size:12px;color:#3a2e1e;">This link can only be used once. Create a free account to claim it.</p>
            </div>`,
        });

        return res.json({ success: true, gift: true, delivered: false, credits, giftEmail });
      }
    }

    // Normal (non-gift) flow
    await supabaseAdmin.rpc('add_credits', { p_user_id: user.id, p_credits: credits });
    await supabaseAdmin.from('profiles').update({ has_purchased: true }).eq('user_id', user.id);
    await supabaseAdmin.from('processed_payments').insert({ session_id: sessionId, user_id: user.id, credits });

    res.json({ success: true, credits });
  } catch (err) {
    console.error('Payment confirm error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/social/status ───────────────────────────────────────────────
app.get('/api/social/status', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profile = await getProfile(user.id);
  if (!profile.referral_code) await ensureReferralCode(user.id);

  const { data: actions } = await supabaseAdmin
    .from('social_actions').select('action_type').eq('user_id', user.id);

  const done = (actions || []).map(a => a.action_type);
  res.json({
    has_purchased: profile.has_purchased || false,
    social_credits: profile.social_credits || 0,
    actions_done: done,
    referral_code: profile.referral_code,
  });
});

// ─── POST /api/social/claim ───────────────────────────────────────────────
app.post('/api/social/claim', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { action } = req.body;
  if (!['instagram', 'facebook'].includes(action)) return res.status(400).json({ error: 'Invalid action' });

  const profile = await getProfile(user.id);
  if (!profile.has_purchased) return res.status(403).json({ error: 'Purchase required' });

  // Check not already claimed
  const { data: existing } = await supabaseAdmin
    .from('social_actions').select('id').eq('user_id', user.id).eq('action_type', action).maybeSingle();
  if (existing) return res.json({ success: true, already: true, social_credits: profile.social_credits });

  // Record action + increment social_credits
  await supabaseAdmin.from('social_actions').insert({ user_id: user.id, action_type: action });
  const newCount = (profile.social_credits || 0) + 1;
  await supabaseAdmin.from('profiles').update({ social_credits: newCount }).eq('user_id', user.id);

  // Award free story credit when all 3 actions are done
  const { data: allActions } = await supabaseAdmin
    .from('social_actions').select('action_type').eq('user_id', user.id);
  const done = (allActions || []).map(a => a.action_type);
  const rewardEarned = done.includes('instagram') && done.includes('facebook') && done.includes('referral');

  if (rewardEarned) {
    await supabaseAdmin.rpc('add_credits', { p_user_id: user.id, p_credits: 1 });
  }

  res.json({ success: true, social_credits: newCount, actions_done: done, rewardEarned });
});

// ─── POST /api/social/claim-referral ──────────────────────────────────────
// Called when a new user signs up via a referral link
app.post('/api/social/claim-referral', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { referralCode } = req.body;
  if (!referralCode) return res.status(400).json({ error: 'Missing referral code' });

  // Find the referrer
  const { data: referrer } = await supabaseAdmin
    .from('profiles').select('user_id, social_credits, has_purchased')
    .eq('referral_code', referralCode.toUpperCase()).maybeSingle();

  if (!referrer) return res.status(404).json({ error: 'Invalid referral code' });
  if (referrer.user_id === user.id) return res.status(400).json({ error: 'Cannot refer yourself' });

  // Check referrer hasn't already gotten credit for this referral
  const { data: existing } = await supabaseAdmin
    .from('social_actions').select('id').eq('user_id', referrer.user_id).eq('action_type', 'referral').maybeSingle();
  if (existing) return res.json({ success: true, already: true });

  if (!referrer.has_purchased) return res.json({ success: true, pending: true });

  // Credit the referrer
  await supabaseAdmin.from('social_actions').insert({ user_id: referrer.user_id, action_type: 'referral' });
  const newCount = (referrer.social_credits || 0) + 1;
  await supabaseAdmin.from('profiles').update({ social_credits: newCount }).eq('user_id', referrer.user_id);

  // Check if referrer now has all 3 actions
  const { data: allActions } = await supabaseAdmin
    .from('social_actions').select('action_type').eq('user_id', referrer.user_id);
  const done = (allActions || []).map(a => a.action_type);
  if (done.includes('instagram') && done.includes('facebook') && done.includes('referral')) {
    await supabaseAdmin.rpc('add_credits', { p_user_id: referrer.user_id, p_credits: 1 });
  }

  res.json({ success: true });
});

// ─── POST /api/accept-gift ─────────────────────────────────────────────────
app.post('/api/accept-gift', async (req, res) => {
  const { token } = req.body;
  const user = await getUserFromToken(req.headers.authorization);
  if (!user || !token) return res.status(400).json({ error: 'Missing fields' });

  const { data: gift } = await supabaseAdmin
    .from('pending_gift_credits')
    .select('*').eq('token', token).is('accepted_at', null).maybeSingle();
  if (!gift) return res.status(404).json({ error: 'Gift not found or already claimed' });

  await supabaseAdmin.rpc('add_credits', { p_user_id: user.id, p_credits: gift.credits });
  await supabaseAdmin.from('pending_gift_credits')
    .update({ accepted_at: new Date().toISOString() }).eq('id', gift.id);

  res.json({ success: true, credits: gift.credits });
});

// ─── GET /api/gift-info/:token — validate gift token without auth ─────────
app.get('/api/gift-info/:token', async (req, res) => {
  const { token } = req.params;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const { data: gift } = await supabaseAdmin
    .from('pending_gift_credits')
    .select('credits, tier, accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (!gift) return res.status(404).json({ error: 'Gift not found' });
  if (gift.accepted_at) return res.status(410).json({ error: 'Already claimed' });

  res.json({ valid: true, credits: gift.credits, tier: gift.tier });
});

// ─── GET /api/suggestions ─────────────────────────────────────────────────────
app.get('/api/suggestions', async (req, res) => {
  const { data: suggestions } = await supabaseAdmin
    .from('suggestions')
    .select('id, title, body, status, created_at, user_id')
    .order('created_at', { ascending: false });

  const { data: votes } = await supabaseAdmin
    .from('suggestion_votes')
    .select('suggestion_id, user_id');

  const user = await getUserFromToken(req.headers.authorization);
  const myVotes = new Set((votes || []).filter(v => user && v.user_id === user.id).map(v => v.suggestion_id));
  const voteCounts = {};
  for (const v of (votes || [])) voteCounts[v.suggestion_id] = (voteCounts[v.suggestion_id] || 0) + 1;

  const enriched = (suggestions || []).map(s => ({
    ...s, votes: voteCounts[s.id] || 0, votedByMe: myVotes.has(s.id),
  })).sort((a, b) => b.votes - a.votes);

  res.json({ suggestions: enriched });
});

// ─── POST /api/suggestions ────────────────────────────────────────────────────
app.post('/api/suggestions', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { title, body } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  const { data, error } = await supabaseAdmin
    .from('suggestions')
    .insert({ user_id: user.id, title: title.trim().slice(0, 120), body: (body || '').trim().slice(0, 500) })
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, suggestion: { ...data, votes: 0, votedByMe: false } });
});

// ─── POST /api/suggestions/:id/vote ───────────────────────────────────────────
app.post('/api/suggestions/:id/vote', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;
  const { data: existing } = await supabaseAdmin
    .from('suggestion_votes').select('id').eq('user_id', user.id).eq('suggestion_id', id).maybeSingle();
  if (existing) {
    await supabaseAdmin.from('suggestion_votes').delete().eq('id', existing.id);
    return res.json({ voted: false });
  }
  await supabaseAdmin.from('suggestion_votes').insert({ user_id: user.id, suggestion_id: id });
  res.json({ voted: true });
});

// ─── GET /api/stats — public story count for social proof ─────────────────────
app.get('/api/stats', async (_req, res) => {
  const { count } = await supabaseAdmin
    .from('stories').select('id', { count: 'exact', head: true }).is('deleted_at', null);
  res.json({ storiesWritten: count || 0 });
});

// ─── POST /api/cron/reengagement — re-engagement emails (call daily via cron) ─
app.post('/api/cron/reengagement', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });

  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();  // 3 days ago
  const emailCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

  // Find stories updated 3-14 days ago that aren't finished
  const windowStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: stories } = await supabaseAdmin
    .from('stories')
    .select('id, user_id, data, updated_at')
    .is('deleted_at', null)
    .eq('is_public', false)
    .lt('updated_at', cutoff)
    .gt('updated_at', windowStart);

  if (!stories?.length) return res.json({ sent: 0 });

  // Group by user, pick one story per user, skip recently emailed users
  const byUser = {};
  for (const s of stories) {
    const chapters = s.data?.progress?.chapters?.length || 0;
    const target   = s.data?.config?.targetChapters || 20;
    if (chapters === 0 || chapters >= target) continue; // skip empty or finished
    if (!byUser[s.user_id] || chapters > (byUser[s.user_id].chapters)) {
      byUser[s.user_id] = { storyId: s.id, bookTitle: s.data?.bookTitle || 'your story', chapters, target };
    }
  }

  const userIds = Object.keys(byUser);
  if (!userIds.length) return res.json({ sent: 0 });

  // Check which users were recently emailed or have unsubscribed
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('user_id, last_reengagement_email_at, email_unsubscribed')
    .in('user_id', userIds);

  const skipSet = new Set(
    (profiles || []).filter(p =>
      p.email_unsubscribed ||
      (p.last_reengagement_email_at && p.last_reengagement_email_at > emailCutoff)
    ).map(p => p.user_id)
  );

  // Get auth emails for eligible users
  const eligible = userIds.filter(uid => !skipSet.has(uid));
  if (!eligible.length) return res.json({ sent: 0 });

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const emailMap = {};
  for (const u of (users || [])) emailMap[u.id] = u.email;

  let sent = 0;
  for (const uid of eligible) {
    const email = emailMap[uid];
    if (!email) continue;
    const { bookTitle, chapters, target } = byUser[uid];
    const remaining = target - chapters;
    try {
      await resend.emails.send({
        from: 'Unwritten <noreply@entertheunwritten.com>',
        to: email,
        subject: `Your story is waiting — ${remaining} chapter${remaining !== 1 ? 's' : ''} to go`,
        html: `
          <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0d0a07;color:#e8d5b0;">
            <h1 style="font-size:26px;color:#c8a96e;margin-bottom:4px;">Unwritten</h1>
            <p style="color:#7a6a58;font-size:13px;margin-bottom:36px;">Your story is calling</p>
            <h2 style="font-size:22px;color:#f0e8d0;margin-bottom:14px;">"${bookTitle}"</h2>
            <p style="font-size:16px;line-height:1.75;color:#c0a880;margin-bottom:28px;">
              You're ${chapters} chapter${chapters !== 1 ? 's' : ''} in — only ${remaining} more to go until your story is complete.
              Your characters are waiting for the next decision.
            </p>
            <a href="${process.env.APP_URL}/shelf.html" style="display:inline-block;padding:13px 30px;background:#c8a96e;color:#0d0a07;text-decoration:none;font-size:15px;font-weight:bold;border-radius:3px;">Continue Reading →</a>
            <p style="margin-top:40px;font-size:11px;color:#3a2e1e;">You're receiving this because you have an unfinished story on Unwritten. <a href="${process.env.APP_URL}/shelf.html" style="color:#7a6a58;">Go to your shelf</a> &nbsp;·&nbsp; <a href="${process.env.APP_URL}/api/unsubscribe?uid=${uid}" style="color:#3a2e1e;">Unsubscribe</a></p>
          </div>`,
      });
      await supabaseAdmin.from('profiles')
        .update({ last_reengagement_email_at: new Date().toISOString() })
        .eq('user_id', uid);
      sent++;
    } catch (_) {}
  }

  res.json({ sent });
});

// ─── GET /api/unsubscribe — one-click email unsubscribe (no auth required) ────
app.get('/api/unsubscribe', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).send('Missing uid');
  await supabaseAdmin.from('profiles').update({ email_unsubscribed: true }).eq('user_id', uid);
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Unsubscribed — Unwritten</title>
  <style>body{font-family:Georgia,serif;background:#0d0a07;color:#e8d5b0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
  .box{text-align:center;max-width:420px;padding:40px 24px;}
  h1{color:#c8a96e;font-size:24px;margin-bottom:12px;}
  p{color:#7a6a58;font-size:15px;line-height:1.7;margin-bottom:24px;}
  a{color:#c8a96e;font-size:13px;}</style></head>
  <body><div class="box">
    <h1>You've been unsubscribed</h1>
    <p>You won't receive any more re-engagement emails from Unwritten. Your stories and account are untouched.</p>
    <a href="${process.env.APP_URL}/shelf.html">Go to your shelf →</a>
  </div></body></html>`);
});

// ─── POST /api/library/borrow ─────────────────────────────────────────────────
app.post('/api/library/borrow', async (req, res) => {
  const { storyId } = req.body;
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (!storyId) return res.status(400).json({ error: 'Missing storyId' });

  const { data: existing } = await supabaseAdmin
    .from('library_borrows').select('id')
    .eq('user_id', user.id).eq('story_id', storyId).is('returned_at', null).maybeSingle();
  if (existing) return res.json({ success: true, alreadyBorrowed: true });

  const profile  = await getProfile(user.id);
  const maxSlots = profile.is_comped ? 999 : (profile.library_slots || 1);

  const { data: active } = await supabaseAdmin
    .from('library_borrows').select('id, story_id, borrowed_at')
    .eq('user_id', user.id).is('returned_at', null);

  if ((active?.length || 0) >= maxSlots) {
    const enriched = await Promise.all((active || []).map(async b => {
      const { data: s } = await supabaseAdmin.from('stories').select('data').eq('id', b.story_id).maybeSingle();
      const d = s?.data || {};
      return { ...b, bookTitle: d.bookTitle || d.config?.protagonistName || 'Untitled', genre: d.config?.genre || 'Fiction', coverImage: d.coverImage || null };
    }));
    return res.status(402).json({ error: 'Library slots full', slots: maxSlots, activeBorrows: enriched });
  }

  await supabaseAdmin.from('library_borrows').insert({ user_id: user.id, story_id: storyId });
  res.json({ success: true, alreadyBorrowed: false });
});

// ─── POST /api/library/return ─────────────────────────────────────────────────
app.post('/api/library/return', async (req, res) => {
  const { storyId } = req.body;
  const user = await getUserFromToken(req.headers.authorization);
  if (!user || !storyId) return res.status(401).json({ error: 'Unauthorized' });

  await supabaseAdmin.from('library_borrows')
    .update({ returned_at: new Date().toISOString() })
    .eq('user_id', user.id).eq('story_id', storyId).is('returned_at', null);

  await supabaseAdmin.from('reading_bookmarks')
    .delete().eq('user_id', user.id).eq('story_id', storyId);

  res.json({ success: true });
});

// ─── GET /api/library/card ─────────────────────────────────────────────────────
app.get('/api/library/card', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: borrows } = await supabaseAdmin
    .from('library_borrows').select('id, story_id, borrowed_at, returned_at')
    .eq('user_id', user.id).order('borrowed_at', { ascending: false }).limit(50);

  if (!borrows?.length) return res.json({ borrows: [] });

  const enriched = await Promise.all(borrows.map(async b => {
    const [sr, br] = await Promise.all([
      supabaseAdmin.from('stories').select('data').eq('id', b.story_id).maybeSingle(),
      supabaseAdmin.from('reading_bookmarks').select('chapter_idx').eq('user_id', user.id).eq('story_id', b.story_id).maybeSingle(),
    ]);
    const d = sr?.data?.data || {};
    return {
      ...b,
      bookTitle:     d.bookTitle || d.config?.protagonistName || 'Untitled',
      genre:         d.config?.genre || 'Fiction',
      coverImage:    d.coverImage || null,
      totalChapters: (d.progress?.chapters || []).length,
      chapterIdx:    br?.data?.chapter_idx ?? null,
    };
  }));

  const profile = await getProfile(user.id);
  res.json({ borrows: enriched, slots: profile.is_comped ? 999 : (profile.library_slots || 1) });
});

// ─── GET /api/library/active ───────────────────────────────────────────────────
app.get('/api/library/active', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: active } = await supabaseAdmin
    .from('library_borrows').select('id, story_id, borrowed_at')
    .eq('user_id', user.id).is('returned_at', null);

  if (!active?.length) return res.json({ borrows: [] });

  const enriched = await Promise.all(active.map(async b => {
    const [sr, br] = await Promise.all([
      supabaseAdmin.from('stories').select('data').eq('id', b.story_id).maybeSingle(),
      supabaseAdmin.from('reading_bookmarks').select('chapter_idx').eq('user_id', user.id).eq('story_id', b.story_id).maybeSingle(),
    ]);
    const d = sr?.data?.data || {};
    return {
      ...b,
      bookTitle:     d.bookTitle || d.config?.protagonistName || 'Untitled',
      genre:         d.config?.genre || 'Fiction',
      coverImage:    d.coverImage || null,
      totalChapters: (d.progress?.chapters || []).length,
      chapterIdx:    br?.data?.chapter_idx ?? null,
    };
  }));

  res.json({ borrows: enriched });
});

// ─── GET /api/gift-session-info — lightweight success-screen info ─────────────
app.get('/api/gift-session-info', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.metadata?.isGuestGift !== 'true') return res.status(403).json({ error: 'Not a gift session' });
    if (session.payment_status !== 'paid') return res.status(402).json({ error: 'Payment not complete' });
    res.json({ giftEmail: session.metadata.giftEmail, credits: parseInt(session.metadata.credits) || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/gift-checkout — guest gift purchase (no auth required) ────────
app.post('/api/gift-checkout', async (req, res) => {
  const { credits, giftEmail, giftFrom, giftMessage } = req.body;
  if (!giftEmail || !credits) return res.status(400).json({ error: 'Missing required fields' });
  const creditsNum = parseInt(credits);
  const giftTiers = { 1: 799, 3: 2000 };
  const amount = giftTiers[creditsNum];
  if (!amount) return res.status(400).json({ error: 'Invalid credit amount. Choose 1 or 3.' });
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Unwritten — ${creditsNum} Story Credit${creditsNum !== 1 ? 's' : ''} (Gift)` },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL}/gift.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.APP_URL}/gift.html`,
      metadata: {
        isGuestGift:  'true',
        credits:      String(creditsNum),
        giftEmail:    giftEmail.trim().toLowerCase(),
        giftFrom:     (giftFrom    || '').trim(),
        giftMessage:  (giftMessage || '').trim(),
      },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Gift checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/webhook — Stripe webhook (backup for missed redirects) ───────
// TODO: enable signature verification when STRIPE_WEBHOOK_SECRET is set in prod
app.post('/api/webhook', async (req, res) => {
  const event = req.body;
  if (event?.type === 'checkout.session.completed') {
    const session = event.data?.object;
    if (session) {
      const { data: existing } = await supabaseAdmin
        .from('processed_payments').select('id').eq('session_id', session.id).maybeSingle();
      if (!existing) {
        const { userId, credits, shareCredits, storiedCredits, librarySlots, isGuestGift, giftEmail, giftFrom, giftMessage } = session.metadata || {};

        if (isGuestGift === 'true') {
          // ── Guest gift — no Unwritten account required ───────────────────
          const creditsNum = parseInt(credits) || 0;
          if (creditsNum && giftEmail) {
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
            const recipient = (users || []).find(u => u.email?.toLowerCase() === giftEmail.toLowerCase());
            const fromName   = giftFrom || 'Someone special';
            const creditWord = creditsNum !== 1 ? 'credits' : 'credit';

            if (recipient) {
              await supabaseAdmin.rpc('add_credits', { p_user_id: recipient.id, p_credits: creditsNum });
              await supabaseAdmin.from('processed_payments').insert({ session_id: session.id, user_id: recipient.id, credits: creditsNum });
              await resend.emails.send({
                from: 'Unwritten <noreply@entertheunwritten.com>',
                to:   giftEmail,
                subject: `You've received ${creditsNum} Unwritten story ${creditWord}`,
                html: `
                  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0d0a07;color:#e8d5b0;">
                    <h1 style="font-size:26px;color:#c8a96e;margin-bottom:4px;">Unwritten</h1>
                    <p style="color:#7a6a58;font-size:13px;margin-bottom:36px;">A gift has been sent your way</p>
                    <h2 style="font-size:22px;color:#f0e8d0;margin-bottom:14px;">${creditsNum} Story ${creditsNum !== 1 ? 'Credits' : 'Credit'}</h2>
                    <p style="font-size:16px;line-height:1.75;color:#c0a880;margin-bottom:${giftMessage ? '20px' : '32px'};">
                      ${fromName} sent you ${creditsNum} story ${creditWord} on Unwritten — ${creditsNum === 1 ? 'it has' : "they've"} been added to your account. Log in anytime to start your story.
                    </p>
                    ${giftMessage ? `<blockquote style="margin:0 0 28px;padding:16px 20px;background:rgba(255,255,255,0.04);border-left:3px solid #c8a96e;border-radius:2px;font-style:italic;font-size:15px;color:#e8d5b0;line-height:1.7;">${giftMessage}</blockquote>` : ''}
                    <a href="${process.env.APP_URL}/shelf.html" style="display:inline-block;padding:13px 30px;background:#c8a96e;color:#0d0a07;text-decoration:none;font-size:15px;font-weight:bold;border-radius:3px;">Go to My Library →</a>
                  </div>`,
              }).catch(() => {});
            } else {
              const { data: gift } = await supabaseAdmin
                .from('pending_gift_credits')
                .insert({ from_user_id: null, to_email: giftEmail, credits: creditsNum, tier: 'gift' })
                .select().single();
              const claimUrl = `${process.env.APP_URL}/accept-gift.html?token=${gift.token}`;
              await supabaseAdmin.from('processed_payments').insert({ session_id: session.id, user_id: null, credits: creditsNum });
              await resend.emails.send({
                from: 'Unwritten <noreply@entertheunwritten.com>',
                to:   giftEmail,
                subject: `You've received ${creditsNum} Unwritten story ${creditWord}`,
                html: `
                  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0d0a07;color:#e8d5b0;">
                    <h1 style="font-size:26px;color:#c8a96e;margin-bottom:4px;">Unwritten</h1>
                    <p style="color:#7a6a58;font-size:13px;margin-bottom:36px;">A gift has been sent your way</p>
                    <h2 style="font-size:22px;color:#f0e8d0;margin-bottom:14px;">${creditsNum} Story ${creditsNum !== 1 ? 'Credits' : 'Credit'}</h2>
                    <p style="font-size:16px;line-height:1.75;color:#c0a880;margin-bottom:${giftMessage ? '20px' : '32px'};">
                      ${fromName} sent you ${creditsNum} story ${creditWord} on Unwritten — use ${creditsNum === 1 ? 'it' : 'them'} to generate your own AI-written novel, personalized to your characters and world.
                    </p>
                    ${giftMessage ? `<blockquote style="margin:0 0 28px;padding:16px 20px;background:rgba(255,255,255,0.04);border-left:3px solid #c8a96e;border-radius:2px;font-style:italic;font-size:15px;color:#e8d5b0;line-height:1.7;">${giftMessage}</blockquote>` : ''}
                    <a href="${claimUrl}" style="display:inline-block;padding:13px 30px;background:#c8a96e;color:#0d0a07;text-decoration:none;font-size:15px;font-weight:bold;border-radius:3px;">Claim Your Credits →</a>
                    <p style="margin-top:40px;font-size:12px;color:#3a2e1e;">This link can only be used once. Create a free account to claim it.</p>
                  </div>`,
              }).catch(() => {});
            }
          }
        } else if (userId && librarySlots) {
          await supabaseAdmin.rpc('add_library_slots', { p_user_id: userId, p_slots: parseInt(librarySlots) });
          await supabaseAdmin.from('processed_payments').insert({ session_id: session.id, user_id: userId, credits: 0 });
        } else if (userId && storiedCredits) {
          await supabaseAdmin.rpc('add_storied_credits', { p_user_id: userId, p_credits: parseInt(storiedCredits) });
          await supabaseAdmin.rpc('add_share_credits', { p_user_id: userId, p_credits: parseInt(storiedCredits) * 2 });
          await supabaseAdmin.from('profiles').update({ has_purchased: true }).eq('user_id', userId);
          await supabaseAdmin.from('processed_payments').insert({ session_id: session.id, user_id: userId, credits: 0 });
        } else if (userId && shareCredits) {
          await supabaseAdmin.rpc('add_share_credits', { p_user_id: userId, p_credits: parseInt(shareCredits) });
          await supabaseAdmin.from('processed_payments').insert({ session_id: session.id, user_id: userId, credits: 0 });
        } else if (userId && credits) {
          await supabaseAdmin.rpc('add_credits', { p_user_id: userId, p_credits: parseInt(credits) });
          await supabaseAdmin.from('profiles').update({ has_purchased: true }).eq('user_id', userId);
          await supabaseAdmin.from('processed_payments').insert({ session_id: session.id, user_id: userId, credits: parseInt(credits) });
        }
      }
    }
  }
  res.json({ received: true });
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);

const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Pricing ───────────────────────────────────────────────────────────────
const TIER_PRICING = {
  compact_single:  { amount: 699,  credits: 1, label: 'Compact Story — 1 credit (<25 chapters)' },
  compact_bundle:  { amount: 1500, credits: 3, label: 'Compact Bundle — 3 credits (<25 chapters each)' },
  standard_single: { amount: 799,  credits: 1, label: 'Standard Story — 1 credit (25–50 chapters)' },
  standard_bundle: { amount: 2000, credits: 3, label: 'Standard Bundle — 3 credits (25–50 chapters each)' },
};

const SHARE_PRICING = {
  share_3:  { amount: 500,  shareCredits: 3,  label: '3 Share Credits' },
  share_10: { amount: 1500, shareCredits: 10, label: '10 Share Credits' },
};

const STORIED_PRICING = {
  storied_1: { amount: 2999, storiedCredits: 1, label: 'Your Story — 1 personalized memoir' },
  storied_2: { amount: 4999, storiedCredits: 2, label: 'Your Story — 2 personalized memoirs' },
};

const ILLUSTRATED_PRICING = {
  compact:  { amount: 299, label: 'Illustrated Edition — Compact Story (<25 chapters)' },
  standard: { amount: 499, label: 'Illustrated Edition — Standard Story (25–50 chapters)' },
};

// ─── Auth helpers ──────────────────────────────────────────────────────────
async function getUserFromToken(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : user;
}

async function getProfile(userId) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('credits, is_comped, share_credits, storied_credits, library_slots, free_chapter_used, has_purchased, social_credits, referral_code')
    .eq('user_id', userId)
    .maybeSingle();
  return data || { credits: 0, is_comped: false, share_credits: 0, storied_credits: 0, library_slots: 1, free_chapter_used: false, has_purchased: false, social_credits: 0, referral_code: null };
}

async function ensureReferralCode(userId) {
  const code = Math.random().toString(36).slice(2, 6).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  await supabaseAdmin.from('profiles').update({ referral_code: code }).eq('user_id', userId).is('referral_code', null);
}

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
  const noDecisions  = config.noDecisions     || false;
  const language     = config.language        || 'English';

  const languageBlock = language !== 'English'
    ? `\n\nLANGUAGE: Write the ENTIRE story — every word of prose, dialogue, chapter titles, character names (unless user-specified), and all JSON string values — in ${language}. Do not use English anywhere in the narrative output.`
    : '';

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

  const isLightNovel = genre === 'Light Novel';

  const proseStyle = isRomance
    ? '- Lush, atmospheric, emotionally intense — slow-burn romance with real tension\n- Adult themes handled with literary weight. No purple prose.'
    : isTrueCrime
      ? '- Gripping, propulsive, journalistic with literary depth — the prose of a true crime book that keeps you reading at 2am\n- Alternate between the investigator\'s present-day search and vivid flashbacks to the victim\'s life\n- Each chapter should end with a revelation, a new suspect, or a detail that reframes everything before it\n- The victim must feel like a real person — not just a case file. Show who they were before they became a mystery.'
      : isLightNovel
        ? '- First-person narrator with a distinct inner voice — witty, self-aware, often remarking on the absurdity of their situation\n- Fast-paced chapters with sharp scene breaks. Every chapter ends on momentum — a new revelation, a level-up, an encounter\n- RPG/game-world logic must feel internally consistent: stats, skills, and system notifications should follow rules\n- Dialogue-heavy and expressive. Rivals and companions have strong, recognisable personalities\n- Balance action sequences with slice-of-life moments that build character bonds'
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
    'Light Novel':           'Bright azure-cerulean primary (#1a4a9a–#2a5ab0), deep midnight secondary (#04080e–#080c18), electric sky-blue accent (#40a8e8–#60c0f8). Particles: sparks.',
  };

  const paletteHint = moodPaletteGuide[genre] || 'Choose colors appropriate to the story\'s emotional tone and genre.';

  // ── Genre-specific decision craft guidance ───────────────────────────────
  const decisionGuides = {
    'Dark Romance':          `DECISION CRAFT: Every choice must exploit core dark romance tension — power dynamics, desire vs. self-preservation, pride vs. surrender. Never give the reader plot-logistics choices ("go left or right"). Give them charged, loaded moments: "Does she hold his gaze or look away first?" / "Tell him the truth or protect herself with a lie?" / "Stay in the room or leave while she still can?" Options should feel dangerous. The reader should feel the weight of both sides.`,
    'Fantasy Romance':       `DECISION CRAFT: Layer magical stakes onto emotional ones. Choices force the protagonist to weigh power or magic against the relationship, duty to her world against her heart. Examples: "Use the forbidden magic to save him or trust him to survive alone?" / "Reveal her true nature or keep the secret that protects them both?" Every option carries both a plot consequence and an emotional cost.`,
    'Contemporary Romance':  `DECISION CRAFT: Decisions are emotionally honest and grounded — vulnerability vs. self-protection, reaching out vs. pulling back, honesty vs. avoidance. Examples: "Call him back or let the silence answer for her?" / "Go to the event alone or ask for help?" Choices should feel like real decisions real people agonise over at 2am.`,
    'Paranormal Romance':    `DECISION CRAFT: Decisions sit at the edge of the supernatural and the deeply human — trust the inhuman love interest or fear what they are, embrace the paranormal world or cling to the ordinary one. Examples: "Let him feed or demand he keep his distance?" / "Cross into their world tonight or wait until she understands the cost?" Every choice carries existential weight.`,
    'Romantic Thriller':     `DECISION CRAFT: Every decision tightens the double tension — trust the love interest or suspect them, pursue the truth or protect the relationship, take the risk for love or for survival. Examples: "Tell him what she found or wait until she's certain?" / "Run with him or turn him in?" Options should feel like they could cost the protagonist everything — either way.`,
    'Historical Romance':    `DECISION CRAFT: Decisions are shaped by period constraints — reputation, duty, propriety — colliding with private desire. Examples: "Accept the chaperone's escort or find a reason to slip away?" / "Sign the contract her family needs or trust a man society says she shouldn't?" The weight of consequence in a world with fewer second chances.`,
    'Psychological Thriller':`DECISION CRAFT: Exploit unreliable reality — who to trust when you can't trust your own perception, whether to act on evidence that might be fabricated, confront or play along. Examples: "Confront him with what she found or pretend she doesn't know?" / "Tell the detective the truth or protect the secret that makes her look guilty?" Every choice feels like it could unravel everything.`,
    'Crime Thriller':        `DECISION CRAFT: Pivot on information asymmetry, risk calibration, and moral compromise. Examples: "Go to the police now or dig deeper first?" / "Use the evidence as leverage or hand it over clean?" / "Protect the witness or follow the lead that puts them at risk?" Choices should feel like procedural chess with real stakes.`,
    'Mystery':               `DECISION CRAFT: Decisions drive the investigation — which lead to follow, who to confront, what to reveal and to whom. Examples: "Question the butler or search the study first?" / "Share the discovery with the inspector or keep it close until she's sure?" The reader should feel the satisfaction of directing the detective's instincts.`,
    'True Crime':            `DECISION CRAFT: Mirror the real agonies of investigation — who to trust, what to publish, when silence protects and when it enables. Examples: "Publish the source's name or protect them and lose credibility?" / "Go to the family with the new evidence or wait until it's confirmed?" Choices carry moral weight, not just plot weight.`,
    'Whodunit':              `DECISION CRAFT: Decisions direct the case — who to press, what to search, when to reveal a suspicion. Examples: "Accuse the solicitor openly or set a trap and wait?" / "Search the east wing first or confront the groundskeeper before he disappears?" The reader should feel like the detective, choosing how to crack the case.`,
    'Suspense Thriller':     `DECISION CRAFT: Compress the protagonist's options and raise the temperature — act now on incomplete information or wait and risk being too late. Examples: "Trust the contact or assume the meet is compromised?" / "Use the exit she prepared or improvise a new one?" Every choice should feel like the clock is running.`,
    'Dark Fantasy':          `DECISION CRAFT: Decisions carry moral and magical cost — use the dark power or refuse and be weaker for it, make the morally grey choice or stay clean and pay for it. Examples: "Make the blood pact or face the enemy without it?" / "Spare the betrayer or make an example of them?" Options should never be clean — every choice has a price.`,
    'Epic Fantasy':          `DECISION CRAFT: Weigh individual against world — loyalty to a person vs. duty to a cause, use power now vs. preserve it for worse to come, sacrifice one to save many. Examples: "March on the fortress now or wait for the alliance that may not arrive?" / "Tell the company the truth about the prophecy or protect their hope a little longer?" Choices should feel historic.`,
    'Urban Fantasy':         `DECISION CRAFT: Decisions live at the collision of the mundane and the magical. Examples: "Call in a mundane favour or use the magic and owe a supernatural debt?" / "Expose the creature to the police or handle it in-world?" Choices should feel like navigating two different rule systems at once.`,
    'Science Fiction':       `DECISION CRAFT: Decisions carry philosophical and technological weight — individual freedom vs. collective safety, use the technology or refuse its cost. Examples: "Upload the data and risk exposure or destroy it and lose the only lead?" / "Accept the augmentation or stay human and vulnerable?" Choices should feel like they're about something larger than the plot.`,
    'Cyberpunk':             `DECISION CRAFT: Leverage, loyalty, and survival in a world where everything is for sale. Examples: "Sell the data to the corporation or burn it and go dark?" / "Trust the fixer or run the job alone?" Every option should carry the weight of a world where the wrong choice gets you killed — or owned.`,
    'Dystopian':             `DECISION CRAFT: Force the protagonist to choose between survival and conscience — comply to stay safe or resist and put others at risk. Examples: "Report the violation or look away and protect her family?" / "Take the offered safety or refuse and stay with those who have nothing?" Choices should feel like they cost the protagonist a piece of who they are.`,
    'Supernatural Horror':   `DECISION CRAFT: Survival calculus wrapped in dread — flee or investigate, warn others or protect them from the truth, trust the uncanny or fight it. Examples: "Go back into the house or leave and abandon what's inside?" / "Tell the others what she saw or keep them ignorant and hope?" Options should feel like there's no good answer — only less bad ones.`,
    'Psychological Horror':  `DECISION CRAFT: Exploit the protagonist's uncertain grip on reality — trust their perception or question it, act on what they believe they saw or wait for proof that may never come. Examples: "Confront him with what she remembers or say nothing until she's certain?" / "Leave before it gets worse or stay and find out if she's right?" Every choice should feel like a coin toss in the dark.`,
    'Historical Fiction':    `DECISION CRAFT: Shaped by the specific constraints of the period — what was possible, what was permitted, what the cost of deviation actually was. Examples: "Sign the document under his name or refuse and lose the position entirely?" / "Speak at the assembly or let the moment pass?" Choices should feel historically authentic, not modern.`,
    'Adventure':             `DECISION CRAFT: Drive momentum — which path, which risk, when to push and when to regroup. Examples: "Take the mountain pass now or wait out the storm and lose the lead?" / "Bluff their way through the checkpoint or find another route?" Options should feel energetic — readers want to steer the action.`,
    'Light Novel':           `DECISION CRAFT: Give decisions the energy of genre fiction — skills, alliances, social stakes as much as combat. Examples: "Challenge the guild leader now or grind for one more level first?" / "Side with Ren or stay neutral and see how it plays out?" Choices should feel like RPG branch points — satisfying to pick, curious to see play out.`,
  };

  const decisionBlock = !noDecisions && decisionGuides[genre]
    ? `\n\n${decisionGuides[genre]}`
    : '';

  return `You are narrating an original ${genre} novel — ${chapters} chapters total.
${languageBlock}
${charactersBlock}

THEMES & SETTING: ${themes}
${ideaBlock}

PROSE STYLE (literary bestseller quality):
- Third-person limited POV, following the protagonist
${proseStyle}
- Sensory and cinematic: long sentences that breathe, short ones that cut
- Every word earns its place. No filler. No clichés.
- Chapter length: 1000–1400 words of prose
${avoidBlock}${sequelBlock}${seriesBlock}${namesBlock}

GENRE PALETTE for this story (use these exact colors for primaryColor in mood JSON, shifting hue and lightness per chapter emotional beat): ${paletteHint}${decisionBlock}${noDecisions ? `

STORY TYPE: LINEAR — this story has no reader choices. Always return an empty decisions array ([]). Do NOT write choice-soliciting cliffhangers, "what should she do?" prompts, or any language inviting the reader to decide. End each chapter as a standard novel chapter — a scene close, a revelation, or forward narrative momentum.` : ''}`;
}

// ─── Static rules — shared across all stories, caches globally ────────────────
const STATIC_RULES = `CONTINUITY MANDATE — before writing each chapter:
- Read the Story Bible in full. Every fact in it is CANON and cannot change.
- Never alter an established location (if someone died in Martintown, they died in Martintown — forever).
- Never alter an established time reference (if the investigation is 3 weeks old, it stays 3 weeks old — unless the new chapter explicitly advances time and the bible is updated accordingly).
- Never resurrect a dead character, move a crime scene, or change who the suspects are without plot reason.
- If in doubt, match the bible exactly.

CHARACTER DEVELOPMENT — characters must grow and change as the story moves forward:
- Track time passing. If a character is introduced at age 7 and two years pass in the story, they are now 9 — reference them accordingly.
- Let story events reshape characters visibly. Trauma, love, loss, and survival leave marks — in how they carry themselves, how they speak, what they notice, what they avoid.
- Physical details can evolve: a character who goes through hardship might cut their hair, dress differently, carry new tension in their body. Show the change, don't announce it.
- Emotional arc must be consistent: a character who was guarded should not suddenly be open without a reason earned on the page. Show the before, show the shift, show the after.
- When referencing a character at a later point in time, always check the bible for their current state — never write them as they were in Chapter 1 if they have changed.

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
  "primaryColor": "#hexcode — draw from the GENRE PALETTE specified in your story configuration. Shift the exact hue and lightness to match THIS chapter's beat. Tense chapters go darker and more saturated. Quiet chapters go slightly lighter or more muted. Never the same shade twice in a row.",
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
CRITICAL: For INTERACTIVE stories (the default), you MUST always return exactly one decision object with a prompt and 3 options — never an empty array, never omit this block, even if the chapter ends on a cliffhanger or a moment of no apparent choice. If the chapter ends mid-action, the decision shapes what happens next. There is always a next move.
For LINEAR stories configured with no reader choices: always return an empty decisions array — <decisions>[]</decisions>

<scene>One sentence capturing the most visually striking moment of this chapter — written as a painting brief: setting, light source, key figures, dominant emotion. Purely visual. No abstract concepts, no text in the image. Under 40 words. Omit for linear stories.</scene>

<bible>
STORY BIBLE — update after every chapter. Be specific. This is the continuity record.

ESTABLISHED FACTS (never change these):
- Locations: list every named place where key events occurred (crime scenes, deaths, meetings)
- Time: exact elapsed time since story began, and any specific durations mentioned
- Character fates: who is alive, dead, missing, arrested — and where it happened
- Key revelations: evidence found, secrets exposed, identities confirmed

CHARACTER STATES (update every chapter — this is how they are RIGHT NOW):
- For each named character: current age (adjust as story time passes), current physical state/appearance (note any changes from how they started), current emotional/psychological state, and what has changed them since the story began
- Example: "Maya — now 9 (was 7 at start, 2 years have passed). Hair cut short after the fire. Quieter than she was. Doesn't talk about her mother anymore."

CURRENT STATE:
- Where protagonist is and what they know
- Active suspects and their status
- Open threads / unresolved mysteries

(No word limit — be as detailed as needed. Present tense. Specifics over summaries — write "victim found in Martintown, 3 weeks ago" not "a crime was discovered". Every named place, every stated time, every character fate and current character state must be recorded here so future chapters never contradict them.)
</bible>

IMPORTANT: All blocks required (except <booktitle> after Chapter 1). JSON must be valid. No commentary outside these blocks after the prose.`;

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

  let decisions = [{ prompt: 'What happens next?', options: ['Press forward', 'Tread carefully', 'Take a different path'] }];

  if (moodRaw) {
    try { mood = JSON.parse(moodRaw); } catch (_) {}
  }
  let decisionsFallback = false;
  if (decisionsRaw) {
    try {
      const parsed = JSON.parse(decisionsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) decisions = parsed;
      else decisionsFallback = true;
    } catch (_) { decisionsFallback = true; }
  } else {
    decisionsFallback = true;
  }

  const scene = extract('scene') || null;

  return { chapterText, bookTitle: bookTitleRaw, title: titleRaw, mood, decisions, bible: bibleRaw, decisionsFallback, scene };
}

// ─── API: Start (Chapter 1) ────────────────────────────────────────────────
app.post('/api/start', async (req, res) => {
  const { storyConfig } = req.body;

  // Auth + credit check
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const profile = await getProfile(user.id);
  let isTrial = false;

  if (!profile.is_comped) {
    if (profile.credits < 1) {
      // Allow one free trial chapter if they haven't used it yet
      if (!profile.free_chapter_used) {
        await supabaseAdmin.from('profiles').update({ free_chapter_used: true }).eq('user_id', user.id);
        isTrial = true;
      } else {
        return res.status(402).json({ error: 'No credits', code: 'NO_CREDITS' });
      }
    } else {
      const { data: ok } = await supabaseAdmin.rpc('deduct_credit', { p_user_id: user.id });
      if (!ok) return res.status(402).json({ error: 'No credits', code: 'NO_CREDITS' });
    }
  }

  const systemPrompt = storyConfig ? buildSystemPrompt(storyConfig) : EMBERS_PROMPT;

  const openingInstruction = storyConfig
    ? `Generate Chapter 1. This is the very beginning. Establish the protagonist's ordinary world before everything changes. Introduce ${storyConfig.protagonistName || 'the protagonist'} and hint at the world they're about to enter. End at a moment of disruption — something that makes turning back impossible. Make it atmospheric and compelling. For the <booktitle>: craft a thrilling, evocative title specific to this story's world — the kind that makes someone stop and reach for the book. Think "Embers of the Ashen Court" or "A Court of Thorns and Roses" — vivid, specific, impossible to ignore. Never use "[Name]'s Story" or generic phrasing.`
    : `Generate Chapter 1. This is the very beginning. Introduce Lyra in her ordinary world — late at night in her master's cartography workshop — the first moment she sees a death-thread. The shock. The wrongness of it. End at the moment everything changes: the arrival of something that will pull her toward the Ashen Court. Make it ominous and beautiful. Include the <booktitle> block.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3200,
      system: [
        { type: 'text', text: STATIC_RULES, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: openingInstruction }],
    });

    const parsed = parseResponse(response.content[0].text);
    if (parsed.decisionsFallback && !storyConfig?.noDecisions) {
      console.warn(`[decisions_fallback] user=${user.id} chapter=1 genre=${storyConfig?.genre}`);
      supabaseAdmin.from('ai_warnings').insert({ type: 'decisions_fallback', user_id: user.id, metadata: { chapter: 1, genre: storyConfig?.genre || null } }).catch(() => {});
    }
    let chapterImageUrl = null;
    if (storyConfig?.illustrated && parsed.scene) {
      chapterImageUrl = await generateChapterImage(parsed.scene, parsed.title, storyConfig.genre, 1);
    }
    res.json({ success: true, ...parsed, chapterNumber: 1, isTrial, chapterImageUrl });
  } catch (err) {
    console.error('Error generating chapter 1:', err.message);
    if (!profile.is_comped) {
      if (isTrial) {
        // Reset trial flag so they can try again
        await supabaseAdmin.from('profiles').update({ free_chapter_used: false }).eq('user_id', user.id).catch(() => {});
      } else {
        await supabaseAdmin.rpc('add_credits', { p_user_id: user.id, p_credits: 1 }).catch(() => {});
      }
    }
    res.status(500).json({ error: 'Generation failed — please try again.', refunded: !isTrial });
  }
});

// ─── API: Next chapter ─────────────────────────────────────────────────────
app.post('/api/chapter', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { storyBible, decision, chapterNumber, storyConfig, isFinalChapter } = req.body;
  const systemPrompt = storyConfig ? buildSystemPrompt(storyConfig) : EMBERS_PROMPT;
  const protagonist  = storyConfig?.protagonistName || 'the protagonist';
  const loveInterest = storyConfig?.loveInterestName || 'the love interest';
  const targetChapters = storyConfig?.targetChapters || 20;
  const isFinal = isFinalChapter || chapterNumber >= targetChapters;
  const chaptersRemaining = targetChapters - chapterNumber;

  // Arc phase: how close are we to the end?
  const arcPhase = isFinal ? 'final'
    : chaptersRemaining <= 3  ? 'resolving'
    : chaptersRemaining <= 8  ? 'climax'
    : 'building';

  const isSeries = storyConfig?.isSeries || false;

  const arcInstruction = {
    building:  `Generate Chapter ${chapterNumber} of ${targetChapters}. The reader's choice must carry real weight — let it shape where ${protagonist} ends up, what they discover, how ${loveInterest} responds. Continue building the slow-burn tension. This chapter should feel like a consequence of that choice.`,
    climax:    `Generate Chapter ${chapterNumber} of ${targetChapters}. The story is entering its final act — ${chaptersRemaining} chapters remain. Escalate meaningfully: raise the stakes, force ${protagonist} into harder choices, bring the central conflict into sharp focus. Start pulling the major threads together. The reader should feel the story accelerating toward its end.`,
    resolving: isSeries
      ? `Generate Chapter ${chapterNumber} of ${targetChapters}. Only ${chaptersRemaining} chapters remain. Begin landing the central conflict of THIS book — the core arc between ${protagonist} and the forces driving this story must reach its breaking point. However, this is Book 1 of a series: be deliberate about which threads you close and which you leave breathing. Secondary mysteries, the wider world, and deeper relationship questions should remain alive — not forgotten, but unresolved in a way that feels intentional rather than incomplete.`
      : `Generate Chapter ${chapterNumber} of ${targetChapters}. Only ${chaptersRemaining} chapters remain. Begin landing the story — major threads should be moving toward resolution. The core conflict between ${protagonist} and the forces opposing them must reach a breaking point. Leave room for the final chapter to close things out, but this chapter should feel like the last pieces falling into place.`,
    final: isSeries
      ? `Generate Chapter ${chapterNumber} — THE FINAL CHAPTER of Book 1. Resolve the central conflict of this book and give ${protagonist} and ${loveInterest} a genuinely satisfying emotional landing — the reader must feel this story is complete. BUT: this is a series. Do not close off the world. Leave at least one meaningful thread unresolved — a new threat on the horizon, a secret not fully uncovered, a relationship with more to say. The last lines should feel like an ending and a beginning. Do NOT include decisions. Return an empty decisions array.`
      : `Generate Chapter ${chapterNumber} — THE FINAL CHAPTER. This is the ending. Resolve all major threads. Give ${protagonist} and ${loveInterest} a satisfying, emotionally resonant conclusion shaped by the reader's choices. Write with finality and weight. Do NOT include any decisions or choices — the story ends here. Return an empty decisions array.`,
  }[arcPhase];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3200,
      system: [
        { type: 'text', text: STATIC_RULES, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `STORY BIBLE (current state — this is CANON, do not contradict it):\n${storyBible}`, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `\n\nREADER'S DECISION: "${decision}"\n\nBefore writing: verify every location, time reference, and character fate in the bible above. This chapter must be consistent with all of them.\n\n${arcInstruction}` },
        ],
      }],
    });

    const parsed = parseResponse(response.content[0].text);
    if (parsed.decisionsFallback && !storyConfig?.noDecisions) {
      console.warn(`[decisions_fallback] user=${user.id} chapter=${chapterNumber} genre=${storyConfig?.genre}`);
      supabaseAdmin.from('ai_warnings').insert({ type: 'decisions_fallback', user_id: user.id, metadata: { chapter: chapterNumber, genre: storyConfig?.genre || null } }).catch(() => {});
    }
    let chapterImageUrl = null;
    if (storyConfig?.illustrated && parsed.scene) {
      chapterImageUrl = await generateChapterImage(parsed.scene, parsed.title, storyConfig.genre, chapterNumber);
    }
    res.json({ success: true, ...parsed, chapterNumber, chapterImageUrl });
  } catch (err) {
    console.error(`Error generating chapter ${chapterNumber}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Generate spine SVG ──────────────────────────────────────────────
app.post('/api/generate-spine', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

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

  const summaryPrompt = `Write a 2-3 sentence back-cover blurb for this novel.
Genre: ${genre || 'Fiction'}. Title: "${safeTitle}". Protagonist: ${protagonistName || 'the protagonist'}. Love interest: ${loveInterestName || 'the love interest'}. Themes: ${themeStr}.${storyIdea ? ` Premise: ${storyIdea.slice(0, 200)}` : ''}

Write in third person, present tense. Hook the reader with the core conflict and emotional stakes. No spoilers. Do NOT mention the title. Return ONLY the blurb text — no labels, no quotes, no explanation.`;

  try {
    const [spineResponse, summaryResponse] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
      anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: summaryPrompt }],
      }),
    ]);

    let svg = spineResponse.content[0].text.trim()
      .replace(/^```(?:svg|xml)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim();

    const summary = summaryResponse.content[0].text.trim();

    if (!svg.startsWith('<svg')) return res.status(422).json({ error: 'Invalid SVG' });
    res.json({ success: true, svg, summary });
  } catch (err) {
    console.error('Spine generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Generate cover image ────────────────────────────────────────────
app.post('/api/generate-cover', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { storyId, bookTitle, genre, premise, themes, protagonistName, loveInterestName } = req.body;
  if (!storyId || !bookTitle) return res.status(400).json({ error: 'Missing storyId or bookTitle' });

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(503).json({ error: 'Image generation not configured' });

  const themeStr   = (themes || []).slice(0, 3).join(', ') || genre || 'fiction';
  const charNote   = protagonistName   ? ` Protagonist: ${protagonistName}.`   : '';
  const liNote     = loveInterestName  ? ` Love interest: ${loveInterestName}.` : '';
  const premNote   = premise           ? ` Premise: ${premise.slice(0, 150)}.`  : '';

  const prompt = `Book cover art for a ${genre || 'fiction'} novel titled "${bookTitle}".${premNote}${charNote}${liNote} Themes: ${themeStr}. Painterly illustration style, dramatic cinematic lighting, rich atmospheric colors, highly detailed, evocative mood. No text, no title, no words, no letters anywhere in the image.`;

  try {
    const imgResp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1024x1536', quality: 'medium' }),
    });

    if (!imgResp.ok) {
      console.error('Cover image API error:', imgResp.status, await imgResp.text());
      return res.status(502).json({ error: 'Image generation failed' });
    }

    const imgData = await imgResp.json();
    const b64 = imgData.data?.[0]?.b64_json;
    if (!b64) return res.status(502).json({ error: 'No image returned' });

    const imageBytes = Buffer.from(b64, 'base64');
    const filename   = `covers/${storyId}.png`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('book-covers')
      .upload(filename, imageBytes, { contentType: 'image/png', upsert: true });

    let coverUrl;
    if (uploadErr) {
      coverUrl = `data:image/png;base64,${b64}`;
    } else {
      const { data: pub } = supabaseAdmin.storage.from('book-covers').getPublicUrl(filename);
      coverUrl = pub.publicUrl;
    }

    await supabaseAdmin.from('stories').update({ cover_url: coverUrl }).eq('id', storyId).eq('user_id', user.id);
    res.json({ success: true, coverUrl });
  } catch (err) {
    console.error('Cover generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Chapter image generation helper ──────────────────────────────────────
async function generateChapterImage(scene, title, genre, chapterNum) {
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY || !scene) return null;
  const prompt = `Chapter illustration for a ${genre || 'fiction'} novel. Chapter: "${title}". Scene: ${scene}. Painterly illustration style, cinematic lighting, atmospheric, highly detailed. No text, no words, no title visible in the image.`;
  try {
    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'gpt-image-1', prompt, n: 1, size: '1536x1024', quality: 'medium' }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return null;
    const imageBytes = Buffer.from(b64, 'base64');
    const filename = `chapters/${crypto.randomUUID()}.png`;
    const { error } = await supabaseAdmin.storage.from('book-covers').upload(filename, imageBytes, { contentType: 'image/png', upsert: false });
    if (error) return null;
    const { data: pub } = supabaseAdmin.storage.from('book-covers').getPublicUrl(filename);
    return pub.publicUrl;
  } catch (e) {
    console.error('Chapter image failed:', e.message);
    return null;
  }
}

// ─── API: Retroactive illustration (completed stories) ────────────────────
app.post('/api/illustrate-story', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { storyId } = req.body;
  if (!storyId) return res.status(400).json({ error: 'Missing storyId' });

  const { data: story } = await supabaseAdmin.from('stories').select('data').eq('id', storyId).eq('user_id', user.id).single();
  if (!story) return res.status(404).json({ error: 'Story not found' });

  const chapters = story.data?.progress?.chapters || [];
  const titles   = story.data?.progress?.titles   || [];
  const genre    = story.data?.config?.genre || 'fiction';

  if (chapters.length === 0) return res.status(400).json({ error: 'No chapters to illustrate' });

  // Generate scene summaries + images for each chapter via Claude then OpenAI
  const chapterImages = [];
  for (let i = 0; i < chapters.length; i++) {
    const chapterText = chapters[i];
    const title = titles[i] || `Chapter ${i + 1}`;
    // Ask Claude for a brief scene description from the existing chapter text
    try {
      const sceneResp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{ role: 'user', content: `In one sentence (max 35 words), describe the most visually striking scene from this chapter as a painting brief — setting, light, key figures, dominant emotion. No abstract concepts, purely visual.\n\nChapter title: ${title}\n\n${chapterText.slice(0, 800)}` }],
      });
      const scene = sceneResp.content[0].text.trim();
      const imageUrl = await generateChapterImage(scene, title, genre, i + 1);
      chapterImages.push(imageUrl || null);
    } catch (_) {
      chapterImages.push(null);
    }
  }

  // Update story with chapter images and illustrated flag
  const updatedData = {
    ...story.data,
    illustrated: true,
    chapterImages,
  };
  await supabaseAdmin.from('stories').update({ data: updatedData, updated_at: new Date().toISOString() }).eq('id', storyId);

  const count = chapterImages.filter(Boolean).length;
  res.json({ success: true, chapterImages, count });
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
app.post('/api/storied/queue', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Login required to generate Your Story.' });

  const profile = await getProfile(user.id);
  if (!profile.is_comped) {
    const { data: deducted } = await supabaseAdmin.rpc('deduct_storied_credit', { p_user_id: user.id });
    if (!deducted) return res.status(402).json({ error: 'No Your Story credits.', needsCredits: true });
  }

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

// ─── Share a finished book ────────────────────────────────────────────────
app.post('/api/share', async (req, res) => {
  const { storyId, toEmail, authToken } = req.body;
  if (!storyId || !toEmail || !authToken) return res.status(400).json({ error: 'Missing fields' });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(authToken);
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: story, error: storyErr } = await supabaseAdmin
    .from('stories').select('*').eq('id', storyId).eq('user_id', user.id).single();
  if (storyErr || !story) return res.status(404).json({ error: 'Story not found' });

  const chapter = story.data?.progress?.chapter || 0;
  const target  = story.data?.config?.targetChapters || 20;
  if (chapter < target) return res.status(400).json({ error: 'Book is not finished yet' });

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const recipient = (users || []).find(u => u.email === toEmail);

  if (recipient) {
    // Comped users share for free; others spend 1 share credit
    const profile = await getProfile(user.id);
    if (!profile.is_comped) {
      const { data: deducted } = await supabaseAdmin.rpc('deduct_share_credit', { p_user_id: user.id });
      if (!deducted) return res.status(402).json({ error: 'No share credits remaining.', needsCredits: true });
    }

    const { error: insertErr } = await supabaseAdmin.from('stories').insert({
      id: crypto.randomUUID(), user_id: recipient.id,
      data: story.data, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    });
    if (insertErr) return res.status(500).json({ error: 'Failed to share' });
    return res.json({ success: true, existing: true });
  }

  const { data: pending, error: pendingErr } = await supabaseAdmin
    .from('pending_shares')
    .insert({ story_id: storyId, from_user_id: user.id, to_email: toEmail })
    .select().single();
  if (pendingErr) return res.status(500).json({ error: 'Failed to create share' });

  const bookTitle = story.data?.bookTitle || 'a book';
  const appUrl    = process.env.APP_URL || 'http://localhost:3001';
  const acceptUrl = `${appUrl}/accept-share.html?token=${pending.token}`;

  await resend.emails.send({
    from: 'Unwritten <noreply@entertheunwritten.com>',
    to:   toEmail,
    subject: `"${bookTitle}" has been shared with you`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#0d0a07;color:#e8d5b0;">
        <h1 style="font-size:26px;color:#c8a96e;margin-bottom:4px;">Unwritten</h1>
        <p style="color:#7a6a58;font-size:13px;margin-bottom:36px;">A story has been shared with you</p>
        <h2 style="font-size:22px;color:#f0e8d0;margin-bottom:14px;">"${bookTitle}"</h2>
        <p style="font-size:16px;line-height:1.75;color:#c0a880;margin-bottom:32px;">
          Someone thought you'd love this story. Create a free account to claim it and start reading.
        </p>
        <a href="${acceptUrl}" style="display:inline-block;padding:13px 30px;background:#c8a96e;color:#0d0a07;text-decoration:none;font-size:15px;font-weight:bold;border-radius:3px;">
          Claim Your Book →
        </a>
        <p style="margin-top:40px;font-size:12px;color:#3a2e1e;">This link can only be used once. If you didn't expect this, you can ignore it.</p>
      </div>`,
  });

  return res.json({ success: true, existing: false });
});

app.post('/api/accept-share', async (req, res) => {
  const { token, authToken } = req.body;
  if (!token || !authToken) return res.status(400).json({ error: 'Missing fields' });

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(authToken);
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: pending, error: pendingErr } = await supabaseAdmin
    .from('pending_shares').select('*').eq('token', token).is('accepted_at', null).single();
  if (pendingErr || !pending) return res.status(404).json({ error: 'Share link not found or already used' });

  const { data: story, error: storyErr } = await supabaseAdmin
    .from('stories').select('*').eq('id', pending.story_id).single();
  if (storyErr || !story) return res.status(404).json({ error: 'Original story no longer exists' });

  const { error: insertErr } = await supabaseAdmin.from('stories').insert({
    id: crypto.randomUUID(), user_id: user.id,
    data: story.data, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (insertErr) return res.status(500).json({ error: 'Failed to claim book' });

  await supabaseAdmin.from('pending_shares').update({ accepted_at: new Date().toISOString() }).eq('token', token);
  return res.json({ success: true, bookTitle: story.data?.bookTitle || 'Your book' });
});

// ─── GET /api/export-pdf/:storyId ─────────────────────────────────────────
app.get('/api/export-pdf/:storyId', async (req, res) => {
  const user = await getUserFromToken(req.headers.authorization);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: story } = await supabaseAdmin
    .from('stories').select('*').eq('id', req.params.storyId).eq('user_id', user.id).maybeSingle();
  if (!story) return res.status(404).json({ error: 'Story not found' });

  const d        = story.data || {};
  const chapters = d.progress?.chapters || [];
  const titles   = d.progress?.titles   || [];
  const decisions= d.progress?.decisions|| [];
  const bookTitle= d.bookTitle || d.config?.bookTitleInput || 'Untitled';
  const genre    = d.config?.genre || '';

  const chaptersHtml = chapters.map((text, i) => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
      .map(p => `<p>${p.trim().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('');
    const decisionNote = decisions[i]
      ? `<div class="decision-divider"><span class="decision-text">You chose: ${decisions[i]}</span></div>` : '';
    return `<div class="chapter ${i > 0 ? 'page-break' : ''}">
      <div class="chapter-num">Chapter ${i + 1}</div>
      <h2 class="chapter-title">${titles[i] || ''}</h2>
      <div class="chapter-body">${paragraphs}</div>
      ${decisionNote}</div>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,700;1,400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'EB Garamond',Georgia,serif;font-size:12.5pt;line-height:1.85;color:#1a0d05;background:#faf6f0}
.title-page{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;page-break-after:always;background:#0d0505;color:#d4a574;text-align:center;padding:4rem}
.title-page h1{font-family:'Playfair Display',serif;font-size:38pt;font-style:italic;line-height:1.1;margin-bottom:1rem}
.title-page .genre{font-size:10pt;letter-spacing:.25em;text-transform:uppercase;opacity:.4;margin-bottom:3rem}
.chapter{page-break-before:always;padding:1em 0 2em}
.chapter-num{font-size:9pt;letter-spacing:.35em;text-transform:uppercase;opacity:.4;margin-bottom:.75rem;text-align:center}
.chapter-title{font-family:'Playfair Display',serif;font-size:20pt;font-style:italic;font-weight:700;text-align:center;color:#2d0a0a;margin-bottom:2.5rem}
.chapter-body p{margin-bottom:1.1em;text-indent:2em}
.chapter-body p:first-child{text-indent:0}
.decision-divider{margin-top:2.5rem;text-align:center;padding:1rem 0;border-top:1px solid rgba(139,69,19,.2);border-bottom:1px solid rgba(139,69,19,.2)}
.decision-text{font-style:italic;font-size:10pt;color:#5a2d0a;opacity:.75;letter-spacing:.05em}
</style></head><body>
<div class="title-page"><h1>${bookTitle}</h1><p class="genre">${genre} · Unwritten</p></div>
${chaptersHtml}</body></html>`;

  try {
    const requireFrom = createRequire('file:///C:/Users/super/AppData/Local/Temp/puppeteer-test/');
    const puppeteer = requireFrom('puppeteer');
    const browser = await puppeteer.launch({
      executablePath: 'C:/Users/super/.cache/puppeteer/chrome/win64-147.0.7727.56/chrome-win64/chrome.exe',
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A5', margin: { top:'1cm', bottom:'1cm', left:'1.5cm', right:'1.5cm' }, printBackground: true });
    await browser.close();

    const safeName = bookTitle.replace(/[^a-zA-Z0-9 \-]/g, '').trim();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
    res.send(pdf);
  } catch (err) {
    console.error('PDF export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── 404 handler ───────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).sendFile(path.join(__dirname, '404.html')));

// ─── Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Unwritten`);
  console.log(`  Running at http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
