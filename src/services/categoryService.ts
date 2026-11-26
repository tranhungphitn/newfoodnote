import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {handleFirestoreError, OperationType} from '../lib/firestoreError';
import {VALIDATION_LIMITS, type Category, type CategoryInput} from '../types/models';

/**
 * Categories don't exist as a separate collection in Firebase.
 * Instead, we derive them from the 'category' field of each dish in the 'dishes' collection.
 */
const RECIPES_COLLECTION = 'dishes';
const CATEGORIES_COLLECTION = 'categories';

function sanitizeCategoryInput(input: CategoryInput) {
  const name = input.name.trim().slice(0, VALIDATION_LIMITS.CATEGORY_NAME_MAX);
  if (!name) {
    throw new Error('Tên danh mục không được để trống.');
  }
  const description = (input.description || '').trim().slice(0, VALIDATION_LIMITS.CATEGORY_DESC_MAX);
  return {name, description};
}

/**
 * Subscribe to categories derived dynamically from the 'category' field
 * of all documents in the 'dishes' collection.
 */
export function subscribeCategories(
  onData: (categories: Category[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, RECIPES_COLLECTION),
    (snapshot) => {
      const categoryNames = new Set<string>();
      snapshot.docs.forEach((docSnap) => {
        const cat = docSnap.data().category;
        if (typeof cat === 'string' && cat.trim()) {
          categoryNames.add(cat.trim());
        }
      });
      const categories: Category[] = Array.from(categoryNames)
        .sort((a, b) => a.localeCompare(b, 'vi'))
        .map((name) => ({
          id: name,
          name,
          description: '',
          createdAt: null,
          updatedAt: null,
        }));
      onData(categories);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, RECIPES_COLLECTION);
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const sanitized = sanitizeCategoryInput(input);
  try {
    const ref = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...sanitized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CATEGORIES_COLLECTION);
  }
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const sanitized = sanitizeCategoryInput(input);
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, CATEGORIES_COLLECTION, id), {
      ...sanitized,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
