import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {handleFirestoreError, OperationType} from '../lib/firestoreError';
import {VALIDATION_LIMITS, type Category, type CategoryInput} from '../types/models';

const COLLECTION_PATH = 'categories';

function mapCategoryDoc(snap: QueryDocumentSnapshot<DocumentData>): Category {
  const data = snap.data();
  return {
    id: snap.id,
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function sanitizeCategoryInput(input: CategoryInput) {
  const name = input.name.trim().slice(0, VALIDATION_LIMITS.CATEGORY_NAME_MAX);
  if (!name) {
    throw new Error('Tên danh mục không được để trống.');
  }
  const description = (input.description || '').trim().slice(0, VALIDATION_LIMITS.CATEGORY_DESC_MAX);
  return {name, description};
}

export function subscribeCategories(
  onData: (categories: Category[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_PATH), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map(mapCategoryDoc));
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

export async function createCategory(input: CategoryInput): Promise<string> {
  const sanitized = sanitizeCategoryInput(input);
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

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const sanitized = sanitizeCategoryInput(input);
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

export async function deleteCategory(id: string): Promise<void> {
  const path = `${COLLECTION_PATH}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
