-- Create a SECURITY DEFINER function for staff login
-- This bypasses RLS and securely validates staff credentials by store phone

CREATE OR REPLACE FUNCTION public.staff_login(
  p_store_phone TEXT,
  p_username TEXT,
  p_password_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_staff RECORD;
  v_shop_name TEXT;
BEGIN
  -- Step 1: Find the owner (user) by phone number from profiles
  SELECT p.user_id, p.shop_name INTO v_owner_id, v_shop_name
  FROM profiles p
  WHERE p.phone = p_store_phone
  LIMIT 1;

  IF v_owner_id IS NULL THEN
    -- Try matching via the email pattern (phone@revonn.app)
    SELECT au.id INTO v_owner_id
    FROM auth.users au
    WHERE au.email = p_store_phone || '@revonn.app'
    LIMIT 1;
    
    IF v_owner_id IS NOT NULL THEN
      SELECT p.shop_name INTO v_shop_name FROM profiles p WHERE p.user_id = v_owner_id;
    END IF;
  END IF;

  IF v_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Store not found with this phone number');
  END IF;

  -- Step 2: Find staff by username and owner_id
  SELECT s.* INTO v_staff
  FROM staff s
  WHERE s.user_id = v_owner_id
    AND LOWER(s.username) = LOWER(p_username)
    AND s.is_active = true
  LIMIT 1;

  IF v_staff IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Staff not found or inactive');
  END IF;

  -- Step 3: Verify password
  IF v_staff.password_hash IS NULL OR v_staff.password_hash != p_password_hash THEN
    RETURN json_build_object('success', false, 'error', 'Invalid password');
  END IF;

  -- Step 4: Update last login
  UPDATE staff SET last_login = now() WHERE id = v_staff.id;

  -- Step 5: Return success with staff data
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', v_staff.id,
      'name', v_staff.name,
      'username', v_staff.username,
      'user_id', v_staff.user_id,
      'role', v_staff.role,
      'permissions', v_staff.permissions,
      'shop_name', COALESCE(v_shop_name, 'Store')
    )
  );
END;
$$;