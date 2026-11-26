import React, {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {AlertCircle, ArrowUpRight, ChefHat, FileText} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useData} from '../contexts/DataContext';
import {useToast} from '../contexts/ToastContext';
import {toggleRecipeFavorite} from '../services/recipeService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {formatRelativeDate, formatTimestamp, type Recipe} from '../types/models';
import {RecipeCard} from '../components/RecipeCard';
import {EmptyState} from '../components/EmptyState';
import {PageBanner} from '../components/PageBanner';
import {NoteListSkeleton, RecipeGridSkeleton} from '../components/Skeletons';

export const HomePage: React.FC = () => {
  const {isAdmin} = useAuth();
  const {
    recipes,
    notes,
    categoryMap,
    loadingRecipes,
    loadingNotes,
    recipesError,
    notesError,
  } = useData();
  const {showToast} = useToast();

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const favoriteRecipes = useMemo(
    () => recipes.filter((r) => r.isFavorite).slice(0, 4),
    [recipes]
  );

  const recentRecipes = useMemo(() => recipes.slice(0, 12), [recipes]);
  const recentNotes = useMemo(() => notes.slice(0, 6), [notes]);

  const handleToggleFavorite = async (recipe: Recipe) => {
    if (!isAdmin || togglingId) return;
    setTogglingId(recipe.id);
    try {
      await toggleRecipeFavorite(recipe.id, !recipe.isFavorite);
      showToast(
        !recipe.isFavorite
          ? `Đã thêm "${recipe.name}" vào yêu thích.`
          : `Đã bỏ "${recipe.name}" khỏi yêu thích.`,
        'success'
      );
    } catch (error) {
      showToast(getFriendlyErrorMessage(error), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-9 sm:space-y-12">
      {/* Compact Full-Width Culinary Editorial Banner */}
      <PageBanner
        src="/src/assets/images/overview_culinary_ribbon_1795656429002.jpg"
        alt="Không gian nguyên liệu nấu ăn tươi ngon với cam, thảo mộc và cà chua bi"
        accent="orange"
      />

      {/* Error Banner */}
      {(recipesError || notesError) && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-[#DC2626]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{recipesError || notesError}</p>
        </div>
      )}

      {/* Tier 1: Favorite Curated Selection (Red Accent) */}
      {!loadingRecipes && favoriteRecipes.length > 0 && (
        <section className="space-y-5 sm:space-y-6">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#DC2626] pb-3">
            <div className="flex items-baseline gap-2.5 sm:gap-3">
              <span className="text-xs font-extrabold tabular-nums text-[#DC2626]">01</span>
              <h2 className="font-display text-lg font-bold text-[#111110] sm:text-2xl">
                Tuyển chọn yêu thích
              </h2>
            </div>
            <Link
              to="/recipes?favorite=true"
              className="inline-flex min-h-[40px] items-center gap-1 text-xs font-semibold text-[#111110] hover:text-[#DC2626] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Xem tất cả</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-4">
            {favoriteRecipes.map((recipe, idx) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                category={categoryMap.get(recipe.categoryId)}
                indexNumber={idx + 1}
                isAdmin={isAdmin}
                onToggleFavorite={handleToggleFavorite}
                togglingFavorite={togglingId === recipe.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Tier 2: Latest Recipes Catalogue (Orange Accent) */}
      <section className="space-y-5 sm:space-y-6">
        <div className="flex items-baseline justify-between gap-3 border-b-2 border-[#EA580C] pb-3">
          <div className="flex items-baseline gap-2.5 sm:gap-3">
            <span className="text-xs font-extrabold tabular-nums text-[#EA580C]">
              {favoriteRecipes.length > 0 ? '02' : '01'}
            </span>
            <h2 className="font-display text-lg font-bold text-[#111110] sm:text-2xl">
              Mục lục công thức mới
            </h2>
          </div>
          <Link
            to="/recipes"
            className="inline-flex min-h-[40px] items-center gap-1 text-xs font-semibold text-[#111110] hover:text-[#EA580C] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Tất cả ({recipes.length})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingRecipes ? (
          <RecipeGridSkeleton count={8} />
        ) : recentRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
            {recentRecipes.map((recipe, idx) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                category={categoryMap.get(recipe.categoryId)}
                indexNumber={idx + 1}
                isAdmin={isAdmin}
                onToggleFavorite={handleToggleFavorite}
                togglingFavorite={togglingId === recipe.id}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ChefHat className="h-5 w-5" />}
            title="Chưa có công thức trong mục lục"
            description={
              isAdmin
                ? 'Tạo công thức đầu tiên kèm ảnh món ăn, nguyên liệu và hướng dẫn các bước chế biến.'
                : 'Sổ tay hiện chưa có công thức nào được đăng tải.'
            }
            actionLabel={isAdmin ? 'Thêm công thức đầu tiên' : undefined}
            actionTo={isAdmin ? '/recipes/new' : undefined}
          />
        )}
      </section>

      {/* Tier 3: Ruled Broadsheet Notes Index (Blue Accent) */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between gap-4 border-b-2 border-[#1D4ED8] pb-3">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-extrabold tabular-nums text-[#1D4ED8]">
              {favoriteRecipes.length > 0 ? '03' : '02'}
            </span>
            <h2 className="font-display text-xl font-bold text-[#111110] sm:text-2xl">
              Sổ ghi chép gần đây
            </h2>
          </div>
          <Link
            to="/notes"
            className="inline-flex min-h-[40px] items-center gap-1 text-xs font-semibold text-[#111110] hover:text-[#1D4ED8] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Tất cả ghi chú ({notes.length})</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loadingNotes ? (
          <NoteListSkeleton count={4} />
        ) : recentNotes.length > 0 ? (
          <div className="divide-y divide-[#E4E4E0] border-b border-[#E4E4E0]">
            {recentNotes.map((note, idx) => (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="group grid grid-cols-1 items-baseline gap-2 py-5 transition-colors hover:bg-[#EFF6FF]/50 md:grid-cols-12 md:gap-6 md:px-3"
              >
                <div className="flex items-center gap-2.5 text-xs font-medium tabular-nums text-[#787872] md:col-span-3">
                  <span className="font-bold text-[#1D4ED8]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span>
                    {formatTimestamp(note.updatedAt)} · {formatRelativeDate(note.updatedAt)}
                  </span>
                </div>
                <div className="md:col-span-8">
                  <h3 className="font-display text-base font-bold text-[#111110] group-hover:text-[#1D4ED8] transition-colors sm:text-lg">
                    {note.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm text-[#52524E]">
                    {note.content || 'Ghi chú chưa có nội dung.'}
                  </p>
                </div>
                <div className="hidden justify-end md:col-span-1 md:flex">
                  <ArrowUpRight className="h-4 w-4 text-[#787872] group-hover:text-[#1D4ED8] transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-5 w-5" />}
            title="Chưa có ghi chú nào"
            description={
              isAdmin
                ? 'Ghi chép mẹo chế biến, tỉ lệ pha chế hoặc lưu ý bảo quản thực phẩm tại đây.'
                : 'Chưa có ghi chú nào được đăng tải.'
            }
            actionLabel={isAdmin ? 'Viết ghi chú đầu tiên' : undefined}
            actionTo={isAdmin ? '/notes/new' : undefined}
          />
        )}
      </section>
    </div>
  );
};
