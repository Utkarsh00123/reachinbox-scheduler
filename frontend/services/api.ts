import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor to attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('reachinbox_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  slackConnected: boolean;
  slackTeam?: string | null;
  slackChannel?: string | null;
}

export interface EmailScheduleItem {
  id: string;
  userId: string;
  senderEmail: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  sentAt?: string | null;
  status: 'SCHEDULED' | 'QUEUED' | 'SENT' | 'FAILED' | 'RATE_LIMITED';
  attempts: number;
  delayBetweenEmailsMs: number;
  hourlyLimit: number;
  jobId?: string | null;
  etherealMessageUrl?: string | null;
  error?: string | null;
  createdAt: string;
}

export const authApi = {
  loginWithGoogle: async (credential: string) => {
    const { data } = await api.post('/api/auth/google', { credential });
    return data;
  },
  loginDemo: async (email?: string, name?: string) => {
    const { data } = await api.post('/api/auth/demo', { email, name });
    return data;
  },
  getMe: async (): Promise<{ user: UserProfile }> => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};

export const emailApi = {
  getScheduled: async (query?: string): Promise<{ emails: EmailScheduleItem[] }> => {
    const { data } = await api.get('/api/emails/scheduled', {
      params: query ? { q: query } : {},
    });
    return data;
  },
  getSent: async (query?: string): Promise<{ emails: EmailScheduleItem[] }> => {
    const { data } = await api.get('/api/emails/sent', {
      params: query ? { q: query } : {},
    });
    return data;
  },
  search: async (query: string, status?: string): Promise<{ emails: EmailScheduleItem[] }> => {
    const { data } = await api.get('/api/emails/search', {
      params: { q: query, status },
    });
    return data;
  },
  parseLeads: async (formData: FormData): Promise<{ total: number; emails: string[] }> => {
    const { data } = await api.post('/api/emails/parse-leads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  scheduleEmails: async (payload: {
    subject: string;
    body: string;
    recipients: string[];
    senderEmail?: string;
    startTime: string;
    delayBetweenEmailsMs: number;
    hourlyLimit: number;
  }) => {
    const { data } = await api.post('/api/emails/schedule', payload);
    return data;
  },
};

export const slackApi = {
  getAuthUrl: async (): Promise<{ url: string }> => {
    const { data } = await api.get('/api/slack/auth-url');
    return data;
  },
  disconnect: async () => {
    const { data } = await api.post('/api/slack/disconnect');
    return data;
  },
  testAlert: async () => {
    const { data } = await api.post('/api/slack/test-alert');
    return data;
  },
};
