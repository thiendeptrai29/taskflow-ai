import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, SortDesc, ListTodo } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useLanguage } from '../../context/LanguageContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { Task } from '../../types';

export default function TasksPage() {
  const { tasks, isLoading, filters, setFilters, fetchTasks } = useTaskStore();
  const { t } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const statusOptions = [
    { value: 'all', label: t('tasks.all') },
    { value: 'pending', label: t('tasks.statusPending') },
    { value: 'in-progress', label: t('tasks.statusInProgress') },
    { value: 'completed', label: t('tasks.statusCompleted') },
    { value: 'cancelled', label: t('tasks.statusCancelled') },
  ];

  const priorityOptions = [
    { value: 'all', label: t('tasks.all') },
    { value: 'high', label: `🔴 ${t('tasks.priorityHigh')}` },
    { value: 'medium', label: `🟡 ${t('tasks.priorityMedium')}` },
    { value: 'low', label: `🟢 ${t('tasks.priorityLow')}` },
  ];

  const sortOptions = [
    { value: '-createdAt', label: t('tasks.sortNewest') },
    { value: 'createdAt', label: t('tasks.sortOldest') },
    { value: 'deadline', label: t('tasks.sortNearestDeadline') },
    { value: '-priority', label: t('tasks.sortHighPriority') },
  ];

  useEffect(() => {
    fetchTasks();
  }, [filters, fetchTasks]);

  useEffect(() => {
    const timer = setTimeout(() => setFilters({ search: searchInput }), 400);
    return () => clearTimeout(timer);
  }, [searchInput, setFilters]);

  const openEdit = (task: Task) => {
    setEditTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTask(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo size={24} className="text-cyan-400" />
            {t('tasks.pageTitle')}
          </h1>

          <p className="text-slate-400 text-sm mt-0.5">
            {tasks.length} {tasks.length === 1 ? t('tasks.taskSingular') : t('tasks.taskPlural')}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> {t('tasks.createTaskButton')}
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={searchInput}
            onChange={event => setSearchInput(event.target.value)}
            className="input-dark pl-9"
            placeholder={t('tasks.searchPlaceholder')}
          />
        </div>

        {/* Filter row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 text-xs mb-1 flex items-center gap-1">
              <Filter size={11} /> {t('tasks.status')}
            </label>
            <select
              value={filters.status}
              onChange={event => setFilters({ status: event.target.value })}
              className="input-dark"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-xs mb-1">
              {t('tasks.priority')}
            </label>
            <select
              value={filters.priority}
              onChange={event => setFilters({ priority: event.target.value })}
              className="input-dark"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-xs mb-1 flex items-center gap-1">
              <SortDesc size={11} /> {t('tasks.sort')}
            </label>
            <select
              value={filters.sort}
              onChange={event => setFilters({ sort: event.target.value })}
              className="input-dark"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <ListTodo size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">
            {t('tasks.emptyTitle')}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {t('tasks.emptySubtitle')}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4 inline-flex items-center gap-2"
          >
            <Plus size={15} /> {t('tasks.createNewTask')}
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
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
