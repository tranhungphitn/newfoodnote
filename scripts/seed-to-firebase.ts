/**
 * Seed sample data from sampleData.ts → Firestore (foodandnote project).
 *
 * Usage:  npx tsx scripts/seed-to-firebase.ts
 *
 * Categories are created FIRST so recipe.categoryId references are valid
 * (Firestore rules enforce exists() check on create).
 */

import {initializeApp} from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import {SAMPLE_CATEGORIES, SAMPLE_RECIPES, SAMPLE_NOTES} from '../src/data/sampleData';

// ── Firebase config (matches .env) ──────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyCLS_0hARtQCjdqpGe85d-FR0gHRWfskeA',
  authDomain: 'foodandnote.firebaseapp.com',
  projectId: 'foodandnote',
  storageBucket: 'foodandnote.firebasestorage.app',
  messagingSenderId: '1039429513177',
  appId: '1:1039429513177:web:ed3e3b257073e99c2973c8',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main seed function ──────────────────────────────────────────────────────
async function seed() {
  console.log('🔍 Checking existing data in Firestore...\n');

  const existingCats = await getDocs(collection(db, 'categories'));
  const existingRecipes = await getDocs(collection(db, 'recipes'));
  const existingNotes = await getDocs(collection(db, 'notes'));

  console.log(`   categories : ${existingCats.size} docs`);
  console.log(`   recipes    : ${existingRecipes.size} docs`);
  console.log(`   notes      : ${existingNotes.size} docs\n`);

  if (existingCats.size > 0 || existingRecipes.size > 0 || existingNotes.size > 0) {
    console.log('⚠️  Database already has data. Skipping seed to avoid duplicates.');
    console.log('   Delete existing docs first if you want to re-seed.\n');
    process.exit(0);
  }

  // ── 1. Seed Categories (must come first for recipe categoryId validation) ─
  console.log('📂 Seeding categories...');
  for (const cat of SAMPLE_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.id), {
      name: cat.name,
      description: cat.description,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`   ✅ ${cat.name}`);
    await sleep(100); // small delay to avoid rate limiting
  }
  console.log(`   → ${SAMPLE_CATEGORIES.length} categories created\n`);

  // ── 2. Seed Recipes ───────────────────────────────────────────────────────
  console.log('🍳 Seeding recipes...');
  for (const recipe of SAMPLE_RECIPES) {
    await setDoc(doc(db, 'recipes', recipe.id), {
      name: recipe.name,
      description: '', // sample data doesn't have descriptions
      coverImage: recipe.coverImage,
      coverImagePath: recipe.coverImagePath || '',
      ingredients: recipe.ingredients,
      cookingSteps: recipe.cookingSteps,
      categoryId: recipe.categoryId,
      frequency: recipe.frequency,
      isFavorite: recipe.isFavorite,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`   ✅ ${recipe.name}`);
    await sleep(100);
  }
  console.log(`   → ${SAMPLE_RECIPES.length} recipes created\n`);

  // ── 3. Seed Notes ─────────────────────────────────────────────────────────
  console.log('📝 Seeding notes...');
  for (const note of SAMPLE_NOTES) {
    await setDoc(doc(db, 'notes', note.id), {
      title: note.title,
      content: note.content,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`   ✅ ${note.title.slice(0, 50)}...`);
    await sleep(100);
  }
  console.log(`   → ${SAMPLE_NOTES.length} notes created\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('🎉 DONE! All sample data seeded successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log(`   ${SAMPLE_CATEGORIES.length} categories`);
  console.log(`   ${SAMPLE_RECIPES.length} recipes`);
  console.log(`   ${SAMPLE_NOTES.length} notes`);
  console.log('\n👉 Refresh http://localhost:3222 to see the data!\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message || err);
  if (err.code === 'permission-denied') {
    console.error('\n💡 Tip: Make sure Firestore Security Rules allow writes.');
    console.error('   Deploy the rules from firestore.rules to your Firebase project.');
  }
  process.exit(1);
});
