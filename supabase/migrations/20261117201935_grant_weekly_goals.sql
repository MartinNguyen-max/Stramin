-- Weekly goals (owner feedback 2026-11-17): logged-in users may read, create, change and remove theirs.
-- Grants say WHAT the role may do; the RLS policies say WHICH ROWS (only the user's own).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.weekly_goals TO authenticated;
