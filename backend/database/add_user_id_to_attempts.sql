-- Add user_id column to question_attempts for faster agent queries
-- This is denormalized but makes performance analysis much faster

ALTER TABLE question_attempts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill existing data (if any)
UPDATE question_attempts qa
SET user_id = gs.user_id
FROM game_sessions gs
WHERE qa.session_id = gs.id
AND qa.user_id IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE question_attempts 
ALTER COLUMN user_id SET NOT NULL;

-- Add index for agent performance queries
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_topic ON question_attempts(user_id, topic);

-- Update RLS policy to use direct user_id
DROP POLICY IF EXISTS "Users can view their own question attempts" ON question_attempts;
CREATE POLICY "Users can view their own question attempts"
  ON question_attempts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own question attempts" ON question_attempts;
CREATE POLICY "Users can insert their own question attempts"
  ON question_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

