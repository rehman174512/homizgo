DO $$
BEGIN
  -- 1. Create Rajesh (Landlord)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rajesh@example.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at, 
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'rajesh@example.com',
      crypt('password123', gen_salt('bf')),
      current_timestamp,
      current_timestamp,
      current_timestamp,
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Rajesh Kumar","role":"landlord"}',
      current_timestamp,
      current_timestamp,
      '',
      '',
      '',
      ''
    );
  END IF;

  -- 2. Create Amit (PG Owner)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'amit@example.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'amit@example.com',
      crypt('password123', gen_salt('bf')),
      current_timestamp,
      current_timestamp,
      current_timestamp,
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Amit Singh","role":"pgowner"}',
      current_timestamp,
      current_timestamp,
      '',
      '',
      '',
      ''
    );
  END IF;
  -- 3. Create Student Demo
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@example.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'student@example.com',
      crypt('password123', gen_salt('bf')),
      current_timestamp,
      current_timestamp,
      current_timestamp,
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Student Demo","role":"user"}',
      current_timestamp,
      current_timestamp,
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;
