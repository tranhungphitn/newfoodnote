/**
 * Security Rules Specification & Adversarial Test Matrix ("Dirty Dozen")
 *
 * Run against Firebase Local Emulator Suite when @firebase/rules-unit-testing is installed:
 *   firebase emulators:exec "npx tsx firestore.rules.test.ts"
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  actor: 'guest' | 'nonAdminUser' | 'spoofedEmailUser' | 'admin';
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'ALLOW' | 'PERMISSION_DENIED';
}

export const SECURITY_TEST_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Guest Recipe Create Blocked',
    actor: 'guest',
    operation: 'create',
    path: 'recipes/recipe-1',
    payload: {
      name: 'Phở Bò',
      coverImage: '',
      ingredients: [{name: 'Bánh phở', quantity: '300g'}],
      cookingSteps: [{step: 1, description: 'Ninh xương bò'}],
      categoryId: '',
      frequency: 'regular',
      isFavorite: false,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Non-Admin Authenticated User Create Blocked',
    actor: 'nonAdminUser',
    operation: 'create',
    path: 'notes/note-1',
    payload: {title: 'Test', content: 'Unauthorized'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Email Spoofing Attack (email_verified: false) Blocked',
    actor: 'spoofedEmailUser',
    operation: 'update',
    path: 'categories/cat-1',
    payload: {name: 'Hacked', description: ''},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Create Blocked',
    actor: 'admin',
    operation: 'create',
    path: 'recipes/recipe-2',
    payload: {
      name: 'Bún Chả',
      coverImage: '',
      ingredients: [],
      cookingSteps: [],
      categoryId: '',
      frequency: 'regular',
      isFavorite: false,
      isVerified: true, // Ghost field
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Update Injection Blocked',
    actor: 'admin',
    operation: 'update',
    path: 'notes/note-1',
    payload: {title: 'Updated', authorEmail: 'spoof@example.com'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immutable createdAt Tampering Blocked',
    actor: 'admin',
    operation: 'update',
    path: 'recipes/recipe-1',
    payload: {createdAt: new Date(0)},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Forged Client Timestamp on Create Blocked',
    actor: 'admin',
    operation: 'create',
    path: 'categories/cat-2',
    payload: {name: 'Món nước', description: '', createdAt: new Date(0), updatedAt: new Date(0)},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'ID Poisoning (Invalid Characters) Blocked',
    actor: 'admin',
    operation: 'create',
    path: 'recipes/invalid$id!space',
    payload: {name: 'Bad ID'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Oversized String Exhaustion (>20000 chars) Blocked',
    actor: 'admin',
    operation: 'create',
    path: 'notes/note-big',
    payload: {title: 'Overflow', content: 'A'.repeat(25000)},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Malformed Ingredients Array Element Blocked',
    actor: 'admin',
    operation: 'create',
    path: 'recipes/recipe-bad-ing',
    payload: {
      name: 'Bad Ingredients',
      coverImage: '',
      ingredients: ['not-an-object'],
      cookingSteps: [],
      categoryId: '',
      frequency: 'regular',
      isFavorite: false,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Invalid Frequency Enum Value Blocked',
    actor: 'admin',
    operation: 'update',
    path: 'recipes/recipe-1',
    payload: {frequency: 'every-hour'},
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Orphaned Category Reference Blocked',
    actor: 'admin',
    operation: 'create',
    path: 'recipes/recipe-orphan',
    payload: {
      name: 'Orphan Dish',
      coverImage: '',
      ingredients: [],
      cookingSteps: [],
      categoryId: 'nonexistent-category',
      frequency: 'occasional',
      isFavorite: false,
    },
    expected: 'PERMISSION_DENIED',
  },
];
