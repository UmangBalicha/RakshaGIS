import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { listProfiles, setUserRole } from '../../lib/api';
import { formatDateTime } from '../../lib/utils';
import type { Profile, Role } from '../../lib/types';
import { useAuthStore } from '../../stores/authStore';
import { Badge, Card, CardContent, EmptyState, Select, Spinner } from '../../components/ui';

export default function AdminUsers() {
  const me = useAuthStore((s) => s.profile);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await listProfiles());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const changeRole = async (u: Profile, role: Role) => {
    if (u.id === me?.id && role !== 'admin') {
      toast.error('You cannot demote your own account.');
      return;
    }
    setSavingId(u.id);
    try {
      await setUserRole(u.id, role);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
      toast.success(`${u.full_name} is now ${role === 'admin' ? 'an admin' : 'a public user'}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Role change failed.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Users ({users.length})</h1>
        <p className="mt-0.5 text-sm text-slate-500">Promote trusted staff to admin so they can triage reports.</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : users.length === 0 ? (
            <div className="p-5"><EmptyState title="No users yet" /></div>
          ) : (
            <table className="w-full min-w-180 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Change role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {u.full_name}
                      {u.id === me?.id ? ' (you)' : ''}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-600">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <Badge className={u.role === 'admin' ? 'bg-slate-900 text-white ring-slate-900' : 'bg-slate-100 text-slate-600 ring-slate-200'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Select
                        aria-label={`Role for ${u.full_name}`}
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) => void changeRole(u, e.target.value as Role)}
                        className="inline-block w-auto py-1.5 text-xs"
                      >
                        <option value="public">public</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
