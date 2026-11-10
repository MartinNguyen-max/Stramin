-- Table permissions for logged-in users (see 20261109221534_grant_profiles.sql for why grants are explicit).
-- Grants say WHAT the role may do; the RLS policies on each table say WHICH ROWS (only the user's own).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goals TO authenticated;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.personal_bests TO authenticated;
--> statement-breakpoint

-- Event background images (EVT-2): a private bucket, max 5 MB, images only.
-- Files live at "{user_id}/{uuid}.webp"; the browser uploads them after resizing.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('event-images', 'event-images', false, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- A user can only read, add, change and delete files in their own folder.
CREATE POLICY "event_images_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "event_images_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "event_images_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (select auth.uid())::text);
--> statement-breakpoint
CREATE POLICY "event_images_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = (select auth.uid())::text);
