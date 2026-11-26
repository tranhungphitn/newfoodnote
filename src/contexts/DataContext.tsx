import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import {subscribeCategories} from '../services/categoryService';
import {subscribeNotes} from '../services/noteService';
import {subscribeRecipes} from '../services/recipeService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import type {Category, Note, Recipe} from '../types/models';

interface DataContextValue {
  recipes: Recipe[];
  categories: Category[];
  notes: Note[];
  categoryMap: Map<string, Category>;
  loadingRecipes: boolean;
  loadingCategories: boolean;
  loadingNotes: boolean;
  recipesError: string | null;
  categoriesError: string | null;
  notesError: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export const DataProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [recipesError, setRecipesError] = useState<string | null>(null);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);

  useEffect(() => {
    const unsubRecipes = subscribeRecipes(
      (data) => {
        setRecipes(data);
        setRecipesError(null);
        setLoadingRecipes(false);
      },
      (err) => {
        setRecipesError(getFriendlyErrorMessage(err, 'Không thể tải danh sách công thức.'));
        setLoadingRecipes(false);
      }
    );

    const unsubCategories = subscribeCategories(
      (data) => {
        setCategories(data);
        setCategoriesError(null);
        setLoadingCategories(false);
      },
      (err) => {
        setCategoriesError(getFriendlyErrorMessage(err, 'Không thể tải danh mục món ăn.'));
        setLoadingCategories(false);
      }
    );

    const unsubNotes = subscribeNotes(
      (data) => {
        setNotes(data);
        setNotesError(null);
        setLoadingNotes(false);
      },
      (err) => {
        setNotesError(getFriendlyErrorMessage(err, 'Không thể tải danh sách ghi chú.'));
        setLoadingNotes(false);
      }
    );

    return () => {
      unsubRecipes();
      unsubCategories();
      unsubNotes();
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const value = useMemo<DataContextValue>(
    () => ({
      recipes,
      categories,
      notes,
      categoryMap,
      loadingRecipes,
      loadingCategories,
      loadingNotes,
      recipesError,
      categoriesError,
      notesError,
    }),
    [
      recipes,
      categories,
      notes,
      categoryMap,
      loadingRecipes,
      loadingCategories,
      loadingNotes,
      recipesError,
      categoriesError,
      notesError,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used inside DataProvider');
  }
  return ctx;
}
