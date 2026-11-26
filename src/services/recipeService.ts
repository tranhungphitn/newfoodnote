import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {handleFirestoreError, OperationType} from '../lib/firestoreError';
import {
  VALIDATION_LIMITS,
  type CookingStep,
  type Ingredient,
  type Recipe,
  type RecipeInput,
} from '../types/models';
import {deleteRecipeImageByPath} from './storageService';

/* Firebase collection is 'dishes', not 'recipes' */
const COLLECTION_PATH = 'dishes';

/**
 * Parse a newline-separated string of ingredients into Ingredient[].
 * Handles lines like "- 500g thịt heo" or plain "500g thịt heo".
 */
function parseIngredients(raw: unknown): Ingredient[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => ({
      name: typeof item?.name === 'string' ? item.name : String(item ?? ''),
      quantity: typeof item?.quantity === 'string' ? item.quantity : '',
    })).filter((i) => i.name.length > 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({
        name: line.replace(/^[-•]\s*/, ''),
        quantity: '',
      }));
  }
  return [];
}

/**
 * Parse a string of numbered instructions into CookingStep[].
 * Handles "1. Do X\n2. Do Y" and also plain text (single step).
 */
function parseInstructions(raw: unknown): CookingStep[] {
  if (Array.isArray(raw)) {
    return raw.map((item, idx) => ({
      step: typeof item?.step === 'number' ? item.step : idx + 1,
      description: typeof item?.description === 'string' ? item.description : String(item ?? ''),
    })).filter((s) => s.description.length > 0);
  }
  if (typeof raw === 'string' && raw.trim()) {
    // Try splitting on numbered patterns like "1." "2." etc.
    const parts = raw.split(/\n(?=\d+\.\s)/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1) {
      return parts.map((part, idx) => ({
        step: idx + 1,
        description: part.replace(/^\d+\.\s*/, ''),
      }));
    }
    // Fallback: split by newline, each line is a step
    const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean);
    return lines.map((line, idx) => ({
      step: idx + 1,
      description: line.replace(/^\d+\.\s*/, ''),
    }));
  }
  return [];
}

function mapRecipeDoc(snap: QueryDocumentSnapshot<DocumentData>): Recipe {
  const data = snap.data();
  return {
    id: snap.id,
    name: typeof data.name === 'string' ? data.name : '',
    // 'summary' in Firebase → 'description' in app
    description: typeof data.summary === 'string' ? data.summary
      : typeof data.description === 'string' ? data.description : '',
    // 'imageUrl' in Firebase → 'coverImage' in app
    coverImage: typeof data.imageUrl === 'string' ? data.imageUrl
      : typeof data.coverImage === 'string' ? data.coverImage : '',
    coverImagePath: typeof data.coverImagePath === 'string' ? data.coverImagePath : '',
    ingredients: parseIngredients(data.ingredients),
    cookingSteps: parseInstructions(data.instructions ?? data.cookingSteps),
    // 'category' (name string) in Firebase → 'categoryId' in app
    categoryId: typeof data.category === 'string' ? data.category
      : typeof data.categoryId === 'string' ? data.categoryId : '',
    frequency: data.frequency === 'occasional' ? 'occasional' : 'regular',
    isFavorite: Boolean(data.isFavorite),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function sanitizeRecipeInput(input: RecipeInput) {
  const name = input.name.trim().slice(0, VALIDATION_LIMITS.RECIPE_NAME_MAX);
  if (!name) {
    throw new Error('Tên món ăn không được để trống.');
  }

  const description = (input.description || '').trim().slice(0, VALIDATION_LIMITS.RECIPE_DESC_MAX);

  const rawCoverImage = (input.coverImage || '')
    .trim()
    .slice(0, VALIDATION_LIMITS.COVER_IMAGE_URL_MAX);
  let coverImage = '';
  if (rawCoverImage) {
    try {
      const parsedUrl = new URL(rawCoverImage);
      if (parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'http:') {
        coverImage = rawCoverImage;
      } else {
        throw new Error('Đường link hình ảnh phải bắt đầu bằng https:// hoặc http://.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('https://')) {
        throw err;
      }
      throw new Error('Đường link hình ảnh không hợp lệ.');
    }
  }
  const coverImagePath = (input.coverImagePath || '').trim().slice(0, VALIDATION_LIMITS.COVER_IMAGE_PATH_MAX);

  const ingredients: Ingredient[] = input.ingredients
    .map((item) => ({
      name: item.name.trim().slice(0, VALIDATION_LIMITS.INGREDIENT_NAME_MAX),
      quantity: item.quantity.trim().slice(0, VALIDATION_LIMITS.INGREDIENT_QTY_MAX),
    }))
    .filter((item) => item.name.length > 0)
    .slice(0, VALIDATION_LIMITS.INGREDIENTS_MAX_COUNT);

  const cookingSteps: CookingStep[] = input.cookingSteps
    .map((item) => item.description.trim().slice(0, VALIDATION_LIMITS.STEP_DESC_MAX))
    .filter((desc) => desc.length > 0)
    .slice(0, VALIDATION_LIMITS.STEPS_MAX_COUNT)
    .map((description, index) => ({
      step: index + 1,
      description,
    }));

  // Category IDs are now Vietnamese category names (e.g. "Món Heo"), so skip pattern check
  const categoryId = (input.categoryId || '').trim().slice(0, VALIDATION_LIMITS.CATEGORY_ID_MAX);

  const frequency = input.frequency === 'occasional' ? 'occasional' : 'regular';
  const isFavorite = Boolean(input.isFavorite);

  return {
    name,
    description,
    coverImage,
    coverImagePath,
    ingredients,
    cookingSteps,
    categoryId,
    frequency,
    isFavorite,
  };
}

export function subscribeRecipes(
  onData: (recipes: Recipe[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  // Fetch all dishes without orderBy to avoid Firestore index requirements.
  // Sort in-memory since some docs may have string dates or missing updatedAt.
  return onSnapshot(
    collection(db, COLLECTION_PATH),
    (snapshot) => {
      const recipes = snapshot.docs.map(mapRecipeDoc);
      recipes.sort((a, b) => {
        const ta = a.updatedAt ? String(a.updatedAt) : '';
        const tb = b.updatedAt ? String(b.updatedAt) : '';
        return tb.localeCompare(ta); // desc
      });
      onData(recipes);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const path = `${COLLECTION_PATH}/${id}`;
  try {
    const snap = await getDoc(doc(db, COLLECTION_PATH, id));
    if (!snap.exists()) return null;
    return mapRecipeDoc(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createRecipe(input: RecipeInput): Promise<string> {
  const sanitized = sanitizeRecipeInput(input);
  try {
    const ref = await addDoc(collection(db, COLLECTION_PATH), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, COLLECTION_PATH);
  }
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  const sanitized = sanitizeRecipeInput(input);
  const path = `${COLLECTION_PATH}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION_PATH, id), {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleRecipeFavorite(id: string, nextValue: boolean): Promise<void> {
  const path = `${COLLECTION_PATH}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTION_PATH, id), {
      isFavorite: Boolean(nextValue),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteRecipe(recipe: Pick<Recipe, 'id' | 'coverImagePath'>): Promise<void> {
  const path = `${COLLECTION_PATH}/${recipe.id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_PATH, recipe.id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
  if (recipe.coverImagePath) {
    await deleteRecipeImageByPath(recipe.coverImagePath);
  }
}
