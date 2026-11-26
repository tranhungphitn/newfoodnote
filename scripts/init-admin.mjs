#!/usr/bin/env node
/**
 * One-time Admin initialization script for My Recipe & Notes.
 *
 * SECURITY NOTICE:
 * - Run this script ONCE in a trusted local terminal (NEVER bundle into frontend or Vercel).
 * - NEVER commit serviceAccountKey.json or passwords into GitHub.
 * - Requires: npm install --no-save firebase-admin (or run in a separate local folder).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
 *   ADMIN_EMAIL=admin@myrecipe.local \
 *   ADMIN_INITIAL_PASSWORD=<your-initial-password> \
 *   node scripts/init-admin.mjs
 */

import process from 'node:process';

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@myrecipe.local').trim().toLowerCase();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!initialPassword || initialPassword.length < 6) {
    console.error(
      'ERROR: Missing or invalid ADMIN_INITIAL_PASSWORD environment variable (must be at least 6 characters).'
    );
    process.exit(1);
  }

  let adminApp;
  let adminAuth;
  try {
    const appModule = await import('firebase-admin/app');
    const authModule = await import('firebase-admin/auth');
    adminApp = appModule.getApps().length
      ? appModule.getApp()
      : appModule.initializeApp({
          credential: appModule.applicationDefault(),
        });
    adminAuth = authModule.getAuth(adminApp);
  } catch (err) {
    console.error(
      'ERROR: Could not load firebase-admin. Install it temporarily with `npm install --no-save firebase-admin` and ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account JSON.'
    );
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(adminEmail);
    console.log(`Found existing user for ${adminEmail} (uid: ${userRecord.uid}). Updating credentials & claims...`);
    userRecord = await adminAuth.updateUser(userRecord.uid, {
      password: initialPassword,
      emailVerified: true,
      disabled: false,
      displayName: 'Admin',
    });
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
    if (code === 'auth/user-not-found') {
      console.log(`Creating single admin account for ${adminEmail}...`);
      userRecord = await adminAuth.createUser({
        email: adminEmail,
        password: initialPassword,
        emailVerified: true,
        displayName: 'Admin',
      });
    } else {
      console.error('Failed to look up or create admin user:', err);
      process.exit(1);
    }
  }

  await adminAuth.setCustomUserClaims(userRecord.uid, {admin: true});

  console.log('SUCCESS: Single admin account configured.');
  console.log(`  Email:         ${userRecord.email}`);
  console.log(`  UID:           ${userRecord.uid}`);
  console.log('  Custom Claims: { admin: true }');
  console.log('\nNext steps:');
  console.log('  1. Ensure Email/Password Sign-in Provider is enabled in Firebase Authentication Console.');
  console.log('  2. Unset ADMIN_INITIAL_PASSWORD from your shell history and delete any local key file if not needed.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
