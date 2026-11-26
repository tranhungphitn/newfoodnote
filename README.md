# My Recipe & Notes

Ứng dụng web sổ tay công thức nấu ăn và ghi chú cá nhân hiện đại, hỗ trợ **PWA (Progressive Web App)** trên iOS & Android, lưu trữ dữ liệu thời gian thực với **Firebase Firestore**, tải ảnh món ăn lên **Firebase Storage**, và xác thực duy nhất một tài khoản quản trị viên thông qua **Firebase Authentication + Custom Claim (`admin: true`)**.

---

## Kiến trúc & Công nghệ

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide React, React Router
- **Backend-as-a-Service:** Firebase Firestore, Firebase Storage, Firebase Authentication
- **Bảo mật:** Firestore Security Rules (`firestore.rules`) & Storage Security Rules (`storage.rules`)
- **PWA:** `vite-plugin-pwa` (Manifest, icon 192/512/maskable/apple-touch-icon, Workbox cache tài nguyên tĩnh, tuyệt đối không cache endpoint xác thực)
- **Deploy:** Vercel (`vercel.json` cấu hình SPA rewrite cho React Router)

---

## Cấu trúc dự án

```text
├── firestore.rules           # Quy tắc bảo mật Firestore (public read, admin-only write)
├── storage.rules             # Quy tắc bảo mật Firebase Storage (public read, admin-only image <= 5MB)
├── firebase-blueprint.json   # Lược đồ dữ liệu Firestore (recipes, categories, notes)
├── scripts/
│   └── init-admin.mjs        # Script chạy 1 lần ở máy cá nhân để khởi tạo admin + Custom Claim
├── vercel.json               # Cấu hình build & SPA rewrites trên Vercel
├── .env.example              # Biến môi trường mẫu
└── src/
    ├── lib/                  # Khởi tạo Firebase, xử lý lỗi Firestore, tối ưu ảnh
    ├── services/             # recipeService, categoryService, noteService, storageService
    ├── contexts/             # AuthContext, DataContext, ToastContext
    ├── hooks/                # usePWAInstall, useOnlineStatus
    ├── components/           # Layout, RecipeCard, RecipeImage, ConfirmDialog, PWAInstallButton...
    └── pages/                # Home, Recipes, RecipeDetail, RecipeForm, Categories, Notes, Login
```

---

## 1. Cấu hình Firebase Console

### Bước 1: Tạo hoặc chọn Firebase Project
1. Truy cập [Firebase Console](https://console.firebase.google.com/).
2. Tạo Web App trong **Project Settings → Your apps** để lấy các giá trị cấu hình (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).

### Bước 2: Bật các dịch vụ cần thiết
1. **Authentication → Sign-in method:**
   - Bật **Email/Password** (bắt buộc để đăng nhập bằng username `admin` ánh xạ sang `admin@myrecipe.local`).
   - Không cần bật các phương thức khác và không bật tính năng tự đăng ký trên frontend.
2. **Firestore Database:**
   - Tạo Firestore Database ở chế độ Production.
3. **Firebase Storage:**
   - Bật Firebase Storage để lưu ảnh món ăn tại đường dẫn `recipes/*`.

### Bước 3: Triển khai Security Rules
- **Firestore Rules:** Sao chép toàn bộ nội dung tệp `firestore.rules` dán vào **Firestore Database → Rules → Publish** (hoặc dùng Firebase CLI: `firebase deploy --only firestore:rules`).
- **Storage Rules:** Sao chép toàn bộ nội dung tệp `storage.rules` dán vào **Storage → Rules → Publish** (hoặc dùng Firebase CLI: `firebase deploy --only storage`).

> **Khuyến nghị bảo mật:** Luôn rà soát kỹ `firestore.rules` và `storage.rules` trước khi chia sẻ rộng rãi ứng dụng.

---

## 2. Khởi tạo tài khoản Admin duy nhất (Chạy 1 lần ở môi trường an toàn)

Tài khoản admin sử dụng ánh xạ nội bộ:
- **Username đăng nhập trên web:** `admin`
- **Email nội bộ trong Firebase Auth:** `admin@myrecipe.local` (có thể tùy chỉnh qua `VITE_ADMIN_EMAIL`)
- **Custom Claim bắt buộc:** `{ "admin": true }`

> **QUAN TRỌNG:** Không bao giờ đưa mật khẩu admin, tệp `serviceAccountKey.json`, hay `firebase-admin` vào frontend hoặc commit lên GitHub.

### Cách chạy script khởi tạo trên máy cá nhân:

1. Trong **Firebase Console → Project Settings → Service accounts**, nhấn **Generate new private key** để tải tệp JSON và lưu tạm tại `./serviceAccountKey.json` (tệp này đã được chặn trong `.gitignore`).
2. Cài tạm `firebase-admin` (không lưu vào `package.json`):
   ```bash
   npm install --no-save firebase-admin
   ```
3. Chạy script khởi tạo một lần (thay `<MAT_KHAU_KHOI_TAO>` bằng mật khẩu quản trị của bạn):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json \
   ADMIN_EMAIL=admin@myrecipe.local \
   ADMIN_INITIAL_PASSWORD=<MAT_KHAU_KHOI_TAO> \
   node scripts/init-admin.mjs
   ```
4. Sau khi script báo `SUCCESS`:
   - Xóa tệp `./serviceAccountKey.json` khỏi thư mục dự án.
   - Xóa lịch sử biến môi trường mật khẩu trong terminal nếu cần.

---

## 3. Triển khai từ GitHub lên Vercel

### Bước 1: Đẩy mã nguồn lên GitHub
Kiểm tra `git status` để chắc chắn không có tệp `.env`, `.env.local` hay `*firebase-adminsdk*.json`, sau đó push lên repository GitHub của bạn.

### Bước 2: Kết nối Vercel
1. Truy cập [Vercel Dashboard](https://vercel.com/new) → chọn **Import Git Repository**.
2. Kiểm tra cấu hình Build (đã khai báo sẵn trong `vercel.json`):
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Thêm các **Environment Variables** trong Vercel Project Settings (tham khảo `.env.example`):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_DATABASE_ID` (để `(default)` nếu dùng database mặc định của Firebase)
   - `VITE_ADMIN_EMAIL` (mặc định `admin@myrecipe.local`)
4. Nhấn **Deploy**.

### Bước 3: Cấu hình Firebase Authorized Domains
Sau khi Vercel cấp tên miền (ví dụ `my-recipe-notes.vercel.app` hoặc custom domain):
1. Vào **Firebase Console → Authentication → Settings → Authorized domains**.
2. Nhấn **Add domain** và thêm tên miền Vercel của bạn (ví dụ `my-recipe-notes.vercel.app`).

### Bước 4: Kiểm tra Refresh & PWA
- Truy cập trực tiếp các đường dẫn như `/recipes`, `/notes`, `/categories`, `/login` và nhấn Refresh (F5) — `vercel.json` sẽ tự động rewrite về `/index.html` mà không gặp lỗi 404.
- Trên **Android / Chrome**: Nhấn nút **Cài đặt ứng dụng** trong giao diện hoặc chọn *Add to Home Screen* trên trình duyệt.
- Trên **iOS Safari**: Nhấn nút **Thêm vào Màn hình chính** trong ứng dụng để xem hướng dẫn (Chia sẻ → Thêm vào MH chính).

---

## 4. Chạy Local Development

```bash
cp .env.example .env.local
# Điền thông số Firebase vào .env.local
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.
