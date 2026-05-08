import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTeamStore } from '../../store/teamStore';
import { useLanguage } from '../../context/LanguageContext';
import TeamCard from './TeamCard';
import TeamModal from './TeamModal';

export default function TeamPage() {
  const { teams, loading, error, fetchTeams } = useTeamStore();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams().catch(() => {});
  }, []);

  const filtered = teams.filter(team =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    (team.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditTeam(null);
    setShowModal(true);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/10 flex-shrink-0">
              <Users size={18} className="md:size-5 text-white" />
            </div>

            <div className="min-w-0">
              <h1
                className="text-lg md:text-xl font-bold truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {t('team.title')}
              </h1>
              <p
                className="text-[11px] md:text-xs truncate leading-tight mt-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('team.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => fetchTeams().catch(() => {})}
              aria-label={t('team.retry')}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-cyan-400/40 hover:bg-white/[0.07] active:scale-95 transition-all"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={openCreate}
              className="h-10 min-w-[104px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-3.5 text-white text-xs font-bold shadow-lg shadow-cyan-500/10 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus size={14} className="flex-shrink-0" />
              <span>{t('team.createTeam')}</span>
            </button>
          </div>
        </div>

        <div className="relative w-full">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('team.searchPlaceholder')}
            className="block h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] py-0 pl-10 pr-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 outline-none transition-all focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-500/20"
          />
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 md:p-5 h-48 md:h-52 skeleton" />
          ))}
        </div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-10 text-center"
        >
          <div className="w-12 md:w-16 h-12 md:h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 md:mb-4 border border-amber-500/20">
            <Users size={24} className="md:size-7 text-amber-400" />
          </div>
          <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">
            {t('team.apiNotReady')}
          </h3>
          <p className="text-slate-500 text-xs md:text-sm mb-1">
            {t('team.apiNotReadyDesc')}{' '}
            <code className="text-cyan-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">
              /api/teams
            </code>
          </p>
          <p className="text-slate-600 text-xs mb-4 md:mb-5">
            {t('team.apiNotReadyHint')}
          </p>
          <button
            onClick={() => fetchTeams().catch(() => {})}
            className="px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs md:text-sm hover:bg-white/10 transition-all"
          >
            {t('team.retry')}
          </button>
        </motion.div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 md:p-12 text-center"
        >
          <div className="w-12 md:w-16 h-12 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3 md:mb-4">
            <Users size={24} className="md:size-7 text-slate-500" />
          </div>
          <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">
            {search ? t('team.noTeamsSearch') : t('team.noTeams')}
          </h3>
          <p className="text-slate-500 text-xs md:text-sm mb-3 md:mb-4">
            {search ? t('team.noTeamsSearchDesc') : t('team.noTeamsDesc')}
          </p>
          {!search && (
            <button
              onClick={openCreate}
              className="inline-flex h-10 items-center justify-center gap-2 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/10 hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus size={14} />
              {t('team.createNow')}
            </button>
          )}
        </motion.div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => navigate(`/teams/${team.id}`)}
              onEdit={() => {
                setEditTeam(team);
                setShowModal(true);
              }}
            />
          ))}
        </div>
      )}

      <TeamModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTeam(null);
        }}
        team={editTeam}
      />
    </div>
  );
}
