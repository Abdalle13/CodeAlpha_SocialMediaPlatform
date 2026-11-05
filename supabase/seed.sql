-- Veyra Social Media Realistic Seed Data
-- Creates an admin account (admin@gmail.com), 6 creator profiles, posts, photos, follows, likes, and comments.
-- Idempotent: can be executed multiple times safely in Supabase SQL Editor.

DO $$
DECLARE
  v_admin_id uuid;
  v_u0 uuid := 'a0000000-0000-0000-0000-000000000000'; -- admin@gmail.com
  v_u1 uuid := 'a1111111-1111-1111-1111-111111111111';
  v_u2 uuid := 'a2222222-2222-2222-2222-222222222222';
  v_u3 uuid := 'a3333333-3333-3333-3333-333333333333';
  v_u4 uuid := 'a4444444-4444-4444-4444-444444444444';
  v_u5 uuid := 'a5555555-5555-5555-5555-555555555555';
  v_u6 uuid := 'a6666666-6666-6666-6666-666666666666';

  v_p1 uuid := 'b1111111-1111-1111-1111-111111111111';
  v_p2 uuid := 'b2222222-2222-2222-2222-222222222222';
  v_p3 uuid := 'b3333333-3333-3333-3333-333333333333';
  v_p4 uuid := 'b4444444-4444-4444-4444-444444444444';
  v_p5 uuid := 'b5555555-5555-5555-5555-555555555555';
  v_p6 uuid := 'b6666666-6666-6666-6666-666666666666';
  v_p7 uuid := 'b7777777-7777-7777-7777-777777777777';
  v_p8 uuid := 'b8888888-8888-8888-8888-888888888888';
  v_p9 uuid := 'b9999999-9999-9999-9999-999999999999';
  v_p10 uuid := 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

  r record;
BEGIN
  -- Look up custom main account if already registered
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'cabdale13yare@gmail.com' LIMIT 1;

  -- 1. Insert Seed Users into auth.users (password: Admin123! for admin, Password123! for creators)
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES
    (v_u0, 'authenticated', 'authenticated', 'admin@gmail.com', crypt('Admin123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"admin","display_name":"System Administrator"}', now() - interval '20 days', now()),
    (v_u1, 'authenticated', 'authenticated', 'layla@veyra.social', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"layla_studio","display_name":"Layla Hassan"}', now() - interval '14 days', now()),
    (v_u2, 'authenticated', 'authenticated', 'zayd@veyra.social', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"zayd_visuals","display_name":"Zayd Warsame"}', now() - interval '12 days', now()),
    (v_u3, 'authenticated', 'authenticated', 'hana@veyra.social', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"hana_culinary","display_name":"Hana Osman"}', now() - interval '10 days', now()),
    (v_u4, 'authenticated', 'authenticated', 'tariq@veyra.social', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"tariq_tech","display_name":"Tariq Ahmed"}', now() - interval '8 days', now()),
    (v_u5, 'authenticated', 'authenticated', 'amina@veyra.social', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"amina_wander","display_name":"Amina Duale"}', now() - interval '7 days', now()),
    (v_u6, 'authenticated', 'authenticated', 'khalid@veyra.social', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"username":"khalid_fit","display_name":"Khalid Farah"}', now() - interval '5 days', now())
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = coalesce(auth.users.email_confirmed_at, now());

  -- 2. Update Profiles with high-res avatars, bios, and websites
  INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, website, role)
  VALUES
    (v_u0, 'admin', 'System Administrator', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', 'Official Veyra Platform Administrator & Safety Team.', 'https://veyra.social', 'admin'),
    (v_u1, 'layla_studio', 'Layla Hassan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'Architectural photographer & creative director. Capturing quiet geometric light.', 'https://laylahassan.co', 'user'),
    (v_u2, 'zayd_visuals', 'Zayd Warsame', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'Documentary & street photographer. Walking the world with a 35mm lens.', 'https://zaydvisuals.com', 'user'),
    (v_u3, 'hana_culinary', 'Hana Osman', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80', 'Pastry chef & food stylist. Celebrating fresh citrus, cardamoms, and coastal breakfast recipes.', 'https://hanaskitchen.com', 'user'),
    (v_u4, 'tariq_tech', 'Tariq Ahmed', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 'Building software & AI interfaces. Minimalist setups, specialty coffee, and open web.', 'https://tariq.dev', 'user'),
    (v_u5, 'amina_wander', 'Amina Duale', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80', 'Travel writer & ocean lover. Collecting sunsets and coastal stories.', 'https://aminaduale.com', 'user'),
    (v_u6, 'khalid_fit', 'Khalid Farah', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80', 'Holistic health coach & morning runner. Movement is medicine.', 'https://khalidfarah.fit', 'user')
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    website = EXCLUDED.website,
    role = EXCLUDED.role;

  -- 3. Register admin accounts into admin_users
  INSERT INTO public.admin_users (user_id) VALUES (v_u0) ON CONFLICT (user_id) DO NOTHING;
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.admin_users (user_id) VALUES (v_admin_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.profiles SET role = 'admin' WHERE id = v_admin_id;
  END IF;

  -- 4. Follow Graph: Seed users follow each other, and all follow admin
  INSERT INTO public.follows (follower_id, following_id) VALUES
    (v_u1, v_u0), (v_u2, v_u0), (v_u3, v_u0), (v_u4, v_u0), (v_u5, v_u0), (v_u6, v_u0),
    (v_u0, v_u1), (v_u0, v_u2), (v_u0, v_u3),
    (v_u1, v_u2), (v_u1, v_u3), (v_u1, v_u4), (v_u1, v_u5),
    (v_u2, v_u1), (v_u2, v_u3), (v_u2, v_u6),
    (v_u3, v_u1), (v_u3, v_u5), (v_u3, v_u6),
    (v_u4, v_u1), (v_u4, v_u2), (v_u4, v_u5),
    (v_u5, v_u1), (v_u5, v_u2), (v_u5, v_u3), (v_u5, v_u6),
    (v_u6, v_u1), (v_u6, v_u2), (v_u6, v_u3), (v_u6, v_u4)
  ON CONFLICT (follower_id, following_id) DO NOTHING;

  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.follows (follower_id, following_id) VALUES
      (v_u1, v_admin_id),
      (v_u2, v_admin_id),
      (v_u3, v_admin_id),
      (v_u4, v_admin_id),
      (v_u5, v_admin_id),
      (v_u6, v_admin_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  END IF;

  -- 5. Realistic Posts
  INSERT INTO public.posts (id, author_id, caption, visibility, status, created_at) VALUES
    (v_p1, v_u3, 'Morning golden ginger & ripe banana smoothie with fresh lime zest. The freshest start to a productive week! What is in your morning cup?', 'public', 'active', now() - interval '6 hours'),
    (v_p2, v_u1, 'Warm afternoon light falling across concrete and glass. Finding symmetry in modern city angles.', 'public', 'active', now() - interval '18 hours'),
    (v_p3, v_u2, 'Golden hour in the coastal market. Streets alive with movement, aromas, and stories.', 'public', 'active', now() - interval '1 day'),
    (v_p4, v_u4, 'Clean workspace, fresh brew, and deep focus mode. Ready to ship the next feature release.', 'public', 'active', now() - interval '2 days'),
    (v_p5, v_u5, 'Quiet morning by the ocean shores. Watching the turquoise tides roll in never gets old.', 'public', 'active', now() - interval '3 days'),
    (v_p6, v_u6, 'Sunrise 10km run done. Fresh air and positive discipline sets the tone for everything.', 'public', 'active', now() - interval '3 days'),
    (v_p7, v_u3, 'Freshly harvested tropical fruits and citrus bowl. Nature provides the best colors and flavors.', 'public', 'active', now() - interval '4 days'),
    (v_p8, v_u1, 'Serenity in interior spaces. Minimal materials, warm wood, and natural indirect daylight.', 'public', 'active', now() - interval '5 days'),
    (v_p9, v_u5, 'High up on the mountain ridge before dawn. Cold mountain breeze and boundless horizons.', 'public', 'active', now() - interval '6 days'),
    (v_p10, v_u2, 'Night rhythm. Rain reflections, neon signage, and the hum of city life after dark.', 'public', 'active', now() - interval '7 days')
  ON CONFLICT (id) DO NOTHING;

  -- 6. Post Media (High-Resolution Photography with explicit IDs and file_ids)
  INSERT INTO public.post_media (id, post_id, url, file_id, position) VALUES
    ('c1111111-1111-1111-1111-111111111111', v_p1, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=1080&q=80', 'seed_media_1', 0),
    ('c2222222-2222-2222-2222-222222222222', v_p2, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1080&q=80', 'seed_media_2', 0),
    ('c3333333-3333-3333-3333-333333333333', v_p3, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1080&q=80', 'seed_media_3', 0),
    ('c4444444-4444-4444-4444-444444444444', v_p4, 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1080&q=80', 'seed_media_4', 0),
    ('c5555555-5555-5555-5555-555555555555', v_p5, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80', 'seed_media_5', 0),
    ('c6666666-6666-6666-6666-666666666666', v_p6, 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1080&q=80', 'seed_media_6', 0),
    ('c7777777-7777-7777-7777-777777777777', v_p7, 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1080&q=80', 'seed_media_7', 0),
    ('c8888888-8888-8888-8888-888888888888', v_p8, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1080&q=80', 'seed_media_8', 0),
    ('c9999999-9999-9999-9999-999999999999', v_p9, 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1080&q=80', 'seed_media_9', 0),
    ('caaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_p10, 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1080&q=80', 'seed_media_10', 0)
  ON CONFLICT (id) DO NOTHING;

  -- 7. Likes on Posts
  INSERT INTO public.likes (post_id, user_id) VALUES
    (v_p1, v_u1), (v_p1, v_u2), (v_p1, v_u5), (v_p1, v_u6),
    (v_p2, v_u2), (v_p2, v_u3), (v_p2, v_u4),
    (v_p3, v_u1), (v_p3, v_u4), (v_p3, v_u5), (v_p3, v_u6),
    (v_p4, v_u1), (v_p4, v_u2), (v_p4, v_u6),
    (v_p5, v_u1), (v_p5, v_u3), (v_p5, v_u4), (v_p5, v_u6),
    (v_p6, v_u2), (v_p6, v_u4), (v_p6, v_u5),
    (v_p7, v_u1), (v_p7, v_u2), (v_p7, v_u5),
    (v_p8, v_u3), (v_p8, v_u4), (v_p8, v_u5),
    (v_p9, v_u1), (v_p9, v_u2), (v_p9, v_u3), (v_p9, v_u6),
    (v_p10, v_u1), (v_p10, v_u4), (v_p10, v_u5)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  -- 8. Comments on Posts (with explicit IDs)
  INSERT INTO public.comments (id, post_id, author_id, body) VALUES
    ('d1111111-1111-1111-1111-111111111111', v_p1, v_u1, 'That color is stunning! Fresh lime zest makes all the difference.'),
    ('d2222222-2222-2222-2222-222222222222', v_p1, v_u5, 'Saving this recipe for tomorrow morning, looks super refreshing!'),
    ('d3333333-3333-3333-3333-333333333333', v_p2, v_u4, 'Love the brutalist lines here. What lens did you shoot this with?'),
    ('d4444444-4444-4444-4444-444444444444', v_p2, v_u2, 'Shadow play is perfection Layla!'),
    ('d5555555-5555-5555-5555-555555555555', v_p3, v_u1, 'The warmth in this frame is pure magic Zayd.'),
    ('d6666666-6666-6666-6666-666666666666', v_p3, v_u5, 'Brings back so many fond memories of evening markets.'),
    ('d7777777-7777-7777-7777-777777777777', v_p4, v_u2, 'Clean desk setup! Wishing you high velocity on the release.'),
    ('d8888888-8888-8888-8888-888888888888', v_p5, v_u3, 'Take me there! That water is crystal clear.'),
    ('d9999999-9999-9999-9999-999999999999', v_p6, v_u4, 'Consistency over everything! Keep crushing it Khalid.'),
    ('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_p7, v_u1, 'Nature really is the greatest palette.'),
    ('dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', v_p9, v_u2, 'The scale of those mountain peaks is breathtaking.')
  ON CONFLICT (id) DO NOTHING;

  -- 9. Notifications for Admin (admin@gmail.com)
  INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id, created_at) VALUES
    (v_u0, v_u1, 'follow', 'profile', v_u1, now() - interval '2 hours'),
    (v_u0, v_u2, 'follow', 'profile', v_u2, now() - interval '5 hours'),
    (v_u0, v_u3, 'follow', 'profile', v_u3, now() - interval '1 day'),
    (v_u0, v_u5, 'follow', 'profile', v_u5, now() - interval '2 days');

  -- Also notify custom admin account if present
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, target_type, target_id, created_at) VALUES
      (v_admin_id, v_u1, 'follow', 'profile', v_u1, now() - interval '2 hours'),
      (v_admin_id, v_u2, 'follow', 'profile', v_u2, now() - interval '5 hours'),
      (v_admin_id, v_u3, 'follow', 'profile', v_u3, now() - interval '1 day'),
      (v_admin_id, v_u5, 'follow', 'profile', v_u5, now() - interval '2 days');
  END IF;

END $$;
