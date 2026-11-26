import type {Timestamp} from 'firebase/firestore';

export type UserRole = 'guest' | 'admin';

export type RecipeFrequency = 'regular' | 'occasional';

/** Dates from Firebase can be Firestore Timestamps or ISO-8601 strings. */
export type FirebaseDate = Timestamp | string | null;

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface CookingStep {
  step: number;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  coverImagePath?: string;
  ingredients: Ingredient[];
  cookingSteps: CookingStep[];
  categoryId: string;
  frequency: RecipeFrequency;
  isFavorite: boolean;
  createdAt: FirebaseDate;
  updatedAt: FirebaseDate;
}

export interface RecipeInput {
  name: string;
  description?: string;
  coverImage: string;
  coverImagePath?: string;
  ingredients: Ingredient[];
  cookingSteps: CookingStep[];
  categoryId: string;
  frequency: RecipeFrequency;
  isFavorite: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: FirebaseDate;
  updatedAt: FirebaseDate;
}

export interface CategoryInput {
  name: string;
  description: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  createdAt: FirebaseDate;
  updatedAt: FirebaseDate;
}

export interface NoteInput {
  title: string;
  content: string;
}

/**
 * Validation limits synchronized verbatim with firebase-blueprint.json & firestore.rules.
 */
export const VALIDATION_LIMITS = {
  RECIPE_NAME_MAX: 160,
  RECIPE_DESC_MAX: 1000,
  COVER_IMAGE_URL_MAX: 2048,
  COVER_IMAGE_PATH_MAX: 512,
  INGREDIENTS_MAX_COUNT: 100,
  INGREDIENT_NAME_MAX: 160,
  INGREDIENT_QTY_MAX: 80,
  STEPS_MAX_COUNT: 100,
  STEP_DESC_MAX: 2000,
  CATEGORY_ID_MAX: 128,
  CATEGORY_ID_PATTERN: /^[a-zA-Z0-9_-]*$/,
  CATEGORY_NAME_MAX: 80,
  CATEGORY_DESC_MAX: 400,
  NOTE_TITLE_MAX: 160,
  NOTE_CONTENT_MAX: 20000,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
} as const;

/** Convert FirebaseDate (Timestamp | string | null) to a JS Date. */
function toDate(ts: FirebaseDate): Date | null {
  if (!ts) return null;
  try {
    if (typeof ts === 'string') return new Date(ts);
    return ts.toDate();
  } catch {
    return null;
  }
}

export function formatTimestamp(ts: FirebaseDate): string {
  const date = toDate(ts);
  if (!date || isNaN(date.getTime())) return 'Vừa xong';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function formatRelativeDate(ts: FirebaseDate): string {
  const date = toDate(ts);
  if (!date || isNaN(date.getTime())) return 'Vừa xong';
  try {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return formatTimestamp(ts);
  } catch {
    return '';
  }
}
