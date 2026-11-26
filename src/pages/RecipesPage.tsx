import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {AlertCircle, ChefHat, Heart, Plus, RotateCcw, Search, X} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useData} from '../contexts/DataContext';
import {useToast} from '../contexts/ToastContext';
import {toggleRecipeFavorite} from '../services/recipeService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {getCategoryAccent} from '../lib/accentPalette';
import {matchesVietnameseQuery} from '../lib/vietnameseSearch';
import type {Recipe, RecipeFrequency} from '../types/models';
import {RecipeCard} from '../components/RecipeCard';
import {EmptyState} from '../components/EmptyState';
import {PageBanner} from '../components/PageBanner';
import {RecipeGridSkeleton} from '../components/Skeletons';
import {Pagination} from '../components/Pagination';

type FrequencyFilter = 'all' | RecipeFrequency;

const ITEMS_PER_PAGE = 12;

export const RecipesPage: React.FC = () => {
  const {isAdmin} = useAuth();
  const {recipes, categories, categoryMap, loadingRecipes, recipesError} = useData();
  const {showToast} = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const urlQuery = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'all';
  const frequencyFilter = (searchParams.get('frequency') as FrequencyFilter) || 'all';
  const onlyFavorites = searchParams.get('favorite') === 'true';
  const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const urlPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  // Dedicated local input state + IME composition guard so Vietnamese Telex/VNI typing is never interrupted
  const [searchInput, setSearchInput] = useState(urlQuery);
  const isComposingRef = useRef(false);
  const lastSyncedQueryRef = useRef(urlQuery);
  const syncTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (urlQuery !== lastSyncedQueryRef.current) {
      lastSyncedQueryRef.current = urlQuery;
      setSearchInput(urlQuery);
    }
  }, [urlQuery]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const scheduleUrlQuerySync = (value: string) => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      if (isComposingRef.current) return;
      if (value === lastSyncedQueryRef.current) return;
      lastSyncedQueryRef.current = value;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value.trim()) {
            next.delete('q');
          } else {
            next.set('q', value);
          }
          next.delete('page');
          return next;
        },
        {replace: true}
      );
    }, 350);
  };

  const updateParam = (key: string, value: string | null, resetPage = true) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!value || value === 'all' || value === 'false' || (key === 'page' && value === '1')) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
        if (resetPage && key !== 'page') {
          next.delete('page');
        }
        return next;
      },
      {replace: true}
    );
  };

  const resetFilters = () => {
    lastSyncedQueryRef.current = '';
    setSearchInput('');
    setSearchParams({}, {replace: true});
  };

  const clearSearch = () => {
    lastSyncedQueryRef.current = '';
    setSearchInput('');
    updateParam('q', null);
  };

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    selectedCategory !== 'all' ||
    frequencyFilter !== 'all' ||
    onlyFavorites;

  // Live recipe count per category (respecting current search, frequency, and favorite filters)
  const categoryCounts = useMemo(() => {
    const query = searchInput.trim();
    const counts = new Map<string, number>();
    let totalMatching = 0;

    for (const recipe of recipes) {
      if (frequencyFilter !== 'all' && recipe.frequency !== frequencyFilter) continue;
      if (onlyFavorites && !recipe.isFavorite) continue;
      if (query) {
        const nameMatch = matchesVietnameseQuery(recipe.name, query);
        const descMatch = matchesVietnameseQuery(recipe.description, query);
        const ingredientMatch = recipe.ingredients.some((ing) =>
          matchesVietnameseQuery(ing.name, query)
        );
        const catName = categoryMap.get(recipe.categoryId)?.name || '';
        const catMatch = matchesVietnameseQuery(catName, query);
        if (!nameMatch && !descMatch && !ingredientMatch && !catMatch) continue;
      }
      totalMatching += 1;
      if (recipe.categoryId) {
        counts.set(recipe.categoryId, (counts.get(recipe.categoryId) || 0) + 1);
      }
    }

    return {counts, totalMatching};
  }, [recipes, frequencyFilter, onlyFavorites, searchInput, categoryMap]);

  const filteredRecipes = useMemo(() => {
    const query = searchInput.trim();

    return recipes.filter((recipe) => {
      if (selectedCategory !== 'all' && recipe.categoryId !== selectedCategory) {
        return false;
      }
      if (frequencyFilter !== 'all' && recipe.frequency !== frequencyFilter) {
        return false;
      }
      if (onlyFavorites && !recipe.isFavorite) {
        return false;
      }
      if (query) {
        const nameMatch = matchesVietnameseQuery(recipe.name, query);
        const descMatch = matchesVietnameseQuery(recipe.description, query);
        const ingredientMatch = recipe.ingredients.some((ing) =>
          matchesVietnameseQuery(ing.name, query)
        );
        const catName = categoryMap.get(recipe.categoryId)?.name || '';
        const catMatch = matchesVietnameseQuery(catName, query);
        if (!nameMatch && !descMatch && !ingredientMatch && !catMatch) {
          return false;
        }
      }
      return true;
    });
  }, [recipes, selectedCategory, frequencyFilter, onlyFavorites, searchInput, categoryMap]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(urlPage, totalPages);

  const paginatedRecipes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecipes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecipes, currentPage]);

  const handlePageChange = (nextPage: number) => {
    updateParam('page', String(nextPage), false);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

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
    <div className="space-y-6 sm:space-y-8">
      {/* Full-Width Culinary Recipes Banner */}
      <PageBanner
        src="/src/assets/images/banner_recipes_ribbon_1795656758575.jpg"
        alt="Chảo gang, gia vị cay, hành lá, tỏi và thảo mộc nấu ăn"
        accent="orange"
      />

      {/* Editorial Directory Masthead */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#EA580C] pb-4 sm:pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#111110] sm:text-4xl">
            Món ăn
          </h1>
        </div>

        {isAdmin && (
          <Link
            to="/recipes/new"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm bg-[#EA580C] px-4 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0 sm:px-5"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm món ăn</span>
          </Link>
        )}
      </header>

      {/* Mobile-First Search, Frequency & Category Filter Panel */}
      <div className="space-y-4 border-b border-[#E4E4E0] pb-5">
        {/* Row 1: Search + Frequency + Favorite (stacked cleanly on mobile, inline on lg) */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-lg">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#787872]" />
            <input
              type="text"
              inputMode="search"
              autoComplete="off"
              spellCheck={false}
              value={searchInput}
              onCompositionStart={() => {
                isComposingRef.current = true;
                if (syncTimerRef.current !== null) {
                  window.clearTimeout(syncTimerRef.current);
                }
              }}
              onCompositionEnd={(e) => {
                isComposingRef.current = false;
                const val = e.currentTarget.value;
                setSearchInput(val);
                scheduleUrlQuerySync(val);
              }}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                if (!isComposingRef.current) {
                  scheduleUrlQuerySync(val);
                }
              }}
              placeholder="Tìm tên món, nguyên liệu, danh mục..."
              aria-label="Tìm kiếm công thức"
              className="h-11 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] pl-10 pr-10 text-sm text-[#111110] placeholder:text-[#787872] focus:border-[#EA580C] focus:bg-white focus:outline-none transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Xóa từ khóa"
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#787872] hover:text-[#111110]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Lọc theo tần suất"
              className="grid flex-1 grid-cols-3 border border-[#E4E4E0] bg-[#F7F7F5] p-0.5 sm:inline-flex sm:flex-none"
            >
              {(
                [
                  {value: 'all', label: 'Tất cả', activeClass: 'bg-[#111110] text-white'},
                  {value: 'regular', label: 'Thường ăn', activeClass: 'bg-[#047857] text-white'},
                  {value: 'occasional', label: 'Ít ăn', activeClass: 'bg-[#EA580C] text-white'},
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateParam('frequency', option.value)}
                  className={`min-h-[40px] px-2.5 text-xs font-semibold transition-colors whitespace-nowrap sm:px-3.5 ${
                    frequencyFilter === option.value
                      ? option.activeClass
                      : 'text-[#52524E] hover:text-[#111110]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => updateParam('favorite', onlyFavorites ? null : 'true')}
              aria-pressed={onlyFavorites}
              aria-label="Chỉ xem món yêu thích"
              className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-sm border px-3 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 sm:px-3.5 ${
                onlyFavorites
                  ? 'border-[#DC2626] bg-[#DC2626] text-white'
                  : 'border-[#E4E4E0] bg-white text-[#52524E] hover:border-[#DC2626] hover:text-[#DC2626]'
              }`}
            >
              <Heart className={`h-4 w-4 ${onlyFavorites ? 'fill-current' : ''}`} />
              <span className="hidden xs:inline sm:inline">Yêu thích</span>
            </button>
          </div>
        </div>

        {/* Row 2: Optimized Category Selector (All visible at a glance on mobile & desktop) */}
        {categories.length > 0 && (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#52524E]">
                Lọc theo danh mục
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-[#DC2626] hover:underline whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Đặt lại bộ lọc</span>
                </button>
              )}
            </div>

            <div
              role="group"
              aria-label="Danh mục món ăn"
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2"
            >
              <button
                type="button"
                onClick={() => updateParam('category', 'all')}
                aria-pressed={selectedCategory === 'all'}
                className={`flex min-h-[42px] items-center justify-between gap-2 rounded-sm border px-3 text-left text-xs font-semibold transition-colors sm:min-h-[40px] sm:justify-start sm:px-3.5 ${
                  selectedCategory === 'all'
                    ? 'border-[#111110] bg-[#111110] text-white'
                    : 'border-[#E4E4E0] bg-white text-[#111110] hover:border-[#111110]'
                }`}
              >
                <span className="truncate">Tất cả</span>
                <span
                  className={`tabular-nums text-[11px] font-bold shrink-0 ${
                    selectedCategory === 'all' ? 'text-white/80' : 'text-[#787872]'
                  }`}
                >
                  {categoryCounts.totalMatching}
                </span>
              </button>

              {categories.map((cat) => {
                const accent = getCategoryAccent(cat.id);
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts.counts.get(cat.id) || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateParam('category', cat.id)}
                    aria-pressed={isSelected}
                    className={`flex min-h-[42px] items-center justify-between gap-2 rounded-sm border px-3 text-left text-xs font-semibold transition-colors sm:min-h-[40px] sm:justify-start sm:px-3.5 ${
                      isSelected
                        ? accent.activeButton
                        : `border-[#E4E4E0] bg-white text-[#111110] hover:border-[#111110]`
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`tabular-nums text-[11px] font-bold shrink-0 ${
                        isSelected ? 'text-white/85' : accent.text
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {recipesError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-[#DC2626]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{recipesError}</p>
        </div>
      )}

      {loadingRecipes ? (
        <RecipeGridSkeleton count={8} />
      ) : paginatedRecipes.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-6 sm:gap-y-9 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedRecipes.map((recipe, idx) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                category={categoryMap.get(recipe.categoryId)}
                indexNumber={(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                isAdmin={isAdmin}
                onToggleFavorite={handleToggleFavorite}
                togglingFavorite={togglingId === recipe.id}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredRecipes.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="công thức"
            accent="orange"
            onPageChange={handlePageChange}
          />
        </>
      ) : hasActiveFilters ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Không tìm thấy công thức phù hợp"
          description="Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc đang chọn."
          actionLabel="Đặt lại bộ lọc"
          onAction={resetFilters}
        />
      ) : (
        <EmptyState
          icon={<ChefHat className="h-5 w-5" />}
          title="Chưa có công thức nào"
          description={
            isAdmin
              ? 'Hãy thêm món ăn đầu tiên cùng nguyên liệu và hướng dẫn các bước chế biến.'
              : 'Mục lục hiện chưa có công thức nào.'
          }
          actionLabel={isAdmin ? 'Thêm công thức đầu tiên' : undefined}
          actionTo={isAdmin ? '/recipes/new' : undefined}
        />
      )}
    </div>
  );
};
