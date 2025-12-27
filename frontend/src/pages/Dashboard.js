import React, { useEffect, useState } from 'react';

import api from '../services/api';



const Dashboard = () => {

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));



  useEffect(() => {

    const fetchDashboardData = async () => {

      try {

        setLoading(true);

        // Hits the optimized stats endpoint defined in tenantRoutes.js

        const res = await api.get('/tenants/dashboard/stats');

       

        if (res.data?.success) {

          setData(res.data.data);

        } else {

          setError("Data retrieval unsuccessful.");

        }

      } catch (err) {

        console.error("Error fetching dashboard data:", err);

        setError("Failed to connect to the server.");

      } finally {

        setLoading(false);

      }

    };

    fetchDashboardData();

  }, []);



  if (loading) return <div className="main-content">Loading Organization Summary...</div>;

  if (error) return <div className="main-content" style={{ color: 'red' }}>{error}</div>;

  if (!data) return <div className="main-content">No data available.</div>;



  // Aligning these variables with the SQL aliases: total_projects, active_tasks, total_users

  const { stats, activity } = data;



  return (

    <div>

      <header style={{ marginBottom: '2rem' }}>

        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Dashboard Overview</h2>

        <p style={{ color: '#6b7280' }}>Welcome back, {user?.full_name}.</p>

      </header>



      {/* Real-time Statistics from Database */}

      <div className="stats-grid">

        <div className="stat-card">

          <h3>Total Projects</h3>

          <p>{stats?.total_projects || 0}</p>

        </div>

        <div className="stat-card">

          <h3>Active Tasks</h3>

          <p>{stats?.active_tasks || 0}</p>

        </div>

        <div className="stat-card">

          <h3>Team Capacity</h3>

          <p>{stats?.total_users || 0} Users</p>

        </div>

      </div>



      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>

       

        {/* Subscription Limits Visualization */}

        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>

          <h3 style={{ marginBottom: '1rem' }}>Subscription Status</h3>

          <p>Plan: <strong>{stats?.plan_name || 'Pro Plan'}</strong></p>

          <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', color: '#1e40af', fontSize: '0.875rem' }}>

            Usage: {stats?.total_users}/{stats?.max_users} Users & {stats?.total_projects}/{stats?.max_projects} Projects

          </div>

        </div>



        {/* Recent Activity Feed from Audit Logs */}

        <div style={{ background: 'white', padding: '2rem', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>

          <h3 style={{ marginBottom: '1rem' }}>Recent Activity</h3>

          {activity && activity.length > 0 ? (

            <ul style={{ listStyle: 'none', padding: 0 }}>

              {activity.slice(0, 5).map((log, index) => (

                <li key={index} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f3f4f6', fontSize: '0.875rem' }}>

                  <strong style={{ color: '#2563eb' }}>{log.action.replace(/_/g, ' ')}</strong>

                  <span style={{ color: '#6b7280', float: 'right', fontSize: '0.7rem' }}>

                    {new Date(log.created_at).toLocaleDateString()}

                  </span>

                  <div style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '4px' }}>

                    {/* Pulls data from the JSONB 'details' column */}

                    {log.details?.name || log.details?.title || log.details?.email || 'System update logged'}

                  </div>

                </li>

              ))}

            </ul>

          ) : (

            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No recent activity recorded.</p>

          )}

        </div>

      </div>

    </div>

  );

};



export default Dashboard;