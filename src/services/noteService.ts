import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import {VALIDATION_LIMITS, type Note, type NoteInput} from '../types/models';

const COLLECTION_PATH = 'notes';

function mapNoteDoc(snap: QueryDocumentSnapshot<DocumentData>): Note {
  const data = snap.data();
  return {
    id: snap.id,
    title: typeof data.title === 'string' ? data.title : '',
    content: typeof data.content === 'string' ? data.content : '',
    color: typeof data.color === 'string' ? data.color : undefined,
    isPinned: typeof data.isPinned === 'boolean' ? data.isPinned : undefined,
    createdAt: data.createdAt ?? data.updatedAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

function sanitizeNoteInput(input: NoteInput) {
  const title = input.title.trim().slice(0, VALIDATION_LIMITS.NOTE_TITLE_MAX);
  if (!title) {
    throw new Error('Tiêu đề ghi chú không được để trống.');
  }
  const content = (input.content || '').slice(0, VALIDATION_LIMITS.NOTE_CONTENT_MAX);
  return {title, content};
}

export function subscribeNotes(
  onData: (notes: Note[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const q = query(collection(db, COLLECTION_PATH), orderBy('updatedAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map(mapNoteDoc));
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

export async function getNoteById(id: string): Promise<Note | null> {
  const path = `${COLLECTION_PATH}/${id}`;
  try {
    const snap = await getDoc(doc(db, COLLECTION_PATH, id));
    if (!snap.exists()) return null;
    return mapNoteDoc(snap as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createNote(input: NoteInput): Promise<string> {
  const sanitized = sanitizeNoteInput(input);
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

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  const sanitized = sanitizeNoteInput(input);
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

export async function deleteNote(id: string): Promise<void> {
  const path = `${COLLECTION_PATH}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_PATH, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
