import API from './api';

// get products with optional query
export const fetchProducts = (params = {}) => API.get('/api/products', { params });

// create product with multipart/form-data (files under 'images')
export const createProduct = (data: FormData, token: string) =>
  API.post('/api/products', data, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }});
