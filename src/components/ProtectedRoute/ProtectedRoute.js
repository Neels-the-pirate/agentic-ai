import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token && !isAuthenticated) {
      router.replace('/login');
    }
  }, [token, isAuthenticated, router]);

  if (!mounted || (!token && !isAuthenticated)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Authenticating operator session...</p>
        </div>
      </div>
    );
  }

  return children;
}
