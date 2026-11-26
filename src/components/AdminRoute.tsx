import React from 'react';
import {Navigate, useLocation} from 'react-router-dom';
import {Loader2} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';

export const AdminRoute: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {isAdmin, loading} = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#111110]" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" state={{from: location.pathname}} replace />;
  }

  return <>{children}</>;
};
