# Security Specification — My Recipe & Notes

## 1. Data Invariants

1. **Single-Admin Write Isolation**: All `create`, `update`, and `delete` operations across `/recipes`, `/categories`, and `/notes` require an authenticated user with Custom Claim `request.auth.token.admin == true` (or verified bootstrapped project owner / trusted `/admins/{uid}` record). Guests (unauthenticated or non-admin users) receive `PERMISSION_DENIED` on any write.
2. **Public Read Transparency**: All three content collections (`recipes`, `categories`, `notes`) are intentionally public read for Guests so visitors can browse recipes, categories, and notes without logging in. No PII is stored in any collection.
3. **Default-Deny Catch-All**: Any collection or path outside `/recipes`, `/categories`, and `/notes` is denied for both read and write (`match /{document=**} { allow read, write: if false; }`).
4. **Strict Schema & Boundary Enforcement**: Every string has `.size()` limits, every list (`ingredients`, `cookingSteps`) has `.size() <= 100` plus first-element structure validation, `frequency` is strictly in `['regular', 'occasional']`, and unknown shadow fields are blocked via `hasAll` / `hasOnly` and `affectedKeys().hasOnly(...)`.
5. **Path Hardening & Referential Integrity**: Single-document operations validate `isValidId(docId)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars). When a recipe specifies a non-empty `categoryId`, `exists(/databases/$(database)/documents/categories/$(incoming().categoryId))` ensures no dangling category references on create.
6. **Temporal & Immutability Integrity**: `createdAt == request.time` and `updatedAt == request.time` on `create`. On `update`, `createdAt == existing().createdAt` (immutable) and `updatedAt == request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)

1. **Guest Recipe Create**: Unauthenticated client attempts `create` on `/recipes/r1` with valid payload -> DENIED.
2. **Non-Admin Authenticated User Create**: Signed-in user without `admin == true` claim attempts `create` on `/notes/n1` -> DENIED.
3. **Email Spoofing Attack**: Signed-in user with matching owner email but `email_verified == false` attempts `update` on `/categories/c1` -> DENIED.
4. **Shadow Field Injection (Ghost Field)**: Admin attempts `create` on `/recipes/r2` including extra field `isVerified: true` -> DENIED (`hasOnly`).
5. **Shadow Update Injection**: Admin attempts `update` on `/notes/n1` adding unexpected field `authorEmail: "x@y.com"` -> DENIED (`affectedKeys().hasOnly`).
6. **Immutable `createdAt` Tampering**: Admin attempts `update` on `/recipes/r1` modifying `createdAt` -> DENIED (`incoming().createdAt == existing().createdAt`).
7. **Forged Client Timestamp**: Admin attempts `create` on `/categories/c2` with `createdAt` set to a past timestamp instead of `request.time` -> DENIED.
8. **ID Poisoning / Oversized Document ID**: Admin attempts `create` on `/recipes/invalid$id!with*spaces` or a 200-char ID -> DENIED (`isValidId`).
9. **Resource Exhaustion (1MB String)**: Admin attempts `create` on `/notes/n2` with `content.size() > 20000` -> DENIED.
10. **Array Flooding / Malformed Ingredient**: Admin attempts `create` on `/recipes/r3` with `ingredients.size() > 100` or `ingredients: ["not-an-object"]` -> DENIED.
11. **Invalid Enum Frequency**: Admin attempts `update` on `/recipes/r1` with `frequency: "daily"` -> DENIED.
12. **Orphaned Category Reference**: Admin attempts `create` on `/recipes/r4` with `categoryId: "nonexistent-cat-id"` -> DENIED (`exists(...)`).
