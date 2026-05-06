import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Search, RefreshCw } from 'lucide-react';
import { useTeamStore } from '../../store/teamStore';
import { useLanguage } from '../../context/LanguageContext';
import TeamCard from './TeamCard';
import TeamModal from './TeamModal';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 md:w-10 h-9 md:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Users size={18} className="md:size-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{t('team.title')}</h1>
            <p className="text-xs md:text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{t('team.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => fetchTeams().catch(() => {})}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setEditTeam(null); setShowModal(true); }}
            className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-xs md:text-sm font-medium hover:opacity-90 transition-all shadow-lg flex-shrink-0"
          >
            <Plus size={14} className="md:size-4" /> <span className="hidden sm:inline">{t('team.createTeam')}</span><span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('team.searchPlaceholder')}
          style={{ paddingLeft: '2.5rem' }}
          className="input-dark w-full text-xs md:text-sm"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-4 md:p-5 h-48 md:h-52 skeleton" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 md:p-10 text-center">
          <div className="w-12 md:w-16 h-12 md:h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 md:mb-4 border border-amber-500/20">
            <Users size={24} className="md:size-7 text-amber-400" />
          </div>
          <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">{t('team.apiNotReady')}</h3>
          <p className="text-slate-500 text-xs md:text-sm mb-1">
            {t('team.apiNotReadyDesc')}{' '}
            <code className="text-cyan-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">/api/teams</code>
          </p>
          <p className="text-slate-600 text-xs mb-4 md:mb-5">{t('team.apiNotReadyHint')}</p>
          <button
            onClick={() => fetchTeams().catch(() => {})}
            className="px-3 md:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs md:text-sm hover:bg-white/10 transition-all"
          >
            {t('team.retry')}
          </button>
        </motion.div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 md:p-12 text-center">
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
              onClick={() => setShowModal(true)}
              className="px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl text-xs md:text-sm font-medium hover:opacity-90 transition-all"
            >
              {t('team.createNow')}
            </button>
          )}
        </motion.div>
      )}

      {/* Team list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => navigate(`/teams/${team.id}`)}
              onEdit={() => { setEditTeam(team); setShowModal(true); }}
            />
          ))}
        </div>
      )}

      <TeamModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditTeam(null); }}
        team={editTeam}
      />
    </div>
  );
}