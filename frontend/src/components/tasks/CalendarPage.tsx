import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { taskAPI } from '../../services/api';
import { Task } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

const PRIORITY_DOT: Record<string, string> = { high: 'bg-rose-400', medium: 'bg-amber-400', low: 'bg-emerald-400' };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Task[]>>({});
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await taskAPI.getCalendar({
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1
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

  // Pad start
  const startPad = monthStart.getDay();
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const selectedTasks = selectedDay
    ? (grouped[format(selectedDay, 'yyyy-MM-dd')] || [])
    : [];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon size={24} className="text-violet-400" /> Lịch công việc
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <ChevronLeft size={18} />
          </button>
          <span className="text-white font-semibold min-w-32 text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: vi })}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-3">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
            ))}
          </div>

          {/* Days */}
          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const key = format(day, 'yyyy-MM-dd');
                const dayTasks = grouped[key] || [];
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const todayDay = isToday(day);

                return (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                    className={`relative p-1 rounded-xl min-h-14 flex flex-col items-center transition-all
                      ${isSelected ? 'bg-cyan-500/20 border border-cyan-500/40' : 'hover:bg-white/5'}
                      ${!isSameMonth(day, currentDate) ? 'opacity-30' : ''}
                    `}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${todayDay ? 'bg-cyan-500 text-white' : 'text-slate-300'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex flex-wrap gap-0.5 justify-center">
                      {dayTasks.slice(0, 3).map(t => (
                        <span key={t._id} className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                      ))}
                      {dayTasks.length > 3 && <span className="text-slate-600 text-xs">+{dayTasks.length - 3}</span>}
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
              ? format(selectedDay, "EEEE, d MMMM", { locale: vi })
              : 'Chọn một ngày'
            }
          </h3>
          {!selectedDay ? (
            <p className="text-slate-500 text-sm text-center mt-8">Nhấn vào ngày trên lịch để xem công việc</p>
          ) : selectedTasks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center mt-8">Không có công việc nào ngày này 🎉</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map(task => (
                <div key={task._id} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
                    <div>
                      <p className={`text-xs font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      {task.deadline && (
                        <p className="text-slate-600 text-xs mt-0.5">
                          {format(new Date(task.deadline), 'HH:mm')}
                        </p>
                      )}
                      <span className={`inline-block mt-1 px-1.5 py-0.5 text-xs rounded-full badge-${task.status}`}>
                        {{ pending: 'Chờ xử lý', 'in-progress': 'Đang làm', completed: 'Hoàn thành', cancelled: 'Đã hủy' }[task.status]}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Month summary */}
          <div className="mt-6 pt-4 border-t border-white/5">
            <p className="text-slate-500 text-xs mb-2">Tháng này</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tổng task</span>
                <span className="text-white font-semibold">{tasks.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Hoàn thành</span>
                <span className="text-emerald-400 font-semibold">{tasks.filter(t => t.status === 'completed').length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Chưa xong</span>
                <span className="text-amber-400 font-semibold">{tasks.filter(t => t.status !== 'completed').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
