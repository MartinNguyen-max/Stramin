-- Favorite workouts (owner feedback 2026-11-15): logged-in users may read, add and remove them.
-- Grants say WHAT the role may do; the RLS policies say WHICH ROWS (only the user's own).
GRANT SELECT, INSERT, DELETE ON TABLE public.favorite_workouts TO authenticated;
