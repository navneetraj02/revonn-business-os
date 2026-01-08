-- Create RPC function to handle staff login securely by bypassing RLS
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
  v_owner_profile RECORD;
  v_staff RECORD;
BEGIN
  -- 1. Find the owner's profile based on the provided store phone
  SELECT user_id, shop_name 
  INTO v_owner_profile
  FROM profiles
  WHERE phone = p_store_phone
  LIMIT 1;

  IF v_owner_profile IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid store phone number');
  END IF;

  -- 2. Find the staff member belonging to this owner with the given username
  SELECT * 
  INTO v_staff
  FROM staff
  WHERE user_id = v_owner_profile.user_id 
    AND username = p_username
  LIMIT 1;

  IF v_staff IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;

  -- 3. Verify password hash
  IF v_staff.password_hash IS DISTINCT FROM p_password_hash THEN
    RETURN json_build_object('success', false, 'error', 'Invalid username or password');
  END IF;

  -- 4. Check if account is active
  IF v_staff.is_active IS FALSE THEN
    RETURN json_build_object('success', false, 'error', 'Your account is inactive. Contact the owner.');
  END IF;

  -- 5. Update last login time
  UPDATE staff
  SET last_login = now()
  WHERE id = v_staff.id;

  -- 6. Return success with staff details
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'id', v_staff.id,
      'name', v_staff.name,
      'username', v_staff.username,
      'user_id', v_staff.user_id,
      'shop_name', v_owner_profile.shop_name,
      'permissions', v_staff.permissions
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_login TO anon, authenticated;