import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, FileText, Loader2, Pencil, Trash2} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useData} from '../contexts/DataContext';
import {useToast} from '../contexts/ToastContext';
import {deleteNote, getNoteById} from '../services/noteService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {formatTimestamp, type Note} from '../types/models';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {EmptyState} from '../components/EmptyState';

export const NoteDetailPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const navigate = useNavigate();
  const {isAdmin} = useAuth();
  const {notes, loadingNotes} = useData();
  const {showToast} = useToast();

  const [fetchedNote, setFetchedNote] = useState<Note | null>(null);
  const [fetching, setFetching] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const noteFromStore = notes.find((n) => n.id === id) || null;
  const note = noteFromStore || fetchedNote;

  useEffect(() => {
    if (!id || noteFromStore || loadingNotes) return;
    let active = true;
    setFetching(true);
    getNoteById(id)
      .then((res) => {
        if (active) setFetchedNote(res);
      })
      .catch(() => {
        if (active) setFetchedNote(null);
      })
      .finally(() => {
        if (active) setFetching(false);
      });
    return () => {
      active = false;
    };
  }, [id, noteFromStore, loadingNotes]);

  const handleDelete = async () => {
    if (!note || !isAdmin) return;
    setDeleting(true);
    try {
      await deleteNote(note.id);
      showToast(`Đã xóa ghi chú "${note.title}".`, 'success');
      navigate('/notes', {replace: true});
    } catch (error) {
      showToast(getFriendlyErrorMessage(error, 'Không thể xóa ghi chú.'), 'error');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loadingNotes || fetching) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#111110]" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-6">
        <Link
          to="/notes"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#52524E] hover:text-[#111110]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại sổ ghi chú</span>
        </Link>
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Không tìm thấy ghi chú"
          description="Ghi chú này có thể đã bị xóa hoặc đường dẫn không hợp lệ."
          actionLabel="Mở sổ ghi chú"
          actionTo="/notes"
        />
      </div>
    );
  }

  return (
    <article className="w-full space-y-8 sm:space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E0] pb-4">
        <Link
          to="/notes"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-[#52524E] hover:text-[#1D4ED8] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Sổ ghi chép</span>
        </Link>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              to={`/notes/${note.id}/edit`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-[#E4E4E0] bg-white px-3.5 text-xs font-semibold text-[#111110] hover:border-[#1D4ED8] hover:text-[#1D4ED8] transition-colors whitespace-nowrap"
            >
              <Pencil className="h-3.5 w-3.5 text-[#1D4ED8]" />
              <span>Chỉnh sửa</span>
            </Link>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              aria-label="Xóa ghi chú"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-sm border border-[#E4E4E0] bg-white px-3.5 text-xs font-semibold text-[#DC2626] hover:border-[#DC2626] hover:bg-[#FEF2F2] transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Xóa</span>
            </button>
          </div>
        )}
      </div>

      <header className="border-b-2 border-[#1D4ED8] pb-6 sm:pb-7">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-[#1D4ED8] tabular-nums">
          <span>Tạo ngày {formatTimestamp(note.createdAt)}</span>
          <span aria-hidden="true" className="text-[#C7C7C2]">/</span>
          <span className="text-[#787872] font-medium">Cập nhật {formatTimestamp(note.updatedAt)}</span>
        </div>
        <h1 className="mt-3 font-display text-2xl font-bold leading-[1.2] text-[#111110] sm:text-4xl">
          {note.title}
        </h1>
      </header>

      <div className="w-full border border-[#E4E4E0] bg-[#FAFAF8]/60 p-5 text-[15px] leading-[1.9] text-[#111110] whitespace-pre-wrap sm:p-8 sm:text-base">
        {note.content || 'Ghi chú chưa có nội dung.'}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa ghi chú này?"
        description={`Ghi chú "${note.title}" sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        confirmLabel="Xóa ghi chú"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmOpen(false)}
      />
    </article>
  );
};
