import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { taskAPI } from '../../services/api';
import { Task } from '../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { useLanguage } from '../../context/LanguageContext';

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

export default function CalendarPage() {
  const { language, t } = useLanguage();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Task[]>>({});
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const dateLocale = language === 'vi' ? vi : enUS;

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const res = await taskAPI.getCalendar({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        });

        setTasks(res.data.tasks);
        setGrouped(res.data.grouped);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startPad = monthStart.getDay();
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const selectedTasks = selectedDay
    ? grouped[format(selectedDay, 'yyyy-MM-dd')] || []
    : [];

  const dayHeaders =
    language === 'vi'
      ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const statusLabels: Record<string, string> = {
    pending: t('calendar.statusPending'),
    'in-progress': t('calendar.statusInProgress'),
    completed: t('calendar.statusCompleted'),
    cancelled: t('calendar.statusCancelled'),
  };

  const prevMonth = () => {
    setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(date => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon size={24} className="text-violet-400" />
          {t('calendar.title')}
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            title={t('calendar.prevMonth')}
          >
            <ChevronLeft size={18} />
          </button>

          <span className="text-white font-semibold min-w-32 text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
            title={t('calendar.nextMonth')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="grid grid-cols-7 mb-3">
            {dayHeaders.map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, index) => (
                <div key={index} className="h-14 skeleton rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                if (!day) return <div key={`pad-${index}`} />;

                const key = format(day, 'yyyy-MM-dd');
                const dayTasks = grouped[key] || [];
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const todayDay = isToday(day);

                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative p-1 rounded-xl min-h-14 flex flex-col items-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/20 border border-cyan-500/40'
                        : 'hover:bg-white/5'
                    } ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        todayDay ? 'bg-cyan-500 text-white' : 'text-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>

                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {dayTasks.slice(0, 3).map(task => (
                        <span
                          key={task._id}
                          className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`}
                        />
                      ))}

                      {dayTasks.length > 3 && (
                        <span className="text-slate-600 text-xs">
                          +{dayTasks.length - 3}
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected day tasks */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">
            {selectedDay
              ? format(selectedDay, 'EEEE, d MMMM', { locale: dateLocale })
              : t('calendar.chooseDay')}
          </h3>

          {!selectedDay ? (
            <p className="text-slate-500 text-sm text-center mt-8">
              {t('calendar.chooseDayHint')}
            </p>
          ) : selectedTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-8">
              {t('calendar.noTasksDay')}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(task => (
                <div key={task._id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-start gap-2">
                    <span
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                    />

                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          task.status === 'completed'
                            ? 'line-through text-slate-500'
                            : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </p>

                      {task.deadline && (
                        <p className="text-slate-600 text-xs mt-0.5">
                          {format(new Date(task.deadline), 'HH:mm')}
                        </p>
                      )}

                      <span className={`inline-block mt-1 px-1.5 py-0.5 text-xs rounded-full badge-${task.status}`}>
                        {statusLabels[task.status] || task.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Month summary */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-slate-500 text-xs mb-2">
              {t('calendar.thisMonth')}
            </p>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('calendar.totalTasks')}</span>
                <span className="text-white font-semibold">{tasks.length}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('calendar.completed')}</span>
                <span className="text-emerald-400 font-semibold">
                  {tasks.filter(task => task.status === 'completed').length}
                </span>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{t('calendar.unfinished')}</span>
                <span className="text-amber-400 font-semibold">
                  {tasks.filter(task => task.status !== 'completed').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
