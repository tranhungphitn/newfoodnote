import {VALIDATION_LIMITS} from '../types/models';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP, GIF hoặc AVIF.';
  }
  if (file.size <= 0) {
    return 'Tệp hình ảnh không hợp lệ.';
  }
  if (file.size > VALIDATION_LIMITS.IMAGE_MAX_BYTES * 2) {
    return 'Ảnh gốc quá lớn (vượt quá 10MB). Vui lòng chọn ảnh nhẹ hơn.';
  }
  return null;
}

/**
 * Optimizes dish images client-side before uploading to Firebase Storage:
 * resizes to max 1400px on the longest edge and encodes as WebP/JPEG to keep payloads crisp & lightweight.
 */
export async function optimizeRecipeImage(file: File): Promise<Blob> {
  // Preserve animated GIFs as-is if within 5MB
  if (file.type === 'image/gif') {
    if (file.size > VALIDATION_LIMITS.IMAGE_MAX_BYTES) {
      throw new Error('Ảnh GIF vượt quá giới hạn 5MB.');
    }
    return file;
  }

  const imageBitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Không thể đọc tệp hình ảnh.'));
      el.src = imageBitmapUrl;
    });

    const MAX_DIM = 1400;
    let {naturalWidth: width, naturalHeight: height} = img;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width >= height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(img, 0, 0, width, height);

    const targetMime = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), targetMime, 0.85)
    );

    if (!blob) {
      return file;
    }

    if (blob.size > VALIDATION_LIMITS.IMAGE_MAX_BYTES) {
      const compressed = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.72)
      );
      if (compressed && compressed.size <= VALIDATION_LIMITS.IMAGE_MAX_BYTES) {
        return compressed;
      }
      throw new Error('Ảnh sau tối ưu vẫn vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
    }

    return blob;
  } finally {
    URL.revokeObjectURL(imageBitmapUrl);
  }
}
