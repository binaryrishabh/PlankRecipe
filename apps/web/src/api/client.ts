import axios from 'axios';

export const apiClient = axios.create({
  // Defaults to local backend. Can be overridden via VITE_API_URL in .env
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});