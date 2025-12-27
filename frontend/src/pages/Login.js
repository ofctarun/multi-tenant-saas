import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '', tenantSubdomain: '' });
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            // Trim whitespace and handle empty strings for Super Admin
            const payload = {
                email: credentials.email.trim(),
                password: credentials.password,
                tenantSubdomain: credentials.tenantSubdomain.trim() || null
            };

            const res = await authAPI.login(payload);

            if (res.data.success) {
                localStorage.setItem('token', res.data.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.data.user));
                navigate('/dashboard');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Invalid credentials or subdomain');
        }
    };

    return (
        <div className="auth-card">
            <h2>Welcome Back</h2>
            <form onSubmit={handleLogin} noValidate={false}>
                <div className="form-group">
                    <label>Tenant Subdomain (Leave blank for Super Admin)</label>
                    <input 
                        type="text" 
                        placeholder="e.g., demo" 
                        value={credentials.tenantSubdomain}
                        onChange={e => setCredentials({...credentials, tenantSubdomain: e.target.value})}
                        /* 'required' REMOVED TO ALLOW SUPER ADMIN LOGIN */
                    />
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        required 
                        value={credentials.email}
                        onChange={e => setCredentials({...credentials, email: e.target.value})} 
                    />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        required 
                        value={credentials.password}
                        onChange={e => setCredentials({...credentials, password: e.target.value})} 
                    />
                </div>
                <button type="submit">Sign In</button>
            </form>
            <Link to="/register" className="text-link">Need a new organization? Register</Link>
        </div>
    );
};

export default Login;