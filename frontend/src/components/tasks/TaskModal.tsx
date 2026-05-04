import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X, Plus, Trash2, Loader2, Tag, Clock, AlignLeft, ListTodo, Sparkles,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import { Task } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { aiAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

interface Props { task?: Task | null; onClose: () => void; }

const defaultForm = {
  title: '', description: '', priority: 'medium', status: 'pending',
  category: '', tags: '', estimatedDuration: 30, notes: '', subtasks: [] as string[],
};

export default function TaskModal({ task, onClose }: Props) {
  const { createTask, updateTask } = useTaskStore();
  const { t } = useLanguage();
  const [form, setForm] = useState(defaultForm);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title, description: task.description || '',
        priority: task.priority, status: task.status,
        category: task.category || '', tags: task.tags?.join(', ') || '',
        estimatedDuration: task.estimatedDuration || 30, notes: task.notes || '',
        subtasks: task.subtasks?.map(s => s.title) || [],
      });
      if (task.deadline) setDeadline(new Date(task.deadline));
    }
  }, [task]);

  const set = (key: string, val: any) => setForm(c => ({ ...c, [key]: val }));
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    set('subtasks', [...form.subtasks, newSubtask.trim()]);
    setNewSubtask('');
  };
  const removeSubtask = (i: number) => set('subtasks', form.subtasks.filter((_, idx) => idx !== i));

  // ✅ AI tạo task trực tiếp vào DB, đóng modal luôn
  const handleAICreate = async () => {
    if (!aiText.trim()) {
      toast.error(t('tasks.aiDescriptionRequired'));
      return;
    }
    setAiLoading(true);
    try {
      const res = await aiAPI.createTask(aiText);
      const generatedTask = res.data.task;

      // Refresh danh sách task
      await useTaskStore.getState().fetchTasks();
      window.dispatchEvent(new Event('task-created'));

      toast.success(`✅ AI đã tạo task "${generatedTask.title}"!`);
      onClose(); // Đóng modal ngay
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || t('tasks.aiUnavailable'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error(t('tasks.titleRequired')); return; }
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        deadline: deadline?.toISOString(),
        subtasks: form.subtasks.map(s => ({ title: s, completed: false })),
      };
      if (task) {
        await updateTask(task._id, payload);
      } else {
        await createTask(payload);
        window.dispatchEvent(new Event('task-created'));
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('tasks.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <ListTodo size={18} className="text-cyan-400" />
            {task ? t('tasks.editTask') : t('tasks.createTask')}
          </h2>
          <div className="flex items-center gap-2">
            {!task && (
              <button onClick={() => setShowAI(!showAI)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all">
                <Sparkles size={13} /> {t('tasks.aiCreateTask')}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* AI section */}
        {showAI && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
            className="px-6 py-4 bg-cyan-500/5 border-b border-cyan-500/10"
          >
            <p className="text-xs text-cyan-400 font-medium mb-1">{t('tasks.aiNaturalPrompt')}</p>
            {/* ✅ Hint mới: AI tạo thẳng, không cần nhấn thêm */}
            <p className="text-xs text-slate-500 mb-2">
              AI sẽ phân tích và <strong className="text-cyan-400">tạo task luôn</strong> — không cần điền thêm
            </p>
            <textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleAICreate()}
              className="input-dark text-xs resize-none w-full"
              rows={3}
              placeholder={t('tasks.aiPlaceholder')}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-slate-600 text-xs">Ctrl+Enter để tạo nhanh</p>
              <button onClick={handleAICreate} disabled={aiLoading || !aiText.trim()}
                className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                {aiLoading ? 'Đang tạo task...' : t('tasks.createWithAI')}
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('tasks.title')} *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="input-dark" placeholder={t('tasks.titlePlaceholder')} />
          </div>

          {/* Description */}
          <div>
            <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
              <AlignLeft size={11} /> {t('tasks.description')}
            </label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              className="input-dark resize-none" rows={3} placeholder={t('tasks.descriptionPlaceholder')} />
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('tasks.priority')}</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input-dark">
                <option value="low">🟢 {t('tasks.priorityLow')}</option>
                <option value="medium">🟡 {t('tasks.priorityMedium')}</option>
                <option value="high">🔴 {t('tasks.priorityHigh')}</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('tasks.status')}</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="input-dark">
                <option value="pending">{t('tasks.statusPending')}</option>
                <option value="in-progress">{t('tasks.statusInProgress')}</option>
                <option value="completed">{t('tasks.statusCompleted')}</option>
                <option value="cancelled">{t('tasks.statusCancelled')}</option>
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
              <Clock size={11} /> {t('tasks.deadline')}
            </label>
            <DatePicker selected={deadline} onChange={(d: Date | null) => setDeadline(d)}
              showTimeSelect dateFormat="dd/MM/yyyy HH:mm"
              placeholderText={t('tasks.deadlinePlaceholder')}
              className="input-dark w-full" minDate={new Date()} isClearable />
          </div>

          {/* Category & Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('tasks.category')}</label>
              <input value={form.category} onChange={e => set('category', e.target.value)}
                className="input-dark" placeholder={t('tasks.categoryPlaceholder')} />
            </div>
            <div>
              <label className="flex text-slate-400 text-xs font-medium mb-1.5 items-center gap-1">
                <Tag size={11} /> Tags
              </label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)}
                className="input-dark" placeholder={t('tasks.tagsPlaceholder')} />
            </div>
          </div>

          {/* Estimated duration */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('tasks.estimatedDuration')}</label>
            <input type="number" value={form.estimatedDuration} onChange={e => set('estimatedDuration', +e.target.value)}
              className="input-dark" min={5} max={480} />
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-2">{t('tasks.subtasks')}</label>
            <div className="space-y-1.5 mb-2">
              {form.subtasks.map((st, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg">{st}</span>
                  <button type="button" onClick={() => removeSubtask(i)} className="text-slate-600 hover:text-rose-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                className="input-dark flex-1 text-xs" placeholder={t('tasks.addSubtaskPlaceholder')} />
              <button type="button" onClick={addSubtask}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-400 text-xs font-medium mb-1.5">{t('tasks.notes')}</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              className="input-dark resize-none" rows={2} placeholder={t('tasks.notesPlaceholder')} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">{t('tasks.cancel')}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading && <Loader2 size={15} className="animate-spin" />}
              {task ? t('tasks.update') : t('tasks.createTaskSubmit')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}