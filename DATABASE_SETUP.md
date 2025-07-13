# Database Setup for Enhanced BetTask System

## Required Tables

### 1. Update task_submissions table
```sql
-- Add new columns to existing task_submissions table
ALTER TABLE task_submissions 
ADD COLUMN image_metadata JSONB,
ADD COLUMN verification_status TEXT DEFAULT 'pending',
ADD COLUMN verified_at TIMESTAMPTZ,
ADD COLUMN metadata_attempts INTEGER DEFAULT 0,
ADD COLUMN ai_attempts INTEGER DEFAULT 0,
ADD COLUMN image_url TEXT;

-- Update existing records to have proper verification status
UPDATE task_submissions 
SET verification_status = CASE 
  WHEN verified = true THEN 'approved'
  WHEN verified = false THEN 'failed'
  ELSE 'pending'
END;
```

### 2. Create wallets table
```sql
-- Create wallets table for user balance management
CREATE TABLE wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. Create transactions table
```sql
-- Create transactions table for tracking all financial movements
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'deduction', 'refund')),
  description TEXT,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_challenge_id ON transactions(challenge_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 4. Update challenges table (if needed)
```sql
-- Ensure challenges table has proper constraints
ALTER TABLE challenges 
ALTER COLUMN status SET DEFAULT 'active';

-- Add check constraint for status values
ALTER TABLE challenges 
ADD CONSTRAINT check_challenge_status 
CHECK (status IN ('active', 'completed', 'failed', 'pending_verification'));
```

### 5. Create updated RLS policies for task_submissions
```sql
-- Update RLS policies for task_submissions to handle new columns
DROP POLICY IF EXISTS "Users can view own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can insert own submissions" ON task_submissions;
DROP POLICY IF EXISTS "Users can update own submissions" ON task_submissions;

CREATE POLICY "Users can view own submissions" ON task_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions" ON task_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON task_submissions
  FOR UPDATE USING (auth.uid() = user_id);
```

## Environment Setup

### 1. Create a `.env.local` file in your project root:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Get your Gemini API key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env.local` file

### 3. Set up Supabase Storage Bucket:
```sql
-- Create a storage bucket for challenge proof images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('challenge-proofs', 'challenge-proofs', true);

-- Create storage policies
CREATE POLICY "Users can upload their own proof images" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'challenge-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own proof images" ON storage.objects 
FOR SELECT USING (
  bucket_id = 'challenge-proofs' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view proof images" ON storage.objects 
FOR SELECT USING (bucket_id = 'challenge-proofs');
```

## Testing the Setup

### 1. Test wallet creation:
```sql
-- This should automatically create a wallet when a user first accesses the app
SELECT * FROM wallets WHERE user_id = auth.uid();
```

### 2. Test transaction recording:
```sql
-- Check transaction history
SELECT * FROM transactions WHERE user_id = auth.uid() ORDER BY created_at DESC;
```

### 3. Test verification system:
```sql
-- Check submission statuses
SELECT 
  ts.*, 
  c.title as challenge_title 
FROM task_submissions ts 
JOIN challenges c ON ts.challenge_id = c.id 
WHERE ts.user_id = auth.uid();
```

## Notes

- The wallet system automatically creates a wallet for new users
- All financial transactions are logged in the transactions table
- The verification system supports multiple statuses: pending, approved, failed, manual_review
- Image metadata is stored as JSONB for flexible verification data
- All tables have proper RLS policies for security 