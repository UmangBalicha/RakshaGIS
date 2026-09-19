import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './app/router';
import { useAuthStore } from './stores/authStore';

export default function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </>
  );
}
