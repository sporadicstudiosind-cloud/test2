import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Channels
export const channelApi = {
  list: () => api.get('/channels'),
  listAll: () => api.get('/channels/all'),
  create: (data) => api.post('/channels', data),
  join: (id) => api.post(`/channels/${id}/join`),
  markRead: (id) => api.post(`/channels/${id}/read`),
  getMessages: (id, cursor) => api.get(`/channels/${id}/messages`, { params: { cursor, limit: 50 } }),
};

// Messages
export const messageApi = {
  sendChannel: (channelId, data) => api.post(`/messages/channel/${channelId}`, data),
  sendDM: (userId, data) => api.post(`/messages/dm/${userId}`, data),
  getDMs: (userId, cursor) => api.get(`/messages/dm/${userId}`, { params: { cursor } }),
  react: (messageId, emoji, type) => api.post(`/messages/${messageId}/react`, { emoji, type }),
  delete: (messageId) => api.delete(`/messages/${messageId}`),
  edit: (messageId, content) => api.patch(`/messages/${messageId}`, { content }),
};

// Users
export const userApi = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  updateMe: (data) => api.patch('/users/me', data),
  uploadPfp: (formData) => api.post('/users/me/pfp', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadCardBg: (formData) => api.post('/users/me/card-bg', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAchievements: () => api.get('/users/me/achievements'),
};

// Shop
export const shopApi = {
  getItems: () => api.get('/shop/items'),
  buy: (itemId) => api.post(`/shop/buy/${itemId}`),
  equip: (itemId) => api.post(`/shop/equip/${itemId}`),
  inventory: () => api.get('/shop/inventory'),
};

// Search
export const searchApi = {
  search: (params) => api.get('/search', { params }),
};
