import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  Zap,
  Target,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { statsAPI, taskAPI } from '../../services/api';
import { Stats, Task } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const PRIORITY_COLORS: Record<string, string> = {
  high: '#f43f5e',
  medium: '#f59e0b',
  low: '#10b981',
};

const StatCard = ({ icon: Icon, label, value, color, sub }: any) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    className={`glass glass-hover rounded-2xl p-4 sm:p-5 md:p-5 lg:p-6 border border-white/[0.08] relative overflow-hidden group
      before:absolute before:inset-0 before:rounded-2xl before:opacity-0 group-hover:before:opacity-100
      before:transition-opacity before:duration-500 before:pointer-events-none
      before:bg-gradient-to-br before:from-transparent before:to-white/[0.02]`}
  >
    {/* Glow effect background */}
    <div className="absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-75 group-hover:animate-pulse bg-gradient-to-r from-white/0 via-white/5 to-white/0 blur-xl transition-opacity duration-500 -z-10" />
    
    {/* Thay đổi từ flex-col sang flex-row/flex-col linh hoạt để đẩy icon và số ngang hàng */}
    <div className="flex flex-col justify-between h-full gap-3">
      <div className="flex items-center justify-between gap-3">
        {/* Nhóm Icon và Số liệu nằm ngang hàng với nhau */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${color} shadow-lg shadow-black/20 flex-shrink-0 relative`}
          >
            <Icon size={18} className="text-white" />
          </div>
          
          <p className="text-2xl sm:text-3xl md:text-2xl lg:text-3xl font-extrabold text-white leading-none truncate">
            {value}
          </p>
        </div>

        {/* Nhãn phụ (ví dụ: % hoàn thành) nếu có sẽ nằm gọn bên phải */}
        {sub && (
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0 leading-tight">
            {sub}
          </span>
        )}
      </div>

      {/* Chữ mô tả (Label) được đưa xuống hàng dưới cùng của card */}
      <div className="pt-1">
        <p className="text-slate-300 text-xs sm:text-sm md:text-xs lg:text-sm font-medium truncate">
          {label}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { language, t } = useLanguage();
  const { dark } = useTheme();

  const [stats, setStats] = useState<Stats | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const dateLocale = language === 'vi' ? vi : enUS;

  const tooltipStyle = {
    background: dark ? '#111827' : '#ffffff',
    border: dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.12)',
    borderRadius: '8px',
    fontSize: '12px',
    color: dark ? '#f1f5f9' : '#0f172a',
  };

  const tooltipTextStyle = {
    color: dark ? '#f1f5f9' : '#0f172a',
  };

  const priorityLabel: Record<string, string> = {
    high: t('dashboard.priorityHigh'),
    medium: t('dashboard.priorityMedium'),
    low: t('dashboard.priorityLow'),
  };

  const priorityShortLabel: Record<string, string> = {
    high: t('dashboard.priorityHigh'),
    medium: t('dashboard.priorityMediumShort'),
    low: t('dashboard.priorityLow'),
  };

  const priorityChartData = (stats?.priorityDistribution ?? []).map(item => ({
    key: item._id,
    name: priorityLabel[item._id] || item._id,
    count: item.count,
  }));

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, tasksRes] = await Promise.all([
        statsAPI.getUserStats(),
        taskAPI.getAll({ sort: 'deadline' } as any),
      ]);

      setStats(statsRes.data.stats);
      const now = new Date();
const in3Days = new Date();
in3Days.setDate(in3Days.getDate() + 3);

setUpcomingTasks(
  tasksRes.data.tasks
    .filter((task: Task) =>
      task.deadline &&
      task.status !== 'completed' &&
      new Date(task.deadline) >= now &&
      new Date(task.deadline) <= in3Days
    )
    .slice(0, 5)
);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load(true);

    window.addEventListener('task-created', handler);
    window.addEventListener('task-updated', handler);

    return () => {
      window.removeEventListener('task-created', handler);
      window.removeEventListener('task-updated', handler);
    };
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(true), 60000);
    return () => clearInterval(interval);
  }, [load]);

  const greeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-5 animate-fade-in">
        <div className="h-8 md:h-9 skeleton rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-24 md:h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
          <div className="lg:col-span-2 h-56 md:h-64 skeleton rounded-2xl" />
          <div className="h-56 md:h-64 skeleton rounded-2xl" />
        </div>
        <div className="h-48 md:h-56 skeleton rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
              {greeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 animate-pulse">
                {user?.name?.split(' ').pop()} 👋
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm md:text-xs lg:text-sm mt-1.5 font-medium capitalize truncate">
              {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/tasks"
              className="h-10 sm:h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-3 sm:px-4 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap group"
            >
              <Plus size={16} className="flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden min-[420px]:inline">{t('dashboard.createTask')}</span>
              <span className="min-[420px]:hidden">+</span>
            </Link>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="h-10 sm:h-11 w-10 sm:w-11 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white active:scale-95 transition-all flex items-center justify-center flex-shrink-0 group"
              title={t('dashboard.refresh')}
            >
              <RefreshCw size={18} className={`flex-shrink-0 group-hover:rotate-180 transition-all duration-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4">
        <StatCard
          icon={Target}
          label={t('dashboard.totalTasks')}
          value={stats?.total ?? 0}
          color="bg-gradient-to-br from-cyan-500 to-cyan-600"
        />
        <StatCard
          icon={CheckCircle2}
          label={t('dashboard.completed')}
          value={stats?.completed ?? 0}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          sub={`${stats?.completionRate ?? 0}%`}
        />
        <StatCard
          icon={Clock}
          label={t('dashboard.inProgress')}
          value={stats?.pending ?? 0}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('dashboard.overdue')}
          value={stats?.overdue ?? 0}
          color="bg-gradient-to-br from-rose-500 to-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-5 md:p-6 border border-white/[0.08]">
          <div className="flex items-center justify-between mb-5 md:mb-6 gap-2">
            <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2.5 flex-shrink-0">
              <TrendingUp size={16} className="text-cyan-400 flex-shrink-0" />
              <span>{t('dashboard.last7Days')}</span>
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 180 : 220}>
            <AreaChart data={stats?.dailyStats ?? []}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tick={{ fill: dark ? '#94a3b8' : '#64748b', fontSize: window.innerWidth < 640 ? 11 : 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: dark ? '#94a3b8' : '#64748b', fontSize: window.innerWidth < 640 ? 11 : 12 }}
                axisLine={false}
                tickLine={false}
                width={window.innerWidth < 640 ? 28 : 32}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipTextStyle}
                labelStyle={tooltipTextStyle}
                cursor={{ stroke: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="created"
                name={t('dashboard.created')}
                stroke="#22d3ee"
                strokeWidth={2.5}
                fill="url(#colorCreated)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                name={t('dashboard.completedChart')}
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#colorCompleted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5 md:p-6 border border-white/[0.08]">
          <h3 className="font-bold text-white text-sm sm:text-base mb-5 md:mb-6 flex items-center gap-2.5">
            <Zap size={16} className="text-amber-400 flex-shrink-0" />
            <span>{t('dashboard.byPriority')}</span>
          </h3>

          {priorityChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={34}
                    outerRadius={56}
                  >
                    {priorityChartData.map(entry => (
                      <Cell key={entry.key} fill={PRIORITY_COLORS[entry.key] || '#475569'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value}`, name]}
                    contentStyle={tooltipStyle}
                    itemStyle={tooltipTextStyle}
                    labelStyle={tooltipTextStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2 mt-4">
                {priorityChartData.map(item => (
                  <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-lg"
                        style={{ background: PRIORITY_COLORS[item.key], boxShadow: `0 0 8px ${PRIORITY_COLORS[item.key]}40` }}
                      />
                      <span className="text-slate-300 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-white flex-shrink-0 bg-white/10 px-2.5 py-1 rounded-lg text-xs">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-xs text-center mt-8">
              {t('dashboard.noData')}
            </p>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5 md:p-6 border border-white/[0.08]">
        <div className="flex items-center justify-between mb-5 md:mb-6 gap-2">
          <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2.5 flex-shrink-0">
            <Clock size={16} className="text-violet-400 flex-shrink-0" />
            <span>{t('dashboard.upcoming')}</span>
          </h3>

          <Link
            to="/tasks"
            className="text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors flex-shrink-0 group"
          >
            {t('dashboard.viewAll')} 
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="text-center py-8 md:py-10 text-slate-500">
            <CheckCircle2 size={32} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm">{t('dashboard.noUpcoming')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcomingTasks.map(task => (
              <motion.div
                key={task._id}
                whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-start gap-3 p-3.5 md:p-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                    task.priority === 'high'
                      ? 'bg-rose-400 shadow-lg shadow-rose-400/30'
                      : task.priority === 'medium'
                        ? 'bg-amber-400 shadow-lg shadow-amber-400/30'
                        : 'bg-emerald-400 shadow-lg shadow-emerald-400/30'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-semibold truncate group-hover:text-white transition-colors">{task.title}</p>
                  {task.deadline && (
                    <p className="text-slate-400 text-xs mt-1">
                      {format(new Date(task.deadline), 'd MMM yyyy, HH:mm', { locale: dateLocale })}
                    </p>
                  )}
                </div>

                <span
                  className={`px-2.5 py-1 text-xs rounded-full font-semibold badge-${task.priority} flex-shrink-0 whitespace-nowrap`}
                >
                  {priorityShortLabel[task.priority]}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Link to="/ai">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="relative overflow-hidden rounded-2xl p-5 md:p-6 bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-rose-500/15 border border-cyan-400/20 hover:border-cyan-400/40 cursor-pointer group transition-all backdrop-blur-sm"
        >
          {/* Animated gradient overlay on hover */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-50 bg-gradient-to-r from-cyan-500/5 via-violet-500/5 to-rose-500/5 transition-opacity duration-500 blur-xl -z-10" />
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-200 transition-colors">AI Assistant</h3>
              <p className="text-slate-400 group-hover:text-slate-300 text-xs sm:text-sm truncate transition-colors">
                {t('dashboard.aiDescription')}
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-2 transition-all flex-shrink-0"
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
