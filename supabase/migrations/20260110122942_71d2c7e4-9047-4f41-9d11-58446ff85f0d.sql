-- Fix staff_login function to properly find owner by email pattern
CREATE OR REPLACE FUNCTION public.staff_login(
  p_store_phone text, 
  p_username text, 
  p_password_hash text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id UUID;
  v_staff RECORD;
  v_shop_name TEXT;
BEGIN
  -- Try matching via email pattern (phone@revonn.app) in auth.users
  SELECT au.id INTO v_owner_id
  FROM auth.users au
  WHERE au.email = p_store_phone || '@revonn.app'
  LIMIT 1;
  
  IF v_owner_id IS NOT NULL THEN
    SELECT p.shop_name INTO v_shop_name FROM profiles p WHERE p.user_id = v_owner_id;
  ELSE
    -- Fallback: Check profiles.phone
    SELECT p.user_id, p.shop_name INTO v_owner_id, v_shop_name
    FROM profiles p
    WHERE p.phone = p_store_phone
    LIMIT 1;
  END IF;

  IF v_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Store not found with this phone number');
  END IF;

  -- Find staff by username and owner_id
  SELECT s.* INTO v_staff
  FROM staff s
  WHERE s.user_id = v_owner_id
    AND LOWER(s.username) = LOWER(p_username)
    AND s.is_active = true
  LIMIT 1;

  IF v_staff IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Staff not found or inactive');
  END IF;

  -- Verify password
  IF v_staff.password_hash IS NULL OR v_staff.password_hash != p_password_hash THEN
    RETURN json_build_object('success', false, 'error', 'Invalid password');
  END IF;

  -- Update last login
  UPDATE staff SET last_login = now() WHERE id = v_staff.id;

  -- Return success
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