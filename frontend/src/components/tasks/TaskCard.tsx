import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Clock,
  Tag,
  Paperclip,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Task } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import { format, isPast } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

export default function TaskCard({
  task,
  onEdit,
}: {
  task: Task;
  onEdit: (task: Task) => void;
}) {
  const { toggleTask, deleteTask, updateTask } = useTaskStore();
  const { language, t } = useLanguage();

  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateLocale = language === 'vi' ? vi : enUS;

  const priorityLabels: Record<string, string> = {
    high: t('tasks.priorityHigh'),
    medium: t('tasks.priorityMedium'),
    low: t('tasks.priorityLow'),
  };

  const statusLabels: Record<string, string> = {
    pending: t('tasks.statusPending'),
    'in-progress': t('tasks.statusInProgress'),
    completed: t('tasks.statusCompleted'),
    cancelled: t('tasks.statusCancelled'),
  };

  const isOverdue =
    task.deadline &&
    isPast(new Date(task.deadline)) &&
    task.status !== 'completed';

  const handleDelete = async () => {
    if (!confirm(t('tasks.confirmDelete'))) return;

    setDeleting(true);

    try {
      await deleteTask(task._id);
    } catch {
      toast.error(t('tasks.deleteFailed'));
      setDeleting(false);
    }
  };

  const handleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      await updateTask(task._id, {
        subtasks: task.subtasks?.map(subtask =>
          subtask._id === subtaskId ? { ...subtask, completed } : subtask
        ),
      });
    } catch {
      toast.error(t('tasks.updateFailed'));
    }
  };

  return (
    <motion.div
      className={`glass glass-hover rounded-2xl p-4 transition-all ${
        task.status === 'completed' ? 'opacity-60' : ''
      } ${isOverdue ? 'border-rose-500/20' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle button */}
        <button
          onClick={() => toggleTask(task._id)}
          className="mt-0.5 flex-shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
          title={
            task.status === 'completed'
              ? t('tasks.markIncomplete')
              : t('tasks.markComplete')
          }
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={20} className="text-emerald-400" />
          ) : (
            <Circle size={20} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold text-sm leading-snug ${
                  task.status === 'completed'
                    ? 'line-through text-slate-500'
                    : 'text-slate-100'
                }`}
              >
                {task.title}
                {task.aiSuggested && (
                  <Sparkles size={12} className="inline ml-1.5 text-cyan-400" />
                )}
              </h3>

              {task.description && (
                <p className="text-slate-500 text-xs mt-0.5 truncate">
                  {task.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-cyan-400 transition-all"
                title={t('tasks.edit')}
              >
                <Edit3 size={14} />
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all"
                title={t('tasks.delete')}
              >
                <Trash2 size={14} />
              </button>

              {(task.subtasks?.length || 0) > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
                  title={expanded ? t('tasks.collapse') : t('tasks.expand')}
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium badge-${task.priority}`}>
              {priorityLabels[task.priority] || task.priority}
            </span>

            <span className={`px-2 py-0.5 text-xs rounded-full font-medium badge-${task.status}`}>
              {statusLabels[task.status] || task.status}
            </span>

            {task.deadline && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  isOverdue ? 'text-rose-400' : 'text-slate-500'
                }`}
              >
                <Clock size={11} />
                {format(new Date(task.deadline), 'd MMM, HH:mm', { locale: dateLocale })}
                {isOverdue && (
                  <span className="text-rose-400 font-medium">
                    • {t('tasks.overdue')}
                  </span>
                )}
              </span>
            )}

            {task.category && task.category !== 'general' && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <Tag size={11} /> {task.category}
              </span>
            )}

            {(task.attachments?.length || 0) > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-600">
                <Paperclip size={11} /> {task.attachments!.length}
              </span>
            )}

            {(task.subtasks?.length || 0) > 0 && (
              <span className="text-xs text-slate-600">
                {task.subtasks!.filter(subtask => subtask.completed).length}/
                {task.subtasks!.length} {t('tasks.subtask')}
              </span>
            )}
          </div>

          {/* Subtasks */}
          {expanded && task.subtasks && task.subtasks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 space-y-1.5 pl-2 border-l border-white/10"
            >
              {task.subtasks.map(subtask => (
                <div key={subtask._id} className="flex items-center gap-2">
                  <button
                    onClick={() => handleSubtask(subtask._id, !subtask.completed)}
                    className="text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                    title={
                      subtask.completed
                        ? t('tasks.markIncomplete')
                        : t('tasks.markComplete')
                    }
                  >
                    {subtask.completed ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <Circle size={14} />
                    )}
                  </button>

                  <span
                    className={`text-xs ${
                      subtask.completed
                        ? 'line-through text-slate-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {subtask.title}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
