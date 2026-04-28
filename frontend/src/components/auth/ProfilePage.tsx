import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, Loader2, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Reusable input row với icon — không dùng absolute nữa
const InputRow = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
  <div className="flex items-center gap-3 bg-[#1a2236] border border-white/10 rounded-lg px-4 py-2.5 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
    <Icon size={15} className="text-slate-500 flex-shrink-0" />
    {children}
  </div>
);

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [workStart, setWorkStart] = useState(user?.workingHours?.start || '08:00');
  const [workEnd, setWorkEnd] = useState(user?.workingHours?.end || '17:00');
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('workingHours', JSON.stringify({ start: workStart, end: workEnd }));
      const res = await authAPI.updateProfile(fd);
      updateUser(res.data.user);
      toast.success('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return toast.error('Vui lòng điền đầy đủ');
    if (newPassword.length < 6) return toast.error('Mật khẩu mới phải ít nhất 6 ký tự');
    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Hồ sơ cá nhân</h1>

      {/* Avatar & info */}
      <div className="glass rounded-2xl p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                : <span>{user?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-[#1a2236] border border-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <Camera size={12} />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-0.5">
              <Mail size={13} /> {user?.email}
            </p>
            <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs rounded-full font-medium ${user?.role === 'admin' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
              {user?.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfile} className="space-y-4">
          {/* Tên */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Họ và tên</label>
            <InputRow icon={User}>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                placeholder="Tên của bạn"
              />
            </InputRow>
          </div>

          {/* Giờ làm việc */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Clock size={13} /> Giờ làm việc
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-600 text-xs mb-1">Bắt đầu</p>
                <div className="flex items-center gap-3 bg-[#1a2236] border border-white/10 rounded-lg px-4 py-2.5">
                  <input
                    type="time"
                    value={workStart}
                    onChange={e => setWorkStart(e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Kết thúc</p>
                <div className="flex items-center gap-3 bg-[#1a2236] border border-white/10 rounded-lg px-4 py-2.5">
                  <input
                    type="time"
                    value={workEnd}
                    onChange={e => setWorkEnd(e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-medium rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Lưu thay đổi
          </button>
        </form>
      </div>

      {/* Đổi mật khẩu */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lock size={16} className="text-violet-400" /> Đổi mật khẩu
        </h3>
        <form onSubmit={handlePassword} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Mật khẩu hiện tại</label>
            <InputRow icon={Lock}>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                placeholder="••••••••"
              />
            </InputRow>
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Mật khẩu mới</label>
            <InputRow icon={Lock}>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm outline-none"
                placeholder="••••••••"
              />
            </InputRow>
          </div>
          <button type="submit" disabled={pwLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-rose-500 text-white font-medium rounded-lg text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-60">
            {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}