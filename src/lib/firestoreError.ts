import {auth} from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function getFriendlyErrorMessage(error: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'): string {
  const raw = error instanceof Error ? error.message : String(error);

  let parsedError = raw;
  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      parsedError = parsed.error;
    }
  } catch {
    // Not JSON
  }

  const lower = parsedError.toLowerCase();
  if (lower.includes('permission-denied') || lower.includes('missing or insufficient permissions')) {
    return 'Bạn không có quyền thực hiện thao tác này. Chỉ quản trị viên mới được phép thay đổi dữ liệu.';
  }
  if (lower.includes('quota exceeded')) {
    return 'Hạn mức đọc/ghi Firestore miễn phí hôm nay đã hết. Vui lòng thử lại vào ngày mai.';
  }
  if (lower.includes('unavailable') || lower.includes('offline') || lower.includes('network')) {
    return 'Không thể kết nối tới máy chủ Firebase. Vui lòng kiểm tra kết nối mạng.';
  }
  if (lower.includes('storage/unauthorized')) {
    return 'Không có quyền tải ảnh lên Firebase Storage. Vui lòng kiểm tra quyền admin và Storage Rules.';
  }
  if (lower.includes('storage/retry-limit-exceeded')) {
    return 'Tải ảnh quá thời gian cho phép. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }
  if (lower.includes('not-found')) {
    return 'Không tìm thấy dữ liệu yêu cầu hoặc dữ liệu đã bị xóa.';
  }
  return fallback;
}
