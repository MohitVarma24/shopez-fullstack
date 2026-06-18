import axios from 'axios';

const API = axios.create({
  baseURL: 'https://shopez-backend-kkdv.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to include token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopez_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
