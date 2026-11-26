import React, {useEffect, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {ArrowLeft, Loader2} from 'lucide-react';
import {useToast} from '../contexts/ToastContext';
import {createNote, getNoteById, updateNote} from '../services/noteService';
import {getFriendlyErrorMessage} from '../lib/firestoreError';
import {VALIDATION_LIMITS} from '../types/models';

export const NoteFormPage: React.FC = () => {
  const {id} = useParams<{id: string}>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const {showToast} = useToast();

  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoadingInitial(true);
    getNoteById(id)
      .then((note) => {
        if (!active) return;
        if (!note) {
          showToast('Không tìm thấy ghi chú để chỉnh sửa.', 'error');
          navigate('/notes', {replace: true});
          return;
        }
        setTitle(note.title);
        setContent(note.content);
      })
      .catch((error) => {
        if (!active) return;
        showToast(getFriendlyErrorMessage(error, 'Không thể tải ghi chú.'), 'error');
        navigate('/notes', {replace: true});
      })
      .finally(() => {
        if (active) setLoadingInitial(false);
      });
    return () => {
      active = false;
    };
  }, [id, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Vui lòng nhập tiêu đề ghi chú.');
      return;
    }

    setSubmitting(true);
    try {
      let savedId = id || '';
      if (isEditing && id) {
        await updateNote(id, {title, content});
        showToast('Đã cập nhật ghi chú thành công.', 'success');
      } else {
        savedId = await createNote({title, content});
        showToast('Đã thêm ghi chú mới thành công.', 'success');
      }
      navigate(`/notes/${savedId}`, {replace: true});
    } catch (error) {
      const msg = getFriendlyErrorMessage(error, 'Không thể lưu ghi chú.');
      setFormError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-7 sm:space-y-8">
      <header className="border-b-2 border-[#1D4ED8] pb-4">
        <Link
          to={isEditing && id ? `/notes/${id}` : '/notes'}
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-semibold text-[#52524E] hover:text-[#1D4ED8] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại</span>
        </Link>

        <h1 className="mt-1 font-display text-2xl font-bold text-[#111110] sm:text-4xl">
          {isEditing ? 'Chỉnh sửa ghi chú' : 'Viết ghi chú mới'}
        </h1>
      </header>

      {formError && (
        <div
          role="alert"
          className="border border-[#DC2626]/30 bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#991B1B]"
        >
          {formError}
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="w-full space-y-6">
        <div>
          <label htmlFor="note-title" className="block text-xs font-semibold text-[#111110]">
            Tiêu đề <span className="text-[#DC2626]">*</span>
          </label>
          <input
            id="note-title"
            type="text"
            required
            maxLength={VALIDATION_LIMITS.NOTE_TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Tỉ lệ pha nước chấm chuẩn vị"
            className="mt-2 h-12 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] px-4 text-base font-medium text-[#111110] placeholder:font-normal placeholder:text-[#787872] focus:border-[#1D4ED8] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="note-content" className="block text-xs font-semibold text-[#111110]">
              Nội dung ghi chú
            </label>
            <span className="text-[11px] font-semibold tabular-nums text-[#787872]">
              {content.length.toLocaleString('vi-VN')} /{' '}
              {VALIDATION_LIMITS.NOTE_CONTENT_MAX.toLocaleString('vi-VN')}
            </span>
          </div>
          <textarea
            id="note-content"
            rows={16}
            maxLength={VALIDATION_LIMITS.NOTE_CONTENT_MAX}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết nội dung ghi chú, tỉ lệ pha chế, kinh nghiệm nấu ăn hoặc mẹo bảo quản tại đây..."
            className="mt-2 min-h-[300px] w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] p-4 text-base leading-[1.8] text-[#111110] placeholder:text-[#787872] focus:border-[#1D4ED8] focus:bg-white focus:outline-none transition-colors sm:min-h-[400px] sm:text-[15px]"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E4E4E0] pt-6 sm:flex-row sm:justify-end">
          <Link
            to={isEditing && id ? `/notes/${id}` : '/notes'}
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-sm border border-[#E4E4E0] bg-white px-6 text-sm font-semibold text-[#111110] hover:border-[#111110] transition-colors sm:w-auto sm:text-xs"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-sm bg-[#1D4ED8] px-8 text-sm font-semibold text-white hover:bg-[#1E40AF] disabled:opacity-60 transition-colors sm:w-auto sm:text-xs"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isEditing ? 'Cập nhật ghi chú' : 'Lưu ghi chú'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
