import { create } from 'zustand';
import api from '../services/api';
import { joinUserChannel } from '../services/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('agentflow_token');
    const storedUser = localStorage.getItem('agentflow_user');

    if (token) {
      set({ token, isAuthenticated: true, user: storedUser ? JSON.parse(storedUser) : null });
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const user = res.data.data;
          localStorage.setItem('agentflow_user', JSON.stringify(user));
          set({ user, isAuthenticated: true, isLoading: false });
          joinUserChannel(user.id || user._id);
          return;
        }
      } catch (err) {
        console.warn('Auth token validation failed, clearing session.');
        localStorage.removeItem('agentflow_token');
        localStorage.removeItem('agentflow_user');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      joinUserChannel(user.id || user._id);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user, token } = res.data.data;

      localStorage.setItem('agentflow_token', token);
      localStorage.setItem('agentflow_user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      joinUserChannel(user.id || user._id);
      return { success: true, user };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed.';
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
    }
    set({ user: null, token: null, isAuthenticated: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
