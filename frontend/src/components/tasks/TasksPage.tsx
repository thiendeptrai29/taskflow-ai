import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, SortDesc, Loader2, ListTodo } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { Task } from '../../types';

const STATUS_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'in-progress', label: 'Đang làm' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];
const PRIORITY_OPTS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'high', label: '🔴 Cao' },
  { value: 'medium', label: '🟡 Trung bình' },
  { value: 'low', label: '🟢 Thấp' },
];
const SORT_OPTS = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: 'createdAt', label: 'Cũ nhất' },
  { value: 'deadline', label: 'Deadline gần nhất' },
  { value: '-priority', label: 'Ưu tiên cao' },
];

export default function TasksPage() {
  const { tasks, isLoading, filters, setFilters, fetchTasks } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { fetchTasks(); }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => setFilters({ search: searchInput }), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const openEdit = (task: Task) => { setEditTask(task); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTask(null); };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo size={24} className="text-cyan-400" /> Công việc
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Tạo task
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="input-dark pl-9"
            placeholder="Tìm kiếm theo tiêu đề..."
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 text-xs mb-1 flex items-center gap-1"><Filter size={11} /> Trạng thái</label>
            <select value={filters.status} onChange={e => setFilters({ status: e.target.value })} className="input-dark">
              {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 text-xs mb-1">Ưu tiên</label>
            <select value={filters.priority} onChange={e => setFilters({ priority: e.target.value })} className="input-dark">
              {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-500 text-xs mb-1 flex items-center gap-1"><SortDesc size={11} /> Sắp xếp</label>
            <select value={filters.sort} onChange={e => setFilters({ sort: e.target.value })} className="input-dark">
              {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <ListTodo size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">Chưa có task nào</p>
          <p className="text-slate-600 text-sm mt-1">Tạo task đầu tiên của bạn!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={15} /> Tạo task mới
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <motion.div key={task._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <TaskCard task={task} onEdit={openEdit} />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && <TaskModal task={editTask} onClose={closeModal} />}
      </AnimatePresence>
    </div>
  );
}
