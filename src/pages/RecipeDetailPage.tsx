import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
  ArrowLeft,
  ChefHat,
  Heart,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useData} from '../contexts/DataContext';
import {useToast} from '../contexts/ToastContext';
import {deleteRecipe, getRecipeById, toggleRecipeFavorite} from '../services/recipeService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {getCategoryAccent} from '../lib/accentPalette';
import {type Recipe} from '../types/models';
import {RecipeImage} from '../components/RecipeImage';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {EmptyState} from '../components/EmptyState';

export const RecipeDetailPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {isAdmin} = useAuth();
  const {recipes, categoryMap, loadingRecipes} = useData();
  const {showToast} = useToast();

  const [fetchedRecipe, setFetchedRecipe] = useState<Recipe | null>(null);
  const [fetching, setFetching] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const recipeFromStore = recipes.find((r) => r.id === id) || null;
  const recipe = recipeFromStore || fetchedRecipe;

  useEffect(() => {
    if (!id || recipeFromStore || loadingRecipes) return;
    let active = true;
    setFetching(true);
    getRecipeById(id)
      .then((res) => {
        if (active) setFetchedRecipe(res);
      })
      .catch(() => {
        if (active) setFetchedRecipe(null);
      })
      .finally(() => {
        if (active) setFetching(false);
      });
    return () => {
      active = false;
    };
  }, [id, recipeFromStore, loadingRecipes]);

  const handleToggleFavorite = async () => {
    if (!recipe || !isAdmin || togglingFav) return;
    setTogglingFav(true);
    try {
      const nextVal = !recipe.isFavorite;
      await toggleRecipeFavorite(recipe.id, nextVal);
      if (fetchedRecipe) {
        setFetchedRecipe({...fetchedRecipe, isFavorite: nextVal});
      }
      showToast(
        nextVal ? 'Đã đánh dấu món yêu thích.' : 'Đã bỏ khỏi danh sách yêu thích.',
        'success'
      );
    } catch (error) {
      showToast(getFriendlyErrorMessage(error), 'error');
    } finally {
      setTogglingFav(false);
    }
  };

  const handleDelete = async () => {
    if (!recipe || !isAdmin) return;
    setDeleting(true);
    try {
      await deleteRecipe(recipe);
      showToast(`Đã xóa công thức "${recipe.name}".`, 'success');
      navigate('/recipes', {replace: true});
    } catch (error) {
      showToast(getFriendlyErrorMessage(error, 'Không thể xóa công thức.'), 'error');
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  if (loadingRecipes || fetching) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="space-y-6">
        <Link
          to="/recipes"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-[#52524E] hover:text-[#111110]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại mục lục công thức</span>
        </Link>
        <EmptyState
          icon={<ChefHat className="h-5 w-5" />}
          title="Không tìm thấy công thức"
          description="Công thức này có thể đã bị xóa hoặc đường dẫn không tồn tại."
          actionLabel="Mở mục lục công thức"
          actionTo="/recipes"
        />
      </div>
    );
  }

  const category = categoryMap.get(recipe.categoryId);
  const categoryAccent = getCategoryAccent(recipe.categoryId);

  return (
    <article className="space-y-8 sm:space-y-10">
      {/* Top Breadcrumb + Admin Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E0] pb-4">
        <Link
          to="/recipes"
          className="inline-flex min-h-[40px] items-center gap-2 text-xs font-semibold text-[#52524E] hover:text-[#EA580C] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Mục lục công thức</span>
        </Link>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={togglingFav}
              onClick={() => void handleToggleFavorite()}
              aria-label={recipe.isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border px-3.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                recipe.isFavorite
                  ? 'border-[#DC2626] bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                  : 'border-[#E4E4E0] bg-white text-[#111110] hover:border-[#DC2626] hover:text-[#DC2626]'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${recipe.isFavorite ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {recipe.isFavorite ? 'Yêu thích' : 'Đánh dấu'}
              </span>
            </button>

            <Link
              to={`/recipes/${recipe.id}/edit`}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#E4E4E0] bg-white px-3.5 text-xs font-semibold text-[#111110] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>Chỉnh sửa</span>
            </Link>

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              aria-label="Xóa công thức"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-sm border border-[#E4E4E0] bg-white px-3.5 text-xs font-semibold text-[#DC2626] hover:border-[#DC2626] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* COMPACT RECIPE HEADER: NAME + 50% PHOTO + DESCRIPTION                 */}
      {/* ===================================================================== */}
      <header className="space-y-5 sm:space-y-6">
        {/* Dish Title & Category */}
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {category && (
              <Link
                to={`/recipes?category=${category.id}`}
                className={`inline-block text-xs font-bold hover:underline ${categoryAccent.text}`}
              >
                {category.name}
              </Link>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold leading-[1.18] text-[#111110] sm:text-3xl lg:text-[38px]">
            {recipe.name}
          </h1>
        </div>

        {/* 50%-sized Dish Photo + Description & Compact Specs */}
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:gap-7 lg:gap-8">
          <div className="w-1/2 min-w-[160px] max-w-[240px] shrink-0 overflow-hidden border border-[#E4E4E0] bg-[#F7F7F5] sm:w-[240px] sm:max-w-none md:w-[280px] lg:w-[320px]">
            <RecipeImage
              src={recipe.coverImage}
              alt={recipe.name}
              priority
              className="aspect-[4/3] w-full"
            />
          </div>

          <div className="flex min-w-0 w-full flex-1 flex-col justify-between gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#EA580C]">
                Mô tả món ăn
              </p>
              {recipe.description?.trim() ? (
                <p className="mt-2 border-l-2 border-[#EA580C] pl-3.5 text-[15px] leading-[1.75] text-[#111110] whitespace-pre-wrap">
                  {recipe.description}
                </p>
              ) : (
                <p className="mt-2 border-l-2 border-[#E4E4E0] pl-3.5 text-sm italic text-[#787872]">
                  Chưa có mô tả cho món ăn này.
                  {isAdmin && (
                    <>
                      {' '}
                      <Link
                        to={`/recipes/${recipe.id}/edit`}
                        className="not-italic font-semibold text-[#1D4ED8] hover:underline"
                      >
                        Thêm mô tả
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* COOKBOOK TWO-COLUMN SPREAD: INGREDIENTS & METHOD (NO CHECKBOXES)      */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 gap-8 border-t-2 border-[#111110] pt-8 sm:gap-10 sm:pt-10 lg:grid-cols-12 lg:gap-12">
        {/* Left: Structured Ingredients Specification Table (Orange + Blue Contrast) */}
        <section className="lg:col-span-5">
          <div className="border border-[#E4E4E0] border-t-2 border-t-[#EA580C] bg-[#FAFAF8]">
            <div className="flex items-baseline justify-between gap-3 border-b border-[#E4E4E0] bg-[#FFF7ED]/70 px-4 py-3.5 sm:px-5 sm:py-4">
              <h2 className="font-display text-lg font-bold text-[#111110] sm:text-xl">
                Nguyên liệu
              </h2>
              <span className="text-xs font-bold tabular-nums text-[#EA580C]">
                {String(recipe.ingredients.length).padStart(2, '0')} mục
              </span>
            </div>

            {recipe.ingredients.length > 0 ? (
              <ul className="divide-y divide-[#E4E4E0]">
                {recipe.ingredients.map((ing, index) => (
                  <li
                    key={`${ing.name}-${index}`}
                    className="flex items-baseline justify-between gap-3 px-4 py-3 odd:bg-white even:bg-[#F7F7F5]/75 sm:px-5 sm:py-3.5"
                  >
                    <div className="flex min-w-0 items-baseline gap-2.5 sm:gap-3">
                      <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-[#EA580C]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium leading-snug text-[#111110]">
                        {ing.name}
                      </span>
                    </div>
                    {ing.quantity && (
                      <span className="shrink-0 text-right text-xs font-bold tabular-nums text-[#1D4ED8]">
                        {ing.quantity}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-[#787872] sm:px-5">
                Chưa có danh sách nguyên liệu.
              </p>
            )}
          </div>
        </section>

        {/* Right: Method Steps (Blue Index Markers + Clear Prose) */}
        <section className="lg:col-span-7">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#1D4ED8] pb-3.5">
            <h2 className="font-display text-xl font-bold text-[#111110] sm:text-2xl">
              Phương pháp chế biến
            </h2>
            <span className="text-xs font-bold tabular-nums text-[#1D4ED8]">
              {String(recipe.cookingSteps.length).padStart(2, '0')} bước
            </span>
          </div>

          {recipe.cookingSteps.length > 0 ? (
            <ol className="mt-4 divide-y divide-[#E4E4E0]">
              {recipe.cookingSteps.map((item, idx) => {
                const stepNum = String(item.step || idx + 1).padStart(2, '0');
                return (
                  <li
                    key={`${stepNum}-${idx}`}
                    className="flex items-start gap-4 py-6 first:pt-3 sm:gap-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#111110] text-sm font-bold tabular-nums text-white">
                      {stepNum}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-xs font-bold text-[#1D4ED8]">Bước {stepNum}</p>
                      <p className="mt-1.5 max-w-[65ch] text-[15px] leading-[1.8] text-[#111110] whitespace-pre-wrap">
                        {item.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-6 text-sm text-[#787872]">Chưa có hướng dẫn các bước nấu.</p>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Xóa công thức này?"
        description={`Công thức "${recipe.name}" cùng hình ảnh đã tải lên sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        confirmLabel="Xóa công thức"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </article>
  );
};
