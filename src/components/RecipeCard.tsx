import React from 'react';
import {Link} from 'react-router-dom';
import {Heart} from 'lucide-react';
import type {Category, Recipe} from '../types/models';
import {getCategoryAccent} from '../lib/accentPalette';
import {RecipeImage} from './RecipeImage';

interface RecipeCardProps {
  recipe: Recipe;
  category?: Category;
  indexNumber?: number;
  isAdmin: boolean;
  onToggleFavorite?: (recipe: Recipe) => void;
  togglingFavorite?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  category,
  indexNumber,
  isAdmin,
  onToggleFavorite,
  togglingFavorite = false,
}) => {
  const formattedIndex =
    typeof indexNumber === 'number' ? String(indexNumber).padStart(2, '0') : null;
  const categoryAccent = getCategoryAccent(recipe.categoryId);

  return (
    <article className="group relative flex flex-col bg-white">
      {/* Sharp Editorial Frame: square on mobile for compact 2-col view, 4:5 gallery portrait on desktop */}
      <div className="relative overflow-hidden border border-[#E4E4E0] bg-[#F7F7F5]">
        <Link
          to={`/recipes/${recipe.id}`}
          className="block aspect-square w-full overflow-hidden sm:aspect-[4/5]"
        >
          <RecipeImage
            src={recipe.coverImage}
            alt={recipe.name}
            className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </Link>

        {/* Crimson Favorite Control */}
        {isAdmin && onToggleFavorite ? (
          <button
            type="button"
            disabled={togglingFavorite}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(recipe);
            }}
            aria-label={recipe.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
            className={`absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-sm backdrop-blur-sm transition-colors sm:top-2.5 sm:right-2.5 ${
              recipe.isFavorite
                ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                : 'bg-white/90 text-[#111110] hover:bg-[#DC2626] hover:text-white'
            }`}
          >
            <Heart className={`h-4 w-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </button>
        ) : recipe.isFavorite ? (
          <span
            aria-label="Món yêu thích"
            className="pointer-events-none absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-sm bg-[#DC2626] text-white sm:top-2.5 sm:right-2.5"
          >
            <Heart className="h-3.5 w-3.5 fill-current" />
          </span>
        ) : null}
      </div>

      {/* Curatorial Caption Area */}
      <Link
        to={`/recipes/${recipe.id}`}
        className="flex flex-1 flex-col border-b border-[#E4E4E0] pt-2.5 pb-3.5 sm:pt-3.5 sm:pb-4"
      >
        <div className="flex items-center justify-between gap-1.5 text-[11px]">
          <span className={`truncate font-bold ${categoryAccent.text}`}>
            {category ? category.name : 'Chưa phân loại'}
          </span>
          {formattedIndex && (
            <span className="hidden font-semibold tabular-nums shrink-0 text-[#787872] sm:inline">
              No. {formattedIndex}
            </span>
          )}
        </div>

        <h3
          className={`mt-1 font-display line-clamp-2 text-[15px] font-bold leading-[1.3] text-[#111110] transition-colors sm:mt-1.5 sm:text-[17px] ${categoryAccent.hoverText}`}
        >
          {recipe.name}
        </h3>

        <div className="mt-auto pt-2 sm:pt-2.5">
          <p className="line-clamp-2 text-[11px] leading-relaxed text-[#52524E] sm:text-xs">
            {recipe.description || 'Chưa có mô tả.'}
          </p>
        </div>
      </Link>
    </article>
  );
};
