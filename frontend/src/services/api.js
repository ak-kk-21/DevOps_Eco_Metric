import axios from 'axios';

// Use localhost for development
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('📥 Response Error:', error.response?.status, error.message);
    if (error.code === 'ERR_NETWORK') {
      console.error('❌ Cannot connect to backend. Is it running on port 8000?');
    }
    return Promise.reject(error);
  }
);

export const calculateTask = async (data) => {
  const response = await api.post('/calculate/task', {
    hardware: data.hardware,
    hours: data.hours,
    region: data.region,
    utilization: data.utilization
  });
  return response;
};

export const getFactors = async () => {
  const response = await api.get('/factors');
  return response;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response;
};

export default api;