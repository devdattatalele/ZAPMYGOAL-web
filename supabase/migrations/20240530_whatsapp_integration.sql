-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  bet_amount NUMERIC NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Task submissions table
CREATE TABLE IF NOT EXISTS public.task_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  proof_url TEXT NOT NULL,
  ai_verified BOOLEAN DEFAULT false,
  ai_verdict TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can only access their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Challenges: Users can only access their own challenges
CREATE POLICY "Users can CRUD own challenges"
  ON public.challenges FOR ALL
  USING (auth.uid() = user_id);

-- Task submissions: Users can only access submissions for their own challenges
CREATE POLICY "Users can CRUD own task submissions"
  ON public.task_submissions FOR ALL
  USING (
    challenge_id IN (
      SELECT id FROM public.challenges WHERE user_id = auth.uid()
    )
  );

-- Reminders: Users can only access their own reminders
CREATE POLICY "Users can CRUD own reminders"
  ON public.reminders FOR ALL
  USING (user_id = auth.uid());

-- Service role bypass for WhatsApp server functions
-- Note: This ensures WhatsApp webhooks can access all data with the service role
CREATE POLICY "Service role has full access to profiles"
  ON public.profiles FOR ALL
  USING (true);

CREATE POLICY "Service role has full access to challenges"
  ON public.challenges FOR ALL
  USING (true);

CREATE POLICY "Service role has full access to task submissions"
  ON public.task_submissions FOR ALL
  USING (true);

CREATE POLICY "Service role has full access to reminders"
  ON public.reminders FOR ALL
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS challenges_user_id_idx ON public.challenges(user_id);
CREATE INDEX IF NOT EXISTS task_submissions_challenge_id_idx ON public.task_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_challenge_id_idx ON public.reminders(challenge_id);
CREATE INDEX IF NOT EXISTS reminders_remind_at_sent_idx ON public.reminders(remind_at) WHERE NOT sent; 