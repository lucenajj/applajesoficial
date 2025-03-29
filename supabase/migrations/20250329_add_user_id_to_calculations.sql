-- Add user_id column to calculations table
ALTER TABLE calculations
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add an index to improve query performance
CREATE INDEX idx_calculations_user_id ON calculations(user_id);

-- Update existing records to link with a default user if needed
-- You may want to adjust this based on your needs
-- UPDATE calculations SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL; 