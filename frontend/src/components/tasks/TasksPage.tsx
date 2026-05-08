import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  SortDesc,
  ListTodo,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useLanguage } from '../../context/LanguageContext';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { Task } from '../../types';

type DropdownOption = {
  value: string;
  label: string;
};

function FilterDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find(option => option.value === value) || options[0];

  const updateMenuPosition = () => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const gap = 8;
    const menuMaxHeight = 192;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      width: rect.width,
      maxHeight: Math.min(menuMaxHeight, openUp ? spaceAbove : spaceBelow),
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        wrapperRef.current?.contains(target) ||
        document.getElementById('task-filter-dropdown-menu')?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleReposition = () => updateMenuPosition();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <motion.button
        ref={buttonRef}
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(current => !current)}
        className={`h-10 md:h-12 w-full flex items-center justify-between gap-3 rounded-xl px-3 md:px-4 border outline-none transition-all duration-200 text-xs md:text-sm ${
          open
            ? 'border-cyan-400/50 ring-2 ring-cyan-500/20 shadow-[0_0_18px_rgba(34,211,238,0.12)]'
            : 'border-white/10'
        } bg-white/[0.04] hover:border-cyan-400/40`}
      >
        <span className="truncate font-semibold text-slate-100">
          {selected?.label}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="md:size-4 text-slate-400 flex-shrink-0" />
        </motion.div>
      </motion.button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              id="task-filter-dropdown-menu"
              initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
              transition={{ duration: 0.15 }}
              style={menuStyle}
              className="overflow-y-auto rounded-xl border border-white/[0.08] bg-[#111827]/95 p-1.5 shadow-2xl shadow-black/30 backdrop-blur-xl"
            >
              {options.map(option => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left text-xs md:text-sm transition-all ${
                      active
                        ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/15 text-cyan-300'
                        : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {active && (
                      <Check size={12} className="md:size-3.5 text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

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

  const openCreate = () => { setEditTask(null); setShowModal(true); };
  const openEdit = (task: Task) => { setEditTask(task); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditTask(null); };

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo size={20} className="md:size-6 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{t('tasks.pageTitle')}</span>
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            {tasks.length} {tasks.length === 1 ? t('tasks.taskSingular') : t('tasks.taskPlural')}
          </p>
        </div>

        {/* FIX: always show full button text on all screen sizes */}
        <button
          onClick={openCreate}
          className="h-10 md:h-11 inline-flex items-center justify-center gap-2 px-4 md:px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-cyan-500/10 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={14} className="md:size-4 flex-shrink-0" />
          {t('tasks.createTaskButton')}
        </button>
      </div>

      <div className="glass rounded-2xl p-3 md:p-5 space-y-3 md:space-y-4">
        <div className="relative">
          <Search
            size={14}
            className="md:size-4 pointer-events-none absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10"
          />
          <input
            value={searchInput}
            onChange={event => setSearchInput(event.target.value)}
            className="block w-full h-11 md:h-13 rounded-xl border border-white/10 bg-white/[0.04] py-0 pl-10 md:pl-12 pr-3 md:pr-4 text-xs md:text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-500/20"
            placeholder={t('tasks.searchPlaceholder')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1 text-slate-500 text-xs">
              <Filter size={10} className="md:size-3" /> {t('tasks.status')}
            </label>
            <FilterDropdown
              value={filters.status}
              options={statusOptions}
              onChange={value => setFilters({ status: value })}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-slate-500 text-xs">
              {t('tasks.priority')}
            </label>
            <FilterDropdown
              value={filters.priority}
              options={priorityOptions}
              onChange={value => setFilters({ priority: value })}
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1 text-slate-500 text-xs">
              <SortDesc size={10} className="md:size-3" /> {t('tasks.sort')}
            </label>
            <FilterDropdown
              value={filters.sort}
              options={sortOptions}
              onChange={value => setFilters({ sort: value })}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 md:space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-20 md:h-24 skeleton rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass rounded-2xl p-8 md:p-16 text-center">
          <ListTodo size={36} className="md:size-12 mx-auto text-slate-700 mb-3 md:mb-4" />
          <p className="text-slate-400 font-medium text-sm md:text-base">
            {t('tasks.emptyTitle')}
          </p>
          <p className="text-slate-600 text-xs md:text-sm mt-1">
            {t('tasks.emptySubtitle')}
          </p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex h-10 md:h-11 items-center justify-center gap-2 px-4 md:px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs md:text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={14} className="md:size-4" /> {t('tasks.createNewTask')}
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2 md:space-y-3">
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

      <AnimatePresence>
        {showModal && <TaskModal task={editTask} onClose={closeModal} />}
      </AnimatePresence>
    </div>
  );
}