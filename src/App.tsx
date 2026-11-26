/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import {DataProvider} from './contexts/DataContext';
import {ToastProvider} from './contexts/ToastContext';
import {ErrorBoundary} from './components/ErrorBoundary';
import {Layout} from './components/Layout';
import {AdminRoute} from './components/AdminRoute';

import {RecipesPage} from './pages/RecipesPage';
import {RecipeDetailPage} from './pages/RecipeDetailPage';
import {RecipeFormPage} from './pages/RecipeFormPage';
import {CategoriesPage} from './pages/CategoriesPage';
import {NotesPage} from './pages/NotesPage';
import {NoteDetailPage} from './pages/NoteDetailPage';
import {NoteFormPage} from './pages/NoteFormPage';
import {LoginPage} from './pages/LoginPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <DataProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<Layout />}>
                  <Route index element={<Navigate to="/recipes" replace />} />

                  <Route path="/recipes" element={<RecipesPage />} />
                  <Route
                    path="/recipes/new"
                    element={
                      <AdminRoute>
                        <RecipeFormPage />
                      </AdminRoute>
                    }
                  />
                  <Route path="/recipes/:id" element={<RecipeDetailPage />} />
                  <Route
                    path="/recipes/:id/edit"
                    element={
                      <AdminRoute>
                        <RecipeFormPage />
                      </AdminRoute>
                    }
                  />

                  <Route path="/categories" element={<CategoriesPage />} />

                  <Route path="/notes" element={<NotesPage />} />
                  <Route
                    path="/notes/new"
                    element={
                      <AdminRoute>
                        <NoteFormPage />
                      </AdminRoute>
                    }
                  />
                  <Route path="/notes/:id" element={<NoteDetailPage />} />
                  <Route
                    path="/notes/:id/edit"
                    element={
                      <AdminRoute>
                        <NoteFormPage />
                      </AdminRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
