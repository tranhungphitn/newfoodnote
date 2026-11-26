import {deleteObject, getDownloadURL, ref, uploadBytesResumable} from 'firebase/storage';
import {storage} from '../lib/firebase';
import {optimizeRecipeImage, validateImageFile} from '../lib/imageUtils';

export interface UploadedImageResult {
  url: string;
  path: string;
}

export async function uploadRecipeImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadedImageResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const optimizedBlob = await optimizeRecipeImage(file);
  const ext =
    optimizedBlob.type === 'image/webp'
      ? 'webp'
      : optimizedBlob.type === 'image/gif'
        ? 'gif'
        : 'jpg';

  const safeSlug = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .toLowerCase();

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeSlug || 'dish'}.${ext}`;
  const storagePath = `recipes/${fileName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise<UploadedImageResult>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, optimizedBlob, {
      contentType: optimizedBlob.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({url, path: storagePath});
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function deleteRecipeImageByPath(storagePath?: string | null): Promise<void> {
  if (!storagePath || !storagePath.startsWith('recipes/')) {
    return;
  }
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    // Ignore if file was already deleted or doesn't exist
    if (code === 'storage/object-not-found') {
      return;
    }
    console.warn('Could not delete old image from Storage:', error);
  }
}
