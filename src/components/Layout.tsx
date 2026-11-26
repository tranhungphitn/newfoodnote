import React, {useState} from 'react';
import {Link, NavLink, Outlet, useLocation, useNavigate} from 'react-router-dom';
import {
  ChefHat,
  FileText,
  FolderOpen,

  LogIn,
  LogOut,
  Plus,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {useToast} from '../contexts/ToastContext';
import {PWAInstallButton} from './PWAInstallButton';
import {OfflineIndicator} from './OfflineIndicator';

const NAV_ITEMS = [
  {
    to: '/recipes',
    label: 'Món ăn',
    icon: ChefHat,
    end: false,
    activeDesktop: 'font-semibold text-[#EA580C] after:bg-[#EA580C]',
    activeMobile: 'text-[#FB923C]',
  },
  {
    to: '/notes',
    label: 'Ghi chú',
    icon: FileText,
    end: false,
    activeDesktop: 'font-semibold text-[#1D4ED8] after:bg-[#1D4ED8]',
    activeMobile: 'text-[#60A5FA]',
  },
  {
    to: '/categories',
    label: 'Danh mục',
    icon: FolderOpen,
    end: false,
    activeDesktop: 'font-semibold text-[#047857] after:bg-[#047857]',
    activeMobile: 'text-[#34D399]',
  },
] as const;

export const Layout: React.FC = () => {
  const {isAdmin, logout} = useAuth();
  const {showToast} = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Đã đăng xuất khỏi chế độ quản trị.', 'info');
      navigate('/');
    } catch {
      showToast('Không thể đăng xuất. Vui lòng thử lại.', 'error');
    }
  };

  const isFormPage =
    location.pathname.endsWith('/new') || location.pathname.endsWith('/edit');

  return (
    <div className="flex min-h-dvh flex-col bg-white text-[#111110]">
      {/* Thin Swiss Editorial 4-Color Accent Bar */}
      <div className="grid h-[3px] w-full grid-cols-4" aria-hidden="true">
        <div className="bg-[#111110]" />
        <div className="bg-[#EA580C]" />
        <div className="bg-[#1D4ED8]" />
        <div className="bg-[#DC2626]" />
      </div>

      {/* ===================================================================== */}
      {/* DESKTOP TOP MASTHEAD (Strict 3-Zone Editorial Contract, NO Sidebar)   */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 hidden border-b border-[#E4E4E0] bg-white/95 backdrop-blur-md md:block">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-8 px-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <Link
            to="/"
            className="font-display text-xl font-bold tracking-tight text-[#111110] whitespace-nowrap shrink-0"
          >
            My Recipe <span className="text-[#EA580C]">&amp;</span> Notes
          </Link>

          {/* Zone 2: 4 Clean Single-Line Nav Links with Semantic Accent Underlines */}
          <nav className="flex items-center gap-8" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({isActive}) =>
                  `relative flex h-16 items-center text-sm transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? `${item.activeDesktop} after:absolute after:inset-x-0 after:bottom-0 after:h-[2.5px]`
                      : 'font-medium text-[#52524E] hover:text-[#111110]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Single Primary Action Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton compact />
            {isAdmin ? (
              <>
                <Link
                  to="/recipes/new"
                  className="inline-flex h-10 items-center gap-2 rounded-sm bg-[#EA580C] px-4 text-xs font-semibold text-white hover:bg-[#C2410C] transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Món ăn mới</span>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  aria-label="Đăng xuất"
                  title="Đăng xuất quản trị"
                  className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#E4E4E0] text-[#52524E] hover:border-[#DC2626] hover:text-[#DC2626] transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-10 items-center gap-2 rounded-sm border border-[#111110] px-4 text-xs font-semibold text-[#111110] hover:bg-[#111110] hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Quản trị</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MOBILE COMPACT TOP BAR (52px height)                                  */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 flex h-[52px] items-center justify-between gap-3 border-b border-[#E4E4E0] bg-white/95 px-4 backdrop-blur-md md:hidden">
        <Link
          to="/"
          className="font-display text-lg font-bold tracking-tight text-[#111110] whitespace-nowrap shrink-0"
        >
          My Recipe <span className="text-[#EA580C]">&amp;</span> Notes
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton compact />
          {isAdmin ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Đăng xuất"
              className="flex h-10 w-10 items-center justify-center rounded-sm text-[#52524E] hover:text-[#DC2626]"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          ) : (
            <Link
              to="/login"
              aria-label="Đăng nhập quản trị"
              className="flex h-10 w-10 items-center justify-center rounded-sm text-[#111110] hover:bg-[#F7F7F5]"
            >
              <LogIn className="h-[18px] w-[18px]" />
            </Link>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* MAIN EDITORIAL CANVAS                                                 */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-3.5 py-4 pb-24 sm:px-6 sm:py-6 md:px-8 md:py-10 md:pb-16">
        <Outlet />
      </main>

      {/* Quiet Editorial Footer (Desktop) */}
      <footer className="hidden border-t border-[#E4E4E0] bg-[#F7F7F5]/70 md:block">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-6 text-xs text-[#787872]">
          <span className="font-display text-sm font-bold text-[#111110]">
            My Recipe <span className="text-[#EA580C]">&amp;</span> Notes
          </span>
          <div className="flex items-center gap-6 font-medium">
            <Link to="/recipes" className="hover:text-[#EA580C] transition-colors">
              Món ăn
            </Link>
            <Link to="/notes" className="hover:text-[#1D4ED8] transition-colors">
              Ghi chú
            </Link>
            <Link to="/categories" className="hover:text-[#047857] transition-colors">
              Danh mục
            </Link>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MOBILE FLOATING CARBON DOCK (60px height, integrated Admin Quick-Add) */}
      {/* ===================================================================== */}
      <nav
        aria-label="Điều hướng di động"
        className="fixed bottom-3 left-3 right-3 z-30 md:hidden pb-safe"
      >
        <div
          className={`mx-auto grid h-[60px] max-w-md items-center rounded-2xl bg-[#111110]/95 px-1.5 text-white shadow-xl backdrop-blur-md ${
            isAdmin && !isFormPage ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({isActive}) =>
                  `flex h-full min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                    isActive ? item.activeMobile : 'text-[#9A9A94]'
                  }`
                }
              >
                {({isActive}) => (
                  <>
                    <Icon
                      className={`h-[19px] w-[19px] ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`}
                    />
                    <span
                      className={`text-[10px] leading-none ${
                        isActive ? 'font-semibold' : 'font-normal'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          {isAdmin && !isFormPage && (
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              aria-label="Thêm mới"
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#EA580C] text-white active:scale-95 transition-transform"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Quick-Add Bottom Sheet */}
      {quickAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#111110]/50 backdrop-blur-xs md:hidden"
          onClick={() => setQuickAddOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl border-t border-[#E4E4E0] bg-white px-5 pt-3 pb-8 pb-safe shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D4D4CE]" />
            <div className="flex items-center justify-between border-b border-[#E4E4E0] pb-3">
              <h3 className="font-display text-lg font-bold text-[#111110]">Thêm mục mới</h3>
              <button
                type="button"
                onClick={() => setQuickAddOpen(false)}
                aria-label="Đóng"
                className="flex h-10 w-10 items-center justify-center text-[#52524E]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 divide-y divide-[#E4E4E0]">
              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigate('/recipes/new');
                }}
                className="flex min-h-[60px] w-full items-center gap-4 py-3 text-left active:opacity-75"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#EA580C] text-white">
                  <UtensilsCrossed className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#111110]">Thêm món ăn mới</p>
                  <p className="text-xs text-[#52524E]">Ảnh món ăn, nguyên liệu và các bước nấu</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickAddOpen(false);
                  navigate('/notes/new');
                }}
                className="flex min-h-[60px] w-full items-center gap-4 py-3 text-left active:opacity-75"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#1D4ED8] text-white">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#111110]">Thêm ghi chú mới</p>
                  <p className="text-xs text-[#52524E]">Mẹo bếp, tỉ lệ sốt hoặc ghi chép cá nhân</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
};
