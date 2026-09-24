import { create } from 'zustand';
import { getSessionProfile, signOut } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useReportStore } from './reportStore';

let authListenerAttached = false;

export const useAuthStore = create()((set, get) => ({
    profile: null,
    initialized: false,
    loading: false,
    init: async () => {
        // One subscription for the app lifetime: token expiry, sign-out in
        // another tab, or a role change must never leave a stale (or zombie
        // admin) session in the store.
        if (!authListenerAttached && supabase) {
            authListenerAttached = true;
            supabase.auth.onAuthStateChange((event) => {
                if (event === 'SIGNED_OUT') {
                    set({ profile: null });
                    useReportStore.getState().reset();
                }
                else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                    void get().refreshProfile();
                }
            });
        }
        await get().refreshProfile();
    },
    refreshProfile: async () => {
        set({ loading: true });
        try {
            const profile = await getSessionProfile();
            set({ profile, initialized: true });
        }
        catch {
            set({ profile: null, initialized: true });
        }
        finally {
            set({ loading: false });
        }
    },
    setProfile: (p) => set({ profile: p, initialized: true }),
    logout: async () => {
        try {
            await signOut();
        }
        finally {
            // Clear auth AND cached data even if signOut throws — the next
            // person on this device must never see the previous user's data.
            set({ profile: null });
            useReportStore.getState().reset();
        }
    },
}));
export function useIsAdmin() {
    return useAuthStore((s) => s.profile?.role === 'admin');
}
