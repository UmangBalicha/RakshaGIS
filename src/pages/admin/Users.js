import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { listProfiles, setUserRole } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import { useAuthStore } from '../../stores/authStore';
import { Badge, Card, CardContent, EmptyState, Select, Spinner } from '../../components/ui';
export default function AdminUsers() {
    const me = useAuthStore((s) => s.profile);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const load = async () => {
        setLoading(true);
        try {
            setUsers(await listProfiles());
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Could not load users.');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
    }, []);
    const changeRole = async (u, role) => {
        if (u.id === me?.id && role !== 'admin') {
            toast.error('You cannot demote your own account.');
            return;
        }
        setSavingId(u.id);
        try {
            await setUserRole(u.id, role);
            setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
            toast.success(`${u.full_name} is now ${role === 'admin' ? 'an admin' : 'a public user'}.`);
        }
        catch (e) {
            toast.error(e instanceof Error ? e.message : 'Role change failed.');
        }
        finally {
            setSavingId(null);
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-extrabold text-slate-900", children: ["Users (", users.length, ")"] }), _jsx("p", { className: "mt-0.5 text-sm text-slate-500", children: "Promote trusted staff to admin so they can triage reports." })] }), _jsx(Card, { children: _jsx(CardContent, { className: "overflow-x-auto p-0", children: loading ? (_jsx("div", { className: "flex justify-center py-16", children: _jsx(Spinner, {}) })) : users.length === 0 ? (_jsx("div", { className: "p-5", children: _jsx(EmptyState, { title: "No users yet" }) })) : (_jsxs("table", { className: "w-full min-w-180 text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase", children: [_jsx("th", { className: "px-4 py-3", children: "Name" }), _jsx("th", { className: "px-4 py-3", children: "Email" }), _jsx("th", { className: "px-4 py-3", children: "Phone" }), _jsx("th", { className: "px-4 py-3", children: "Joined" }), _jsx("th", { className: "px-4 py-3", children: "Role" }), _jsx("th", { className: "px-4 py-3 text-right", children: "Change role" })] }) }), _jsx("tbody", { children: users.map((u) => (_jsxs("tr", { className: "border-b border-slate-50 last:border-0 hover:bg-slate-50/70", children: [_jsxs("td", { className: "px-4 py-3 font-bold text-slate-900", children: [u.full_name, u.id === me?.id ? ' (you)' : ''] }), _jsx("td", { className: "px-4 py-3 text-xs text-slate-600", children: u.email ?? '—' }), _jsx("td", { className: "px-4 py-3 text-xs whitespace-nowrap text-slate-600", children: u.phone ?? '—' }), _jsx("td", { className: "px-4 py-3 text-xs whitespace-nowrap text-slate-500", children: formatDateTime(u.created_at) }), _jsx("td", { className: "px-4 py-3", children: _jsx(Badge, { className: u.role === 'admin' ? 'bg-slate-900 text-white ring-slate-900' : 'bg-slate-100 text-slate-600 ring-slate-200', children: u.role }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs(Select, { "aria-label": `Role for ${u.full_name}`, value: u.role, disabled: savingId === u.id, onChange: (e) => void changeRole(u, e.target.value), className: "inline-block w-auto py-1.5 text-xs", children: [_jsx("option", { value: "public", children: "public" }), _jsx("option", { value: "admin", children: "admin" })] }) })] }, u.id))) })] })) }) })] }));
}
