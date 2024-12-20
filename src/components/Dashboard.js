import React, { useState, useEffect } from 'react';
import {
  FaCalendarAlt, FaPaw, FaClock, FaSearch,
  FaBell, FaChartLine, FaClinicMedical, FaStethoscope, FaBars, FaTimes
} from 'react-icons/fa';
import { useAuth } from './AuthContext';

import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import { jwtDecode } from "jwt-decode";



const Dashboard = () => {
  
  const { logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState({
    full_name: 'Doctor' // default value
  });
  const [searchDate, setSearchDate] = useState('');


  useEffect(() => {
    fetchUserData();

    fetchAppointments();
  }, []);
  const navigate = useNavigate();
  // ... your existing state declarations

  // Add this function to handle logo click
  const handleLogoClick = () => {
    logout();
  };
  const getUserDataFromToken = () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Use jwtDecode instead of jwt_decode
        const decoded = jwtDecode(token);
        console.log('Decoded token:', decoded); // Check what's in your token
        return {
          full_name: decoded.name || decoded.full_name || decoded.email?.split('@')[0] || 'Doctor'
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return { full_name: 'Doctor' };
  };

  const fetchUserData = async () => {
    try {
      // First try to get user data from token
      const tokenData = getUserDataFromToken();
      setUserData(tokenData);

      // Then try to fetch updated user data from API
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/login', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Profile API response:', data); // Check what data you receive

        // Update user data with whatever fields are available
        setUserData({
          full_name: data.name || data.full_name || data.email?.split('@')[0] || tokenData.full_name
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    }
  };

  // Handle marking appointment as completed
  const handleComplete = async (appointment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' })
      });

      if (!response.ok) throw new Error('Failed to complete appointment');

      setAppointments(appointments.map(apt =>
        apt.id === appointment.id
          ? { ...apt, status: 'completed' }
          : apt
      ));

    } catch (error) {
      console.error('Error completing appointment:', error);
      setError('Failed to complete appointment');
    }
  };
  // Handle cancelling appointment
  const handleCancel = async (appointment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (!response.ok) throw new Error('Failed to cancel appointment');

      setAppointments(appointments.map(apt =>
        apt.id === appointment.id
          ? { ...apt, status: 'cancelled' }
          : apt
      ));

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment');
    }
  };

  // Add new function to handle marking as upcoming
  const handleMarkUpcoming = async (appointment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: null })
      });

      if (!response.ok) throw new Error('Failed to update appointment');

      setAppointments(appointments.map(apt =>
        apt.id === appointment.id
          ? { ...apt, status: null }
          : apt
      ));

    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment');
    }
  };
  // Get filtered appointments based on active tab and search term
  const getFilteredAppointments = () => {
    return appointments.filter(appointment => {
      // Convert appointment date to string format for searching
      const appointmentDate = new Date(appointment.appointment_date)
        .toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      // Check if search term matches name or date
      const matchesSearch =
        appointment.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointmentDate.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply filters based on active tab
      switch (activeTab) {
        case 'completed':
          return matchesSearch && appointment.status === 'completed';
        case 'cancelled':
          return matchesSearch && appointment.status === 'cancelled';
        case 'upcoming':
          return matchesSearch && !appointment.status;
        default:
          return matchesSearch;
      }
    });
  };


  const filteredAppointments = getFilteredAppointments();

  // Get counts for stats
  const getStats = () => ({
    total: appointments.length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    upcoming: appointments.filter(apt => !apt.status).length
  });
  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem('token');
    // Redirect to login page
    navigate('/login');
  };

  const stats = getStats();

  return (
    <div className="dashboard-container">
      {/* Mobile Navigation */}
      <nav className="mobile-nav">
        <div className="mobile-nav-header">
          <FaClinicMedical className="logo-icon" />
          <h1>Lucky paws</h1>
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="mobile-menu">
            <button className="nav-item active">
              <FaCalendarAlt /> Dashboard
            </button>
            <button className="nav-item" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        )}
      </nav>
      <aside className="sidebar desktop-only">
        <div
          className="logo-container"
          onClick={handleLogoClick}
          style={{ cursor: 'pointer' }}
        >
          <FaClinicMedical className="logo-icon" />
          <h1>Lucky paws</h1>
        </div>
        <nav className="nav-menu">
          <button className="nav-item" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
          <button className="nav-item active">
            <FaCalendarAlt /> Dashboard
          </button>
        </nav>
      </aside>
      <main className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Welcome Back, {userData.full_name}!</h1>
            <p>Here's your practice overview</p>
          </div>
          <div className="header-right">
          <div className="search-container">
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search by owner, pet name or date (e.g., January 15, 2024)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            className="clear-search"
            onClick={() => setSearchTerm('')}
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
          </div>
        </header>
        <div className="stats-container">
          <div className="stat-card gradient-purple">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <h3>Total Appointments</h3>
              <p>{stats.total}</p>
              <span className="trend positive">All Time</span>
            </div>
          </div>
          <div className="stat-card gradient-blue">
            <div className="stat-icon">
              <FaPaw />
            </div>
            <div className="stat-details">
              <h3>Upcoming</h3>
              <p>{stats.upcoming}</p>
              <span className="trend">Pending</span>
            </div>
          </div>
          <div className="stat-card gradient-green">
            <div className="stat-icon">
              <FaStethoscope />
            </div>
            <div className="stat-details">
              <h3>Completed</h3>
              <p>{stats.completed}</p>
              <span className="trend positive">Done</span>
            </div>
          </div>
          <div className="stat-card gradient-orange">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-details">
              <h3>Cancelled</h3>
              <p>{stats.cancelled}</p>
              <span className="trend negative">Cancelled</span>
            </div>
          </div>
        </div>
 <div className="appointments-list">
    {getFilteredAppointments().length > 0 ? (
      getFilteredAppointments().map((appointment) => (
        <div key={appointment.id} className="appointment-card">
          {/* ... your existing appointment card code ... */}
        </div>
      ))
    ) : (
      <div className="no-results">
        <p>No appointments found matching "{searchTerm}"</p>
      </div>
    )}
  </div>
        {/* Appointments Section */}
        <section className="appointments-section">
          <div className="section-header">
            <h2>Appointments</h2>
            <div className="tab-buttons">
              <button
                className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button
                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed
              </button>
              <button
                className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setActiveTab('cancelled')}
              >
                Cancelled
              </button>
              <button
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
            </div>
          </div>

          <div className="appointments-grid">
            {filteredAppointments.length === 0 ? (
              <div className="no-appointments">
                <FaPaw className="no-appointments-icon" />
                <p>No {activeTab} appointments found</p>
              </div>
            ) : (
              filteredAppointments.map(appointment => (
                <div key={appointment.id} className="appointment-card">
                  <div className="appointment-header">
                    <div className="patient-info">
                      <div className="avatar">
                        {appointment.pet_name?.[0]}
                      </div>
                      <div className="details">
                        <h3>{appointment.pet_name}</h3>
                        <p>{appointment.owner_name}</p>
                      </div>
                    </div>
                    <div className={`status-badge ${appointment.status || 'pending'}`}>
                      {appointment.status || 'pending'}
                    </div>
                  </div>

                  <div className="appointment-body">
                    <div className="info-row">
                      <FaCalendarAlt />
                      <span>{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                    </div>
                    <div className="info-row">
                      <FaClock />
                      <span>{appointment.appointment_time}</span>
                    </div>
                    {appointment.reason && (
                      <p className="appointment-notes">{appointment.reason}</p>
                    )}
                  </div>

                  <div className="appointment-footer">
                    {!appointment.status ? (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => handleCancel(appointment)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => handleComplete(appointment)}
                        >
                          Mark as Done
                        </button>
                      </>
                    ) : (
                      <div className="status-actions">
                        <span className={`status-text ${appointment.status}`}>
                          ✓ {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        <button
                          className="btn-secondary"
                          onClick={() => handleMarkUpcoming(appointment)}
                        >
                          Mark as Upcoming
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
