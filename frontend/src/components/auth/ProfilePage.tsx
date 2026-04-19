import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, Loader2, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

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
    setPwLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword(''); setNewPassword('');
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
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl">
              {user?.avatar
                ? <img src={user.avatar} className="w-20 h-20 rounded-2xl object-cover" alt="" />
                : user?.name?.[0]?.toUpperCase()
              }
            </div>
            <button className="absolute -bottom-2 -right-2 w-7 h-7 bg-dark-500 border border-white/10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
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
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">Họ và tên</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={name} onChange={e => setName(e.target.value)} className="input-dark pl-9" placeholder="Tên của bạn" />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5 flex items-center gap-1.5">
              <Clock size={13} /> Giờ làm việc
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-600 text-xs mb-1">Bắt đầu</p>
                <input type="time" value={workStart} onChange={e => setWorkStart(e.target.value)} className="input-dark" />
              </div>
              <div>
                <p className="text-slate-600 text-xs mb-1">Kết thúc</p>
                <input type="time" value={workEnd} onChange={e => setWorkEnd(e.target.value)} className="input-dark" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Lưu thay đổi
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lock size={16} className="text-violet-400" /> Đổi mật khẩu
        </h3>
        <form onSubmit={handlePassword} className="space-y-4">
          {[
            { label: 'Mật khẩu hiện tại', val: currentPassword, set: setCurrentPassword },
            { label: 'Mật khẩu mới', val: newPassword, set: setNewPassword },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">{label}</label>
              <input type="password" value={val} onChange={e => set(e.target.value)} className="input-dark" placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-primary flex items-center gap-2">
            {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}
