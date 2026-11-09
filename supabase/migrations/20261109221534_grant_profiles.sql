-- Explicit table permissions for logged-in users.
-- The cloud project has "Automatically expose new tables" turned off, so nothing is granted by default.
-- Grants say WHAT the role may do; the RLS policies on the table say WHICH ROWS (only the user's own).
-- No DELETE: a profile is removed together with the auth user (ON DELETE CASCADE).
GRANT USAGE ON SCHEMA public TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
