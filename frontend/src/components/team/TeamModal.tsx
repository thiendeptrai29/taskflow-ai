import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Users } from 'lucide-react';
import { useTeamStore, Team } from '../../store/teamStore';
import toast from 'react-hot-toast';

const COLORS = [
  '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#14b8a6',
];

interface Props {
  open: boolean;
  onClose: () => void;
  team?: Team | null;
}

export default function TeamModal({ open, onClose, team }: Props) {
  const { createTeam, updateTeam } = useTeamStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!team;

  useEffect(() => {
    if (open) {
      setName(team?.name || '');
      setDescription(team?.description || '');
      setColor(team?.color || COLORS[0]);
      setErrors({});
    }
  }, [open, team]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Tên team là bắt buộc';
    else if (name.trim().length < 3) e.name = 'Tên team tối thiểu 3 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit && team) {
        await updateTeam(team.id, { name: name.trim(), description: description.trim(), color });
        toast.success('Cập nhật team thành công!');
      } else {
        await createTeam({ name: name.trim(), description: description.trim(), color });
        toast.success('Tạo team thành công!');
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isEdit ? 'Cập nhật thất bại' : 'Tạo team thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md glass rounded-2xl p-6 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color }}>
                  <Users size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {isEdit ? 'Chỉnh sửa team' : 'Tạo team mới'}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Tên team <span className="text-rose-400">*</span>
                </label>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: '' })); }}
                  placeholder="Ví dụ: Frontend Team"
                  className={`input-dark w-full ${errors.name ? 'border-rose-500/50' : ''}`}
                />
                {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Mô tả</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn về team..."
                  rows={3}
                  className="input-dark w-full resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-2">Màu đại diện</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-lg transition-all hover:scale-110"
                      style={{ background: c, outline: color === c ? `3px solid white` : 'none', outlineOffset: 2 }}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: color }}>
                  {name ? name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{name || 'Tên team'}</p>
                  <p className="text-slate-500 text-xs">{description || 'Mô tả team'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all">
                  Hủy
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  {isEdit ? 'Lưu thay đổi' : 'Tạo team'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}