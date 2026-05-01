import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertTriangle, TrendingUp,
  Sparkles, Plus, ArrowRight, Zap, Target, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
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
  <motion.div whileHover={{ y: -2 }} className="glass glass-hover rounded-2xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
    <p className="text-slate-400 text-sm">{label}</p>
    {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
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
        taskAPI.getAll({ status: 'pending', sort: 'deadline' } as any),
      ]);

      setStats(statsRes.data.stats);
      setUpcomingTasks(tasksRes.data.tasks.filter((task: Task) => task.deadline).slice(0, 5));
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
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 skeleton rounded-lg w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 skeleton rounded-2xl" />
          <div className="h-64 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting()},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
              {user?.name?.split(' ').pop()} 👋
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: dateLocale })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title={t('dashboard.refresh')}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <Link to="/tasks" className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> {t('dashboard.createTask')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          sub={`${t('dashboard.rate')} ${stats?.completionRate ?? 0}%`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-cyan-400" />
              {t('dashboard.last7Days')}
            </h3>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.dailyStats ?? []}>
              <defs>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                tick={{ fill: dark ? '#475569' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: dark ? '#475569' : '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                itemStyle={tooltipTextStyle}
                labelStyle={tooltipTextStyle}
                cursor={{ stroke: dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.08)' }}
              />
              <Area
                type="monotone"
                dataKey="created"
                name={t('dashboard.created')}
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#colorCreated)"
              />
              <Area
                type="monotone"
                dataKey="completed"
                name={t('dashboard.completedChart')}
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorCompleted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            {t('dashboard.byPriority')}
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
                    innerRadius={40}
                    outerRadius={65}
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

              <div className="space-y-1.5 mt-2">
                {priorityChartData.map(item => (
                  <div key={item.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PRIORITY_COLORS[item.key] }}
                      />
                      <span className="text-slate-400">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-slate-200">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center mt-8">
              {t('dashboard.noData')}
            </p>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white text-sm flex items-center gap-2">
            <Clock size={16} className="text-violet-400" />
            {t('dashboard.upcoming')}
          </h3>

          <Link
            to="/tasks"
            className="text-cyan-400 text-xs hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            {t('dashboard.viewAll')} <ArrowRight size={12} />
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('dashboard.noUpcoming')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTasks.map(task => (
              <motion.div
                key={task._id}
                whileHover={{ x: 2 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all"
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.priority === 'high'
                      ? 'bg-rose-400'
                      : task.priority === 'medium'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{task.title}</p>
                  {task.deadline && (
                    <p className="text-slate-500 text-xs mt-0.5">
                      {format(new Date(task.deadline), 'd MMM yyyy, HH:mm', { locale: dateLocale })}
                    </p>
                  )}
                </div>

                <span className={`px-2 py-0.5 text-xs rounded-full font-medium badge-${task.priority}`}>
                  {priorityShortLabel[task.priority]}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Link to="/ai">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-rose-500/10 border border-white/10 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-xl animate-float">
              <Sparkles size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">AI Assistant</h3>
              <p className="text-slate-400 text-sm">
                {t('dashboard.aiDescription')}
              </p>
            </div>
            <ArrowRight
              size={20}
              className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all"
            />
          </div>
        </motion.div>
      </Link>
    </div>
  );
}
