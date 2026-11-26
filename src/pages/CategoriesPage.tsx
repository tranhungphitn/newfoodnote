import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  FolderOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useData} from '../contexts/DataContext';
import {useToast} from '../contexts/ToastContext';
import {createCategory, deleteCategory, updateCategory} from '../services/categoryService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {getCategoryAccent} from '../lib/accentPalette';
import {VALIDATION_LIMITS, type Category} from '../types/models';
import {EmptyState} from '../components/EmptyState';
import {PageBanner} from '../components/PageBanner';
import {CategoryListSkeleton} from '../components/Skeletons';
import {ConfirmDialog} from '../components/ConfirmDialog';

export const CategoriesPage: React.FC = () => {
  const {isAdmin} = useAuth();
  const {categories, recipes, loadingCategories, categoriesError} = useData();
  const {showToast} = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingTarget, setDeletingTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) {
      if (r.categoryId) {
        counts.set(r.categoryId, (counts.get(r.categoryId) || 0) + 1);
      }
    }
    return counts;
  }, [recipes]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Vui lòng nhập tên danh mục.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {name, description});
        showToast('Đã cập nhật danh mục.', 'success');
      } else {
        await createCategory({name, description});
        showToast('Đã thêm danh mục mới.', 'success');
      }
      setModalOpen(false);
    } catch (error) {
      showToast(getFriendlyErrorMessage(error, 'Không thể lưu danh mục.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeleting(true);
    try {
      await deleteCategory(deletingTarget.id);
      showToast(`Đã xóa danh mục "${deletingTarget.name}".`, 'success');
      setDeletingTarget(null);
    } catch (error) {
      showToast(getFriendlyErrorMessage(error, 'Không thể xóa danh mục.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageBanner
        src="/src/assets/images/banner_categories_ribbon_1795656762959.jpg"
        alt="Các chén gốm nhiều màu sắc đựng nguyên liệu phân loại theo danh mục"
        accent="green"
      />

      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#047857] pb-4 sm:pb-5">
        <div>
          <p className="text-xs font-bold text-[#047857] tabular-nums">
            {loadingCategories ? 'Đang tải...' : `${String(categories.length).padStart(2, '0')} danh mục`}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#111110] sm:mt-1.5 sm:text-4xl">
            Danh mục món ăn
          </h1>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm bg-[#047857] px-4 text-xs font-semibold text-white hover:bg-[#065F46] transition-colors whitespace-nowrap shrink-0 sm:px-5"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm danh mục</span>
          </button>
        )}
      </header>

      {categoriesError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-[#DC2626]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{categoriesError}</p>
        </div>
      )}

      {loadingCategories ? (
        <CategoryListSkeleton count={6} />
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {categories.map((cat, idx) => {
            const recipeCount = countByCategory.get(cat.id) || 0;
            const accent = getCategoryAccent(cat.id);
            return (
              <div
                key={cat.id}
                className={`group flex flex-col justify-between border border-[#E4E4E0] border-t-2 ${accent.topBorder} bg-white p-5 transition-colors hover:border-[#111110] sm:p-6`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-extrabold tabular-nums ${accent.text}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          aria-label={`Sửa danh mục ${cat.name}`}
                          className="flex h-10 w-10 items-center justify-center text-[#787872] hover:text-[#1D4ED8] transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTarget(cat)}
                          aria-label={`Xóa danh mục ${cat.name}`}
                          className="flex h-10 w-10 items-center justify-center text-[#787872] hover:text-[#DC2626] transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/recipes?category=${cat.id}`}
                    className={`mt-3 block font-display text-xl font-bold text-[#111110] transition-colors ${accent.hoverText}`}
                  >
                    {cat.name}
                  </Link>

                  {cat.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#52524E]">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-[#E4E4E0] pt-3.5 text-xs">
                  <span className={`font-bold tabular-nums ${accent.text}`}>
                    {recipeCount} công thức
                  </span>
                  <Link
                    to={`/recipes?category=${cat.id}`}
                    className={`inline-flex items-center gap-1 font-semibold text-[#111110] ${accent.hoverText} transition-colors`}
                  >
                    <span>Mở danh sách</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<FolderOpen className="h-5 w-5" />}
          title="Chưa có danh mục nào"
          description={
            isAdmin
              ? 'Tạo các danh mục món ăn để sắp xếp kho công thức theo nhóm rõ ràng.'
              : 'Hiện chưa có danh mục nào được tạo.'
          }
          actionLabel={isAdmin ? 'Tạo danh mục đầu tiên' : undefined}
          onAction={isAdmin ? openCreateModal : undefined}
        />
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#111110]/50 p-4 backdrop-blur-xs sm:items-center"
          onClick={() => {
            if (!saving) setModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-md border border-[#E5E5E2] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#E5E5E2] pb-3">
              <h2 className="font-display text-2xl font-medium text-[#111110]">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                aria-label="Đóng"
                className="flex h-9 w-9 items-center justify-center text-[#52524E] hover:text-[#111110]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="mt-5 space-y-4">
              <div>
                <label htmlFor="cat-name" className="block text-xs font-semibold text-[#111110]">
                  Tên danh mục <span className="text-[#B91C1C]">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  required
                  maxLength={VALIDATION_LIMITS.CATEGORY_NAME_MAX}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Món chính hàng ngày"
                  className="mt-1.5 h-11 w-full rounded-sm border border-[#E5E5E2] bg-[#F6F6F4] px-3.5 text-sm text-[#111110] placeholder:text-[#8A8A84] focus:border-[#111110] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cat-desc" className="block text-xs font-semibold text-[#111110]">
                  Mô tả ngắn
                </label>
                <textarea
                  id="cat-desc"
                  rows={3}
                  maxLength={VALIDATION_LIMITS.CATEGORY_DESC_MAX}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn về nhóm món ăn..."
                  className="mt-1.5 w-full rounded-sm border border-[#E5E5E2] bg-[#F6F6F4] p-3.5 text-sm text-[#111110] placeholder:text-[#8A8A84] focus:border-[#111110] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="min-h-[44px] rounded-sm border border-[#E5E5E2] bg-white px-4 text-xs font-medium text-[#111110] hover:border-[#111110]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm bg-[#047857] px-5 text-xs font-semibold text-white hover:bg-[#065F46] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editingCategory ? 'Cập nhật' : 'Tạo danh mục'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletingTarget)}
        title="Xóa danh mục này?"
        description={
          deletingTarget
            ? `Danh mục "${deletingTarget.name}" sẽ bị xóa. Các công thức thuộc danh mục này vẫn được giữ nguyên.`
            : ''
        }
        confirmLabel="Xóa danh mục"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeletingTarget(null)}
      />
    </div>
  );
};
