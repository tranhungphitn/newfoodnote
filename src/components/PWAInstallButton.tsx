import React, {useState} from 'react';
import {Download, PlusSquare, Share, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({compact = false}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={
          compact
            ? 'inline-flex h-10 items-center gap-1.5 rounded-sm border border-[#E5E5E2] bg-white px-3 text-xs font-medium text-[#111110] hover:border-[#111110] transition-colors whitespace-nowrap shrink-0'
            : 'flex w-full min-h-[44px] items-center justify-center gap-2 rounded-sm border border-[#1D3B72] bg-[#EEF2F9] px-4 py-2.5 text-xs font-medium text-[#1D3B72] hover:bg-[#1D3B72] hover:text-white transition-colors whitespace-nowrap'
        }
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span>{compact ? 'Cài ứng dụng' : 'Cài đặt ứng dụng'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? 'inline-flex h-10 items-center gap-1.5 rounded-sm border border-[#E5E5E2] bg-white px-3 text-xs font-medium text-[#111110] hover:border-[#111110] transition-colors whitespace-nowrap shrink-0'
              : 'flex w-full min-h-[44px] items-center justify-center gap-2 rounded-sm border border-[#1D3B72] bg-[#EEF2F9] px-4 py-2.5 text-xs font-medium text-[#1D3B72] hover:bg-[#1D3B72] hover:text-white transition-colors whitespace-nowrap'
          }
        >
          <Download className="h-3.5 w-3.5 shrink-0" />
          <span>{compact ? 'Cài iOS' : 'Thêm vào Màn hình chính'}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-[#111110]/50 p-4 backdrop-blur-xs sm:items-center"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm border border-[#E5E5E2] bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#E5E5E2] pb-3">
                <h3 className="font-display text-2xl font-medium text-[#111110]">
                  Cài đặt trên iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Đóng hướng dẫn"
                  className="flex h-9 w-9 items-center justify-center text-[#52524E] hover:text-[#111110]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3.5 text-sm text-[#111110]">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[#1D3B72] pt-0.5">01</span>
                  <span className="leading-relaxed">
                    Nhấn biểu tượng <Share className="mx-1 inline h-4 w-4 text-[#1D3B72]" />
                    <strong>Chia sẻ</strong> trên thanh Safari.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[#1D3B72] pt-0.5">02</span>
                  <span className="leading-relaxed">
                    Chọn <PlusSquare className="mx-1 inline h-4 w-4 text-[#1D3B72]" />
                    <strong>Thêm vào MH chính</strong> (Add to Home Screen).
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full min-h-[44px] rounded-sm bg-[#111110] py-2.5 text-xs font-medium text-white hover:bg-[#1D3B72] transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
