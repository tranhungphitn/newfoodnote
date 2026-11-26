import React, {useState} from 'react';
import {Link, Navigate, useLocation, useNavigate} from 'react-router-dom';
import {AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Lock} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useToast} from '../contexts/ToastContext';

export const LoginPage: React.FC = () => {
  const {isAdmin, loading, loginWithPassword} = useAuth();
  const {showToast} = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectTo =
    (location.state as {from?: string} | null)?.from &&
    (location.state as {from?: string}).from !== '/login'
      ? (location.state as {from: string}).from
      : '/';

  if (!loading && isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    try {
      await loginWithPassword(password);
      showToast('Đăng nhập quản trị thành công.', 'success');
      navigate(redirectTo, {replace: true});
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Mật khẩu không chính xác.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between bg-white px-5 py-8 text-[#111110]">
      <div className="mx-auto w-full max-w-[1280px]">
        <Link
          to="/"
          className="inline-flex min-h-[44px] items-center gap-2 text-xs font-medium text-[#52524E] hover:text-[#111110] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại sổ tay</span>
        </Link>
      </div>

      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <div className="border border-[#E4E4E0] border-t-4 border-t-[#EA580C] bg-white p-8 sm:p-10 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-5">
            <div>
              <p className="text-xs font-bold text-[#EA580C]">Quản trị viên</p>
              <h1 className="mt-1 font-display text-2xl font-bold text-[#111110]">
                Đăng nhập
              </h1>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#FFF7ED] text-[#EA580C]">
              <Lock className="h-4 w-4" />
            </span>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2.5 border border-[#DC2626]/30 bg-[#FEF2F2] px-3.5 py-3 text-xs text-[#991B1B]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-[#111110]">
                Mật khẩu
              </label>
              <div className="relative mt-2">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="h-12 w-full rounded-sm border border-[#E4E4E0] bg-[#F7F7F5] pl-3.5 pr-11 text-sm text-[#111110] placeholder:text-[#787872] focus:border-[#EA580C] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-[#52524E] hover:text-[#111110] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#111110] text-xs font-semibold text-white hover:bg-[#EA580C] disabled:opacity-60 transition-colors"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Đăng nhập</span>
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] text-center text-xs text-[#787872]">
        <span className="font-display text-sm font-bold text-[#111110]">
          My Recipe <span className="text-[#EA580C]">&amp;</span> Notes
        </span>
      </div>
    </div>
  );
};
