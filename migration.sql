-- Run this in Supabase Dashboard → SQL Editor

-- ── Profiles table (credits + comped flag) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits    INTEGER NOT NULL DEFAULT 0,
  is_comped  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- ── Processed payments (prevents double-crediting) ────────────────────────
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id    UUID REFERENCES auth.users(id),
  credits    INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;
-- No user read policy — server-only via service key

-- ── add_credits RPC (called by server after payment) ─────────────────────
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_credits INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, credits)
  VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE
    SET credits    = public.profiles.credits + p_credits,
        updated_at = now();
END;
$$;

-- ── deduct_credit RPC (atomic — returns false if no credits) ──────────────
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id UUID)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL OR current_credits < 1 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET credits    = credits - 1,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN true;
END;
$$;
