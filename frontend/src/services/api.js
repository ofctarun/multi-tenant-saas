import axios from 'axios';

/**
 * 1. DYNAMIC BASE URL
 * In Docker, this must point to the exposed port 5000 of the backend container.
 */
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * 2. REQUEST INTERCEPTOR
 * Automatically attaches the JWT token from localStorage to every outgoing request.
 */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

/**
 * 3. RESPONSE INTERCEPTOR
 * Handles global errors like unauthorized access (401) or forbidden plan limits (403).
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- API MODULES MAPPED TO YOUR BACKEND ROUTES ---

// Module 1: Auth & Registration (API 1, 2, 3, 4)
export const authAPI = {
    registerTenant: (data) => api.post('/auth/register-tenant', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Module 2: Project Management (API 12, 13, 14, 15)
export const projectAPI = {
    getProjects: () => api.get('/projects'), 
    getProjectById: (id) => api.get(`/projects/${id}`),
    createProject: (data) => api.post('/projects', data), // Enforces plan limits
    updateProject: (id, data) => api.put(`/projects/${id}`, data),
    deleteProject: (id) => api.delete(`/projects/${id}`),
    
    // Task Management Sub-module (API 16, 17, 18, 19)
    getProjectTasks: (projectId) => api.get(`/projects/${projectId}/tasks`),
    createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
    updateTask: (taskId, data) => api.put(`/projects/tasks/${taskId}`, data),
    updateTaskStatus: (taskId, status) => api.patch(`/projects/tasks/${taskId}/status`, { status }),
    deleteTask: (taskId) => api.delete(`/projects/tasks/${taskId}`)
};

// Module 3: User & Organization Management (API 8, 9, 10, 11)
export const userAPI = {
    getUsers: () => api.get('/tenants/users'),
    addUser: (data) => api.post('/tenants/users', data), // Enforces plan limits
    updateUser: (id, data) => api.put(`/tenants/users/${id}`, data),
    deleteUser: (id) => api.delete(`/tenants/users/${id}`)
};

// Module 4: Analytics & Admin Tools (API 5, 6, 7)
export const dashboardAPI = {
    getStats: () => api.get('/tenants/dashboard/stats'), // Multi-tenant Dashboard
    getTenants: () => api.get('/tenants'), // Super Admin only
    updateTenant: (id, data) => api.put(`/tenants/${id}`, data)
};

export default api;