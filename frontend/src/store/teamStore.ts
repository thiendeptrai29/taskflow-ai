import { create } from 'zustand';
import { teamAPI } from '../services/api';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  joinedAt: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  role: 'admin' | 'member';
  status?: 'pending' | 'accepted' | 'declined'; // ✅ thêm status
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  color: string;
  avatar?: string;
  memberCount: number;
  openTaskCount: number;
  myRole: 'owner' | 'admin' | 'member';
  createdAt: string;
  createdBy: string;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
  invites: TeamInvite[];
  stats: {
    totalMembers: number;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    progress: number;
  };
}

interface TeamStore {
  teams: Team[];
  currentTeam: TeamDetail | null;
  loading: boolean;
  error: string | null;

  fetchTeams: () => Promise<void>;
  fetchTeamDetail: (id: string) => Promise<void>;
  createTeam: (data: Partial<Team>) => Promise<Team>;
  updateTeam: (id: string, data: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  inviteMember: (teamId: string, email: string, role: string) => Promise<void>;
  cancelInvite: (teamId: string, inviteId: string) => Promise<void>;
  updateMemberRole: (teamId: string, memberId: string, role: string) => Promise<void>;
  removeMember: (teamId: string, memberId: string) => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set) => ({
  teams: [],
  currentTeam: null,
  loading: false,
  error: null,

  // ✅ FIX: đổi teamAPI.getTeams() → teamAPI.getAll()
  fetchTeams: async () => {
    set({ loading: true, error: null });
    try {
      const res = await teamAPI.getAll();
      set({ teams: res.data.teams || [], loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể tải danh sách teams';
      set({ error: msg, teams: [], loading: false });
    }
  },

  // ✅ FIX: đổi teamAPI.getTeam(id) → teamAPI.getById(id)
  fetchTeamDetail: async (id) => {
    set({ loading: true, error: null, currentTeam: null });
    try {
      const res = await teamAPI.getById(id);
      set({ currentTeam: res.data.team, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải chi tiết team';
      set({ error: msg, loading: false });
    }
  },

  createTeam: async (data) => {
    const res = await teamAPI.create(data as Record<string, unknown>);
    const newTeam = res.data.team;
    set(state => ({ teams: [newTeam, ...state.teams] }));
    return newTeam;
  },

  // ✅ FIX: đổi teamAPI.updateTeam → teamAPI.update
  updateTeam: async (id, data) => {
    const res = await teamAPI.update(id, data as Record<string, unknown>);
    const updated = res.data.team;
    set(state => ({
      teams: state.teams.map(t => t.id === id ? { ...t, ...updated } : t),
      currentTeam: state.currentTeam?.id === id
        ? { ...state.currentTeam, ...updated }
        : state.currentTeam,
    }));
  },

  // ✅ FIX: đổi teamAPI.deleteTeam → teamAPI.delete
  deleteTeam: async (id) => {
    await teamAPI.delete(id);
    set(state => ({ teams: state.teams.filter(t => t.id !== id) }));
  },

  // ✅ FIX: đổi teamAPI.inviteMember(teamId, { email, role }) → teamAPI.invite(teamId, email, role)
  inviteMember: async (teamId, email, role) => {
    const res = await teamAPI.invite(teamId, email, role);
    const invite = res.data.invite;
    set(state => ({
      currentTeam: state.currentTeam
        ? { ...state.currentTeam, invites: [...(state.currentTeam.invites || []), invite] }
        : null,
    }));
  },

  cancelInvite: async (teamId, inviteId) => {
    await teamAPI.cancelInvite(teamId, inviteId);
    set(state => ({
      currentTeam: state.currentTeam
        ? { ...state.currentTeam, invites: state.currentTeam.invites.filter(i => i.id !== inviteId) }
        : null,
    }));
  },

  // ✅ FIX: đổi teamAPI.updateMemberRole(teamId, memberId, { role }) → teamAPI.updateMemberRole(teamId, memberId, role)
  updateMemberRole: async (teamId, memberId, role) => {
    await teamAPI.updateMemberRole(teamId, memberId, role);
    set(state => ({
      currentTeam: state.currentTeam
        ? {
            ...state.currentTeam,
            members: state.currentTeam.members.map(m =>
              m.id === memberId ? { ...m, role: role as TeamMember['role'] } : m
            ),
          }
        : null,
    }));
  },

  removeMember: async (teamId, memberId) => {
    await teamAPI.removeMember(teamId, memberId);
    set(state => ({
      currentTeam: state.currentTeam
        ? {
            ...state.currentTeam,
            members: state.currentTeam.members.filter(m => m.id !== memberId),
            stats: state.currentTeam.stats
              ? { ...state.currentTeam.stats, totalMembers: state.currentTeam.stats.totalMembers - 1 }
              : state.currentTeam.stats,
          }
        : null,
    }));
  },
}));