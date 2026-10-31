import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';
import { config } from '../src/config/env.js';

const app = createApp();

const supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const userClient = (token) => {
  return createClient(config.supabase.url, process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_a4F9dc4cAMtjGHwQxw1Tow_JcyVM3Vc', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
};

async function runStage1Verification() {
  console.log('=== VEYRA STAGE 1: LIVE SECURITY & RLS VERIFICATION ===\n');

  // Verify migration 00003 schema presence first
  const { error: probeError } = await supabaseAdmin
    .from('comments')
    .select('id, parent_id')
    .limit(1);

  if (probeError && probeError.message.includes('parent_id does not exist')) {
    console.error('❌ MIGRATION PENDING: Migration 00003 has not been applied to Supabase yet.');
    console.error('Please run supabase/migrations/00003_phase4_social_features.sql in the Supabase SQL Editor first.\n');
    process.exitCode = 1;
    return;
  }

  const timestamp = Date.now();
  const emailA = `test_st1_a_${timestamp}@veyratest.internal`;
  const emailB = `test_st1_b_${timestamp}@veyratest.internal`;
  const password = `TestPass123!_${timestamp}`;
  const usernameA = `st1_a_${timestamp.toString().slice(-6)}`;
  const usernameB = `st1_b_${timestamp.toString().slice(-6)}`;

  console.log('1. Creating test accounts (User A & User B)...');
  const { data: uA, error: errA } = await supabaseAdmin.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
    user_metadata: { username: usernameA, display_name: 'Stage 1 User A' },
  });
  if (errA) throw new Error(`User A creation failed: ${errA.message}`);

  const { data: uB, error: errB } = await supabaseAdmin.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
    user_metadata: { username: usernameB, display_name: 'Stage 1 User B' },
  });
  if (errB) throw new Error(`User B creation failed: ${errB.message}`);

  const authClient = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  const { data: sessA } = await authClient.auth.signInWithPassword({ email: emailA, password });
  const { data: sessB } = await authClient.auth.signInWithPassword({ email: emailB, password });

  const tokenA = sessA.session.access_token;
  const tokenB = sessB.session.access_token;
  const clientA = userClient(tokenA);
  const clientB = userClient(tokenB);

  console.log('   ✓ Test users created & authenticated.');

  try {
    // 2. Post Media Attachment Ownership (Requirement 4)
    console.log('\n2. Testing Post Media Attachment Ownership (Requirement 4)...');
    
    // User A creates public post
    const { data: postA, error: pErrA } = await clientA
      .from('posts')
      .insert({ caption: 'User A public post', visibility: 'public', author_id: uA.user.id })
      .select()
      .single();
    if (pErrA) throw new Error(`User A post creation failed: ${pErrA.message}`);
    console.log('   ✓ User A created public post (ID:', postA.id, ')');

    // User B tries to attach media to User A's post (Must FAIL)
    const { error: attachBError } = await clientB
      .from('post_media')
      .insert({
        post_id: postA.id,
        url: 'https://ik.imagekit.io/veyra/malicious.png',
        file_id: 'fake_malicious_file_id',
      });

    if (!attachBError) {
      throw new Error('SECURITY VIOLATION: User B was able to attach media to User A\'s post!');
    }
    console.log('   ✓ Security verified: User B blocked from attaching media to User A\'s post (RLS check violation).');

    // User A uploads real image to ImageKit for their post
    const samplePngBuffer = Buffer.from(
      '89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63600000000200014E944A950000000049454E44AE426082',
      'hex'
    );
    const authRes = await request(app)
      .post('/api/media/imagekit-auth')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    const { token: ikToken, expire: ikExpire, signature: ikSig, publicKey: ikPubKey } = authRes.body;
    const formData = new FormData();
    formData.append('file', new Blob([samplePngBuffer], { type: 'image/png' }), `post_${timestamp}.png`);
    formData.append('fileName', `post_${timestamp}.png`);
    formData.append('publicKey', ikPubKey);
    formData.append('signature', ikSig);
    formData.append('expire', ikExpire);
    formData.append('token', ikToken);
    formData.append('folder', '/veyra/posts');
    formData.append('useUniqueFileName', 'true');

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadJson = await uploadRes.json();
    const testFileId = uploadJson.fileId;
    const testUrl = uploadJson.url;

    // User A attaches media to their own post (Must SUCCEED)
    const { data: mediaA, error: attachAError } = await clientA
      .from('post_media')
      .insert({
        post_id: postA.id,
        url: testUrl,
        file_id: testFileId,
      })
      .select()
      .single();
    if (attachAError) throw new Error(`User A media attachment failed: ${attachAError.message}`);
    console.log('   ✓ User A successfully attached media to own post (File ID:', mediaA.file_id, ')');

    // 3. Post Media SELECT: Public vs Followers vs Block (Requirements 1 & 2)
    console.log('\n3. Testing Post Media Visibility & Block Isolation (Requirements 1 & 2)...');

    // User B can view media on User A's public post
    const { data: mediaForB1 } = await clientB
      .from('post_media')
      .select('*')
      .eq('post_id', postA.id);
    if (!mediaForB1 || mediaForB1.length !== 1) {
      throw new Error('User B should be able to view media on accessible public post');
    }
    console.log('   ✓ User B can view media on accessible public post.');

    // User A blocks User B
    console.log('   Blocking User B...');
    const { error: blockErr } = await clientA
      .from('blocks')
      .insert({ blocker_id: uA.user.id, blocked_id: uB.user.id });
    if (blockErr) throw new Error(`Block failed: ${blockErr.message}`);

    // User B attempts to view media on User A's post after block (Must return 0 rows)
    const { data: mediaForBBlocked } = await clientB
      .from('post_media')
      .select('*')
      .eq('post_id', postA.id);
    if (mediaForBBlocked && mediaForBBlocked.length > 0) {
      throw new Error('SECURITY VIOLATION: Blocked User B was able to view User A\'s post media!');
    }
    console.log('   ✓ Block isolation verified: Blocked user receives 0 rows when querying post_media.');

    // Unblock for next tests
    await clientA.from('blocks').delete().eq('blocker_id', uA.user.id).eq('blocked_id', uB.user.id);

    // User A creates a followers-only post with media
    const { data: postFollowers, error: pFollowErr } = await clientA
      .from('posts')
      .insert({ caption: 'User A followers only', visibility: 'followers', author_id: uA.user.id })
      .select()
      .single();
    if (pFollowErr) throw new Error(`Followers post creation failed: ${pFollowErr.message}`);

    const followersMediaId = `file_foll_${timestamp}`;
    await clientA.from('post_media').insert({
      post_id: postFollowers.id,
      url: 'https://ik.imagekit.io/veyra/followers_only.png',
      file_id: followersMediaId,
    });

    // User B (not following) queries followers-only post media (Must return 0 rows)
    const { data: mediaForNonFollower } = await clientB
      .from('post_media')
      .select('*')
      .eq('post_id', postFollowers.id);
    if (mediaForNonFollower && mediaForNonFollower.length > 0) {
      throw new Error('SECURITY VIOLATION: Non-follower was able to view followers-only post media!');
    }
    console.log('   ✓ Followers-only protection verified: Non-follower receives 0 rows.');

    // User B follows User A
    console.log('   User B follows User A...');
    await clientB.from('follows').insert({ follower_id: uB.user.id, following_id: uA.user.id });

    // User B queries followers-only post media (Must SUCCEED)
    const { data: mediaForFollower } = await clientB
      .from('post_media')
      .select('*')
      .eq('post_id', postFollowers.id);
    if (!mediaForFollower || mediaForFollower.length !== 1) {
      throw new Error('Follower should be able to view followers-only post media');
    }
    console.log('   ✓ Follower access verified: Follower successfully viewed followers-only post media.');

    // 4. Comment Replies & Cross-Post Injection Prevention (Requirement 3)
    console.log('\n4. Testing Comment Replies & Cross-Post Prevention (Requirement 3)...');

    // User B comments on User A's public post
    const { data: rootComment, error: rcErr } = await clientB
      .from('comments')
      .insert({ post_id: postA.id, author_id: uB.user.id, body: 'Top-level comment from User B' })
      .select()
      .single();
    if (rcErr) throw new Error(`Root comment creation failed: ${rcErr.message}`);
    console.log('   ✓ User B created root comment (ID:', rootComment.id, ')');

    // User A replies to User B's comment
    const { data: replyComment, error: replyErr } = await clientA
      .from('comments')
      .insert({
        post_id: postA.id,
        parent_id: rootComment.id,
        author_id: uA.user.id,
        body: 'Reply from post author User A',
      })
      .select()
      .single();
    if (replyErr) throw new Error(`Reply creation failed: ${replyErr.message}`);
    console.log('   ✓ User A successfully replied to root comment with parent_id.');

    // User B attempts to forge a reply on Post 2 referencing rootComment from Post 1 (Must FAIL)
    const { error: forgeErr } = await clientB
      .from('comments')
      .insert({
        post_id: postFollowers.id, // Different post
        parent_id: rootComment.id, // Belongs to postA
        author_id: uB.user.id,
        body: 'Malicious forged cross-post reply',
      });
    if (!forgeErr) {
      throw new Error('SECURITY VIOLATION: User was able to attach a reply to a parent comment from a different post!');
    }
    console.log('   ✓ Cross-post reply injection blocked: Parent comment must belong to the same post.');

    // Post Author Moderation: User A deletes User B's comment on User A's post
    console.log('   Testing post author comment moderation...');
    const { error: modDeleteErr } = await clientA
      .from('comments')
      .delete()
      .eq('id', rootComment.id);
    if (modDeleteErr) throw new Error(`Post author failed to delete comment on own post: ${modDeleteErr.message}`);
    console.log('   ✓ Post author successfully moderated and deleted comment on their post.');

    // 5. ImageKit Asset Deletion Ownership on Post Media (Requirement 5)
    console.log('\n5. Testing Post Media Asset Deletion Ownership via API (Requirement 5)...');

    // User B attempts to delete User A's post media asset via Express server (Must return 403)
    const attackDeleteRes = await request(app)
      .delete(`/api/media/${testFileId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    if (attackDeleteRes.status !== 403) {
      throw new Error(`Expected 403 for unauthorized post media deletion, got ${attackDeleteRes.status}`);
    }
    console.log('   ✓ Security verified: User B deletion blocked with 403 Forbidden.');

    // User A deletes their own post media asset (Must return 200)
    const ownerDeleteRes = await request(app)
      .delete(`/api/media/${testFileId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    if (ownerDeleteRes.status !== 200) {
      throw new Error(`Expected 200 for post author media deletion, got ${ownerDeleteRes.status}`);
    }
    console.log('   ✓ Post author asset deletion succeeded with 200 OK.');

    // Verify post_media row is removed
    const { data: remainingMedia } = await supabaseAdmin
      .from('post_media')
      .select('*')
      .eq('file_id', testFileId);
    if (remainingMedia && remainingMedia.length > 0) {
      throw new Error('post_media row was not removed after asset deletion');
    }
    console.log('   ✓ post_media record cleanly removed from database.');

  } finally {
    // 6. Cleanup test data
    console.log('\n6. Cleaning up test accounts...');
    await supabaseAdmin.auth.admin.deleteUser(uA.user.id);
    await supabaseAdmin.auth.admin.deleteUser(uB.user.id);
    console.log('   ✓ Test accounts deleted from Supabase.');
  }

  console.log('\n=== ALL STAGE 1 SECURITY VERIFICATIONS PASSED ===\n');
}

runStage1Verification().catch((err) => {
  console.error('\n❌ Stage 1 Verification Error:', err.message);
  process.exit(1);
});
