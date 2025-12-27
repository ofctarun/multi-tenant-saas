import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', status: 'active' });
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user'));

  // 1. API 13: List Projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      const projectData = res.data?.data?.projects || res.data?.projects || [];
      setProjects(projectData);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 2. API 12/14: Create or Update Project logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // API 14: Update Project
        await api.put(`/projects/${currentProjectId}`, newProject);
      } else {
        // API 12: Create Project
        await api.post('/projects', newProject);
      }
      closeModal();
      fetchProjects(); 
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Action failed. Check subscription limits or permissions.';
      alert(errorMsg);
    }
  };

  // 3. API 15: Delete Project logic
  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent navigation to details page
    if (window.confirm("Are you sure? Deleting this project will remove all associated tasks.")) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete project.");
      }
    }
  };

  const openEditModal = (e, project) => {
    e.stopPropagation();
    setIsEditing(true);
    setCurrentProjectId(project.id || project.project_id);
    setNewProject({ 
      name: project.name, 
      description: project.description, 
      status: project.status 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setCurrentProjectId(null);
    setNewProject({ name: '', description: '', status: 'active' });
  };

  if (loading && projects.length === 0) return <div className="main-content">Loading Organization Projects...</div>;

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Organization Projects</h2>
          <p style={{ color: '#6b7280' }}>Manage and track isolated tenant projects.</p>
        </div>
        
        {(user?.role === 'tenant_admin' || user?.role === 'super_admin' || user?.role === 'user') && (
          <button 
            onClick={() => setShowModal(true)} 
            className="btn-primary"
            style={{ width: 'auto', padding: '10px 24px', fontWeight: '600' }}
          >
            + New Project
          </button>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Project Name</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Progress</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600' }}>Created By</th>
              <th style={{ padding: '1rem', color: '#4b5563', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length > 0 ? projects.map(p => (
              <tr 
                key={p.id || p.project_id} 
                style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                className="hover-row"
                onClick={() => navigate(`/projects/${p.id || p.project_id}`)}
              >
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: '#2563eb', fontWeight: '600' }}>{p.name}</span>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.description || 'No description'}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    background: p.status === 'active' ? '#dcfce7' : '#f3f4f6', 
                    color: p.status === 'active' ? '#166534' : '#4b5563', 
                    padding: '4px 10px', borderRadius: '9999px', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' 
                  }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  <strong>{p.task_count || 0}</strong> tasks
                </td>
                <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  {p.creator_name || 'System'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                   {/* RBAC: Only Admins can edit or delete */}
                  {(user?.role === 'tenant_admin' || user?.role === 'super_admin') && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={(e) => openEditModal(e, p)}
                        style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, p.id || p.project_id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="auth-card" style={{ width: '450px', background: 'white', padding: '2.5rem', borderRadius: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              {isEditing ? 'Update Project' : 'Create New Project'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Project Name</label>
                <input 
                  required 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                  value={newProject.name} 
                  onChange={e => setNewProject({...newProject, name: e.target.value})} 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Description</label>
                <textarea 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db', minHeight: '100px' }}
                  value={newProject.description} 
                  onChange={e => setNewProject({...newProject, description: e.target.value})} 
                />
              </div>
              {isEditing && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Status</label>
                  <select 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                    value={newProject.status}
                    onChange={e => setNewProject({...newProject, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.875rem' }}>
                  {isEditing ? 'Save Changes' : 'Create Project'}
                </button>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '0.875rem', background: '#f3f4f6', border: 'none', borderRadius: '0.5rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;