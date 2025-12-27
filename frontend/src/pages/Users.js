import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({ 
    email: '', 
    fullName: '', 
    password: '', 
    role: 'user' 
  });
  
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/tenants/users'); 
      const userData = res.data?.data?.users || res.data?.users || [];
      setUsers(userData);
    } catch (err) { 
      console.error("Error fetching users:", err); 
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tenants/users', newUser);
      setShowModal(false);
      setNewUser({ email: '', fullName: '', password: '', role: 'user' });
      fetchUsers(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user. Subscription limit reached.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.id) {
      alert("Security Error: You cannot delete your own account.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this team member?")) {
      try {
        await api.delete(`/tenants/users/${userId}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || "Error deleting user.");
      }
    }
  };

  return (
    <div style={{ padding: '1.5rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Team Management</h2>
          <p style={{ color: '#6b7280' }}>Manage roles and access for your organization.</p>
        </div>
        
        {(currentUser?.role === 'tenant_admin' || currentUser?.role === 'super_admin') && (
          <button 
            onClick={() => setShowModal(true)} 
            className="btn-primary"
            style={{ padding: '10px 24px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Invite Member
          </button>
        )}
      </header>

      <div style={{ background: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Full Name</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Email Address</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center' }}>Loading team members...</td></tr>
            ) : users.length > 0 ? (
              users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{u.full_name || u.fullName}</td>
                  <td style={{ padding: '1rem' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '9999px', 
                      fontSize: '0.7rem', 
                      background: u.role === 'tenant_admin' ? '#fef3c7' : '#f3f4f6',
                      color: u.role === 'tenant_admin' ? '#92400e' : '#374151',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {u.role ? u.role.replace('_', ' ') : 'User'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ color: u.is_active !== false ? '#166534' : '#991b1b', fontSize: '0.875rem', fontWeight: '500' }}>
                      {u.is_active !== false ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {/* UPDATED PERMISSION CHECK */}
                    {(currentUser?.role === 'tenant_admin' || currentUser?.role === 'super_admin') && u.id !== currentUser.id && (
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>No team members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: '450px', background: 'white', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Invite Team Member</h3>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                <input required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
                <input type="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                <input type="password" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', background: 'white' }}>
                  <option value="user">Standard User</option>
                  <option value="tenant_admin">Tenant Administrator</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.875rem' }}>Create User</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f3f4f6', border: 'none', color: '#4b5563', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;