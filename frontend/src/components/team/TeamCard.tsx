import { motion } from 'framer-motion';
import { Users, Clock, Crown, Shield, User, ArrowRight } from 'lucide-react';
import { Team } from '../../store/teamStore';
import { useLanguage } from '../../context/LanguageContext';

const roleConfig = {
  owner: { icon: Crown, label: 'Owner', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  admin: { icon: Shield, label: 'Admin', color: 'text-violet-400', bg: 'bg-violet-500/20 border-violet-500/30' },
  member: { icon: User, label: 'Member', color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
};

interface Props {
  team: Team;
  onClick: () => void;
  onEdit: () => void;
}

export default function TeamCard({ team, onClick, onEdit }: Props) {
  const { t, language } = useLanguage();
  const role = roleConfig[team.myRole];
  const RoleIcon = role.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-5 cursor-pointer group relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: team.color }} />

      <div className="flex items-start justify-between mb-4 mt-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
            style={{ background: team.color }}>
            {team.avatar
              ? <img src={team.avatar} className="w-full h-full object-cover rounded-xl" alt="" />
              : team.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">{team.name}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${role.bg} ${role.color}`}>
              <RoleIcon size={10} /> {role.label}
            </span>
          </div>
        </div>
        {(team.myRole === 'owner' || team.myRole === 'admin') && (
          <button onClick={e => { e.stopPropagation(); onEdit(); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </div>

      {team.description && (
        <p className="text-slate-400 text-xs mb-4 line-clamp-2">{team.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <Users size={14} className="text-cyan-400" />
          <div>
            <p className="text-white font-semibold text-sm">{team.memberCount}</p>
            <p className="text-slate-500 text-xs">{t('team.members')}</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-2">
          <Clock size={14} className="text-amber-400" />
          <div>
            <p className="text-white font-semibold text-sm">{team.openTaskCount}</p>
            <p className="text-slate-500 text-xs">{t('team.openTasks')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-slate-600 text-xs">
          {new Date(team.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
        </p>
        <span className="flex items-center gap-1 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-all">
          {t('team.viewDetail')} <ArrowRight size={12} />
        </span>
      </div>
    </motion.div>
  );
} 