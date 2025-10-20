import API from './api';

export const login = (email: string, password: string) => API.post('/api/auth/login', { email, password });
