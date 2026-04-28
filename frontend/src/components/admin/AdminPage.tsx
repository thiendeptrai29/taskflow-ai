import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, ToggleLeft, ToggleRight, Search, Loader2 } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { User } from '../../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number; activeUsers: number; totalTasks: number;
  completedTasks: number; newUsers: number; disabledUsers: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, sRes] = await Promise.all([adminAPI.getUsers(), adminAPI.getStats()]);
        setUsers(uRes.data.users);
        setStats(sRes.data.stats);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const res = await adminAPI.getUsers(search ? { search } : {});
      setUsers(res.data.users);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggle = async (id: string, name: string) => {
    setToggling(id);
    try {
      const res = await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: res.data.user.isActive } : u));
      toast.success(`Tài khoản ${name} đã được ${res.data.user.isActive ? 'kích hoạt' : 'vô hiệu hóa'}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi');
    } finally { setToggling(null); }
  };

  const StatCard = ({ label, value, color }: any) => (
    <div className="glass rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-1">{label}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-xs">Quản lý hệ thống</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Tổng users" value={stats.totalUsers} color="text-cyan-400" />
          <StatCard label="Đang hoạt động" value={stats.activeUsers} color="text-emerald-400" />
          <StatCard label="Bị khóa" value={stats.disabledUsers} color="text-rose-400" />
          <StatCard label="Users mới (30 ngày)" value={stats.newUsers} color="text-violet-400" />
          <StatCard label="Tổng tasks" value={stats.totalTasks} color="text-amber-400" />
          <StatCard label="Tasks hoàn thành" value={stats.completedTasks} color="text-emerald-400" />
        </div>
      )}

      {/* Users table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Users size={16} className="text-cyan-400" /> Danh sách người dùng
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2rem' }} className="input-dark w-64 text-xs" placeholder="Tìm theo tên, email..." />
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 skeleton rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Người dùng', 'Email', 'Vai trò', 'Ngày tham gia', 'Trạng thái', 'Hành động'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-white/3 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="text-slate-200 text-sm font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                        {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-sm">
                      {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi }) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(user as any).isActive !== false ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {(user as any).isActive !== false ? '● Hoạt động' : '● Bị khóa'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {user.role !== 'admin' && (
                        <button onClick={() => handleToggle(user.id, user.name)}
                          disabled={toggling === user.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                            ${(user as any).isActive !== false
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                        >
                          {toggling === user.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : (user as any).isActive !== false ? <ToggleLeft size={14} /> : <ToggleRight size={14} />
                          }
                          {(user as any).isActive !== false ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Không tìm thấy người dùng</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
