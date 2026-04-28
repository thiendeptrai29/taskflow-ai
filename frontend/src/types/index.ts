export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  preferences: { theme: string; notifications: boolean; language: string };
  workingHours?: { start: string; end: string };
  productivityScore?: number;
  createdAt?: string;
  isActive?: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  category?: string;
  tags?: string[];
  deadline?: string;
  completedAt?: string;
  aiSuggested?: boolean;
  aiScore?: number;
  estimatedDuration?: number;
  subtasks?: Subtask[];
  attachments?: Attachment[];
  notes?: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  _id: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'deadline' | 'reminder' | 'ai-suggestion' | 'system' | 'achievement';
  isRead: boolean;
  task?: { _id: string; title: string; status: string };
  createdAt: string;
}

export interface Stats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  thisWeekCompleted: number;
  highPriority: number;
  completionRate: number;
  dailyStats: { date: string; created: number; completed: number }[];
  priorityDistribution: { _id: string; count: number }[];
}

export interface TaskFilters {
  status: string;
  priority: string;
  search: string;
  startDate?: string;
  endDate?: string;
  sort: string;
}

