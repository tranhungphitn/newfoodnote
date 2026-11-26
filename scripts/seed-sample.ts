import {initializeApp} from 'firebase/app';
import {doc, getDoc, getFirestore, serverTimestamp, setDoc} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with {type: 'json'};
import {SAMPLE_CATEGORIES, SAMPLE_NOTES, SAMPLE_RECIPES} from '../src/data/sampleData.ts';

async function seed() {
  const app = initializeApp(firebaseConfig);
  const db =
    firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);

  let createdCategories = 0;
  let createdRecipes = 0;
  let createdNotes = 0;

  // 1. Seed categories first (recipes reference categoryId and firestore.rules checks exists())
  for (const cat of SAMPLE_CATEGORIES) {
    const ref = doc(db, 'categories', cat.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: cat.name,
        description: cat.description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdCategories += 1;
    }
  }

  // 2. Seed 20 sample recipes (never overwrite existing user data)
  for (const recipe of SAMPLE_RECIPES) {
    const ref = doc(db, 'recipes', recipe.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: recipe.name,
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
      createdRecipes += 1;
    }
  }

  // 3. Seed 10 sample notes (never overwrite existing user data)
  for (const note of SAMPLE_NOTES) {
    const ref = doc(db, 'notes', note.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        title: note.title,
        content: note.content,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdNotes += 1;
    }
  }

  console.log(
    `Seed completed: +${createdCategories} categories, +${createdRecipes} recipes, +${createdNotes} notes.`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
