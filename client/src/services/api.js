import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const fetchSchemaDetails = async () => {
  const response = await api.get('/schema');
  return response.data;
};

export default api;
