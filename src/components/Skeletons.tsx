import React from 'react';

export const RecipeGridSkeleton: React.FC<{count?: number}> = ({count = 6}) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({length: count}).map((_, idx) => (
      <div key={idx} className="animate-pulse">
        <div className="aspect-[4/5] w-full bg-[#EFEFEC]" />
        <div className="space-y-2.5 border-b border-[#E5E5E2] pt-3.5 pb-4">
          <div className="h-3 w-1/3 bg-[#EFEFEC]" />
          <div className="h-5 w-4/5 bg-[#E5E5E2]" />
          <div className="h-3 w-1/2 bg-[#F6F6F4]" />
        </div>
      </div>
    ))}
  </div>
);

export const NoteListSkeleton: React.FC<{count?: number}> = ({count = 4}) => (
  <div className="divide-y divide-[#E5E5E2] border-y border-[#E5E5E2]">
    {Array.from({length: count}).map((_, idx) => (
      <div key={idx} className="grid grid-cols-1 gap-3 py-5 md:grid-cols-12 animate-pulse">
        <div className="h-3.5 w-24 bg-[#EFEFEC] md:col-span-3" />
        <div className="space-y-2 md:col-span-9">
          <div className="h-5 w-2/3 bg-[#E5E5E2]" />
          <div className="h-3.5 w-full bg-[#F6F6F4]" />
        </div>
      </div>
    ))}
  </div>
);

export const CategoryListSkeleton: React.FC<{count?: number}> = ({count = 6}) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({length: count}).map((_, idx) => (
      <div key={idx} className="border border-[#E5E5E2] bg-white p-6 animate-pulse space-y-3">
        <div className="h-3 w-10 bg-[#EFEFEC]" />
        <div className="h-5 w-1/2 bg-[#E5E5E2]" />
        <div className="h-3.5 w-4/5 bg-[#F6F6F4]" />
      </div>
    ))}
  </div>
);
