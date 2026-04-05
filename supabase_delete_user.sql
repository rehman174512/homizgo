-- Run this in your Supabase SQL Editor to allow users to delete their own accounts
-- This creates an RPC (Remote Procedure Call) that the client can trigger to bypass the Admin constraint for their own account.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Deletes the user from auth.users (which cascades to public.users if foreign keys are set up correctly)
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

-- Note: Ensure that `auth.users` has a cascading delete to `public.users`, 
-- or delete the `public.users` row from the client immediately before calling this RPC (which the code currently does).
