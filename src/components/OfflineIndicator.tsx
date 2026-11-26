import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 border border-[#111110] bg-[#111110] px-3.5 py-2 text-xs font-medium text-white shadow-lg md:bottom-6 md:left-6"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Đang ngoại tuyến — sử dụng bộ nhớ đệm</span>
    </div>
  );
};
