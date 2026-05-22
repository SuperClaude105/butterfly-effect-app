// Supabase client — shared across all dungeon pages
// Import via: <script src="supabase-client.js"></script>
// Then use the global `sbClient`, `requireAuth()`, `getUser()`, `signOut()`

const SUPABASE_URL = 'https://puywhvrgixlhijxzircy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1eXdodnJnaXhsaGlqeHppcmN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NTI2MTAsImV4cCI6MjA5MjIyODYxMH0.mLxhLr5FY7QpEgmWf9z4BAA_lie-XqMOMSiKZFu7YrQ';

// Load Supabase from CDN if not already present
(function ensureSupabaseLoaded(callback) {
  if (window.supabase && window.supabase.createClient) {
    callback();
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = callback;
  document.head.appendChild(s);
})(function () {
  window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
});

// Returns the current session user, or null if not logged in
async function getUser() {
  const { data: { user } } = await window.sbClient.auth.getUser();
  return user;
}

// Redirects to auth.html if user is not logged in
// Call at the top of any protected page: await requireAuth();
async function requireAuth(redirectTo = 'auth.html') {
  const user = await getUser();
  if (!user) {
    const current = encodeURIComponent(window.location.href);
    window.location.href = `${redirectTo}?next=${current}`;
    // Pause execution so the page doesn't continue rendering
    await new Promise(() => {});
  }
  return user;
}

// Signs out and redirects to auth.html
async function signOut() {
  await window.sbClient.auth.signOut();
  window.location.href = 'auth.html';
}

// Generates a random 6-character uppercase session code (e.g. "FX8K2Q")
function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
