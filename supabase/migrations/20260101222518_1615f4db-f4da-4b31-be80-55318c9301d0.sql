-- Add staff credentials columns for staff login
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"billing": true, "inventory": false, "customers": false, "reports": false, "settings": false}'::jsonb,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create index for username lookup
CREATE INDEX IF NOT EXISTS idx_staff_username ON public.staff(username);

-- Update RLS to allow staff to view their own record by username
CREATE POLICY "Staff can view own record by username" 
ON public.staff 
FOR SELECT 
USING (username IS NOT NULL);
