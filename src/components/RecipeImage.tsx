import React, {useState} from 'react';
import {UtensilsCrossed} from 'lucide-react';

export const DEFAULT_RECIPE_IMAGE = '/src/assets/images/default_recipe_dish_1795656762193.jpg';

interface RecipeImageProps {
  src?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const RecipeImage: React.FC<RecipeImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [placeholderFailed, setPlaceholderFailed] = useState(false);

  const trimmedSrc = src?.trim() || '';
  const hasCustomSrc = Boolean(trimmedSrc.length > 0 && failedSrc !== trimmedSrc);
  const activeSrc = hasCustomSrc ? trimmedSrc : DEFAULT_RECIPE_IMAGE;

  if (!hasCustomSrc && placeholderFailed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#F7F7F5] text-[#787872] ${className}`}
        aria-label={alt}
      >
        <UtensilsCrossed className="h-6 w-6 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => {
        if (hasCustomSrc) {
          setFailedSrc(trimmedSrc);
        } else {
          setPlaceholderFailed(true);
        }
      }}
      className={`object-cover ${className}`}
    />
  );
};
