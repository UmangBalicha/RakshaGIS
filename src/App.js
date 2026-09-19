import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(_Fragment, { children: [_jsx(RouterProvider, { router: router }), _jsx(Toaster, { position: "top-center", richColors: true, closeButton: true })] }));
}
