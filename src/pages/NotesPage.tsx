import React, {useMemo, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useData} from '../contexts/DataContext';
import {formatRelativeDate} from '../types/models';
import {matchesVietnameseQuery} from '../lib/vietnameseSearch';
import {EmptyState} from '../components/EmptyState';
import {PageBanner} from '../components/PageBanner';
import {NoteListSkeleton} from '../components/Skeletons';
import {Pagination} from '../components/Pagination';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {deleteNote} from '../services/noteService';

const ITEMS_PER_PAGE = 12;

export const NotesPage: React.FC = () => {
  const {isAdmin} = useAuth();
  const {notes, loadingNotes, notesError} = useData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [queryText, setQueryText] = useState('');
  const isComposingRef = useRef(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{id: string; title: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rawPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const urlPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const setPageParam = (page: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page <= 1) {
          next.delete('page');
        } else {
          next.set('page', String(page));
        }
        return next;
      },
      {replace: true}
    );
  };

  const handleQueryChange = (value: string) => {
    setQueryText(value);
    if (!isComposingRef.current && urlPage !== 1) {
      setPageParam(1);
    }
  };

  const filteredNotes = useMemo(() => {
    const q = queryText.trim();
    if (!q) return notes;
    return notes.filter(
      (note) =>
        matchesVietnameseQuery(note.title, q) || matchesVietnameseQuery(note.content, q)
    );
  }, [notes, queryText]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(urlPage, totalPages);

  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotes, currentPage]);

  const handlePageChange = (nextPage: number) => {
    setPageParam(nextPage);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteNote(deleteTarget.id);
    } catch {
      // Error handled by service layer
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageBanner
        src="/src/assets/images/banner_notes_ribbon_1795656760743.jpg"
        alt="Sổ ghi chép nấu ăn, bút đen, tách gốm xanh và muỗng đong gia vị"
        accent="blue"
      />

      <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-[#1D4ED8] pb-4 sm:pb-5">
        <div>
          <p className="text-xs font-bold text-[#1D4ED8] tabular-nums">
            {loadingNotes
              ? 'Đang tải...'
              : `${String(filteredNotes.length).padStart(2, '0')} / ${String(notes.length).padStart(2, '0')} ghi chú`}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#111110] sm:mt-1.5 sm:text-4xl">
            Sổ ghi chép bếp
          </h1>
        </div>

        {isAdmin && (
          <Link
            to="/notes/new"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm bg-[#1D4ED8] px-4 text-xs font-semibold text-white hover:bg-[#1E40AF] transition-colors whitespace-nowrap shrink-0 sm:px-5"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm ghi chú</span>
          </Link>
        )}
      </header>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-lg">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#787872]" />
          <input
            type="text"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            value={queryText}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              handleQueryChange(e.currentTarget.value);
            }}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc nội dung ghi chú..."
            aria-label="Tìm ghi chú"
            className="h-11 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] pl-10 pr-10 text-base text-[#111110] placeholder:text-[#787872] focus:border-[#1D4ED8] focus:bg-white focus:outline-none transition-colors sm:text-sm"
          />
          {queryText && (
            <button
              type="button"
              onClick={() => handleQueryChange('')}
              aria-label="Xóa từ khóa"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#787872] hover:text-[#111110]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {notesError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-[#DC2626]/30 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{notesError}</p>
        </div>
      )}

      {loadingNotes ? (
        <NoteListSkeleton count={5} />
      ) : paginatedNotes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {paginatedNotes.map((note, idx) => (
              <div
                key={note.id}
                className="group relative flex flex-col justify-between border border-[#E4E4E0] border-t-2 border-t-[#1D4ED8] bg-white p-5 transition-colors hover:border-[#111110] sm:p-6"
              >

                <Link to={`/notes/${note.id}`} className="flex flex-col flex-1">
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                      <span className="font-extrabold text-[#1D4ED8]">
                        {String((currentPage - 1) * ITEMS_PER_PAGE + idx + 1).padStart(2, '0')}
                      </span>
                      {/* Delete button in top-right corner */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteTarget({id: note.id, title: note.title});
                          }}
                          aria-label={`Xóa ghi chú "${note.title}"`}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[#787872] transition-all hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <h2 className="mt-3 font-display line-clamp-2 text-lg font-bold leading-snug text-[#111110] group-hover:text-[#1D4ED8] transition-colors">
                      {note.title}
                    </h2>

                    <p className="mt-2.5 line-clamp-4 text-sm leading-relaxed text-[#52524E] whitespace-pre-line">
                      {note.content || 'Ghi chú chưa có nội dung.'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#E4E4E0] pt-3.5 text-xs">
                    <span className="text-[#787872]">{formatRelativeDate(note.updatedAt)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-[#111110] group-hover:text-[#1D4ED8] transition-colors">
                      <span>Đọc ghi chú</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredNotes.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="ghi chú"
            accent="blue"
            onPageChange={handlePageChange}
          />
        </>
      ) : queryText.trim() ? (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="Không tìm thấy ghi chú phù hợp"
          description="Không có ghi chú nào khớp với từ khóa bạn vừa nhập."
          actionLabel="Xóa tìm kiếm"
          onAction={() => handleQueryChange('')}
        />
      ) : (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Chưa có ghi chú nào"
          description={
            isAdmin
              ? 'Ghi lại bí quyết nêm nếm, tỉ lệ pha chế hoặc kinh nghiệm chọn nguyên liệu tại đây.'
              : 'Hiện chưa có ghi chú nào được đăng tải.'
          }
          actionLabel={isAdmin ? 'Viết ghi chú đầu tiên' : undefined}
          actionTo={isAdmin ? '/notes/new' : undefined}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xóa ghi chú?"
        description={`Bạn có chắc muốn xóa "${deleteTarget?.title ?? ''}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa ghi chú"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
