import { create } from 'zustand';
import { Task, TaskFilters } from '../types';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  filters: TaskFilters;
  setFilters: (filters: Partial<TaskFilters>) => void;
  fetchTasks: () => Promise<void>;
  createTask: (data: Record<string, unknown> | FormData) => Promise<Task>;
  updateTask: (id: string, data: Partial<Record<string, unknown>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  filters: { status: 'all', priority: 'all', search: '', sort: '-createdAt' },

  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const { filters } = get();
      const params: Record<string, string> = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.priority !== 'all') params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await taskAPI.getAll(params);
      set({ tasks: res.data.tasks });
    } catch (error) {
      console.error('Fetch tasks error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (data) => {
    const res = await taskAPI.create(data);
    const newTask = res.data.task;
    set(state => ({ tasks: [newTask, ...state.tasks] }));
    toast.success('Đã tạo task thành công! ✅');
    return newTask;
  },

  updateTask: async (id, data) => {
    const res = await taskAPI.update(id, data);
    const updated = res.data.task;
    set(state => ({ tasks: state.tasks.map(t => t._id === id ? updated : t) }));
    toast.success('Đã cập nhật task!');
  },

  deleteTask: async (id) => {
    await taskAPI.delete(id);
    set(state => ({ tasks: state.tasks.filter(t => t._id !== id) }));
    toast.success('Đã xóa task!');
  },

  toggleTask: async (id) => {
    const res = await taskAPI.toggle(id);
    const updated = res.data.task;
    set(state => ({ tasks: state.tasks.map(t => t._id === id ? updated : t) }));
  },
}));
