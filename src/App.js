// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import Map from './components/Map';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate} from 'react-router-dom';
import Login from '../src/pages/api/Login';
import Dashboard from '../src/components/Dashboard';
import Register from '../src/pages/api/Register' ;
import { setupAxiosInterceptors } from '../src/utils/api';
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from '../src/components/AuthContext';
import axios from 'axios';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';

function MainContent() {
  const navigate = useNavigate();
  const [isNavVisible, setIsNavVisible] = useState(false);
  const [appointment, setAppointment] = useState({
    petName: '',
    petType: '',
    ownerName: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: '',
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');  // Add this line
  const [showConfirmation, setShowConfirmation] = useState(false);
  


  // Scroll animation effect
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setupAxiosInterceptors(token);
    }
  
    // const testAPI = async () => {
    //   try {
    //     const response = await axios.get('http://localhost:5000/test', {
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json'
    //       }
    //     });
    //     console.log('API Test:', response.data);
    //   } catch (error) {
    //     console.error('API Test Error:', error.message);
    //     setError(error.response?.data?.message || 'Could not connect to server');
    //   }
    // };
  
    // testAPI();
  
    // Your existing Intersection Observer code
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
        }
      });
    });
  
    const hiddenElements = document.querySelectorAll('.hidden');
    hiddenElements.forEach((el) => observer.observe(el));
  
    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        console.log('Submitting appointment:', appointment);

        const response = await fetch('http://localhost:5000/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ appointmentDetails: appointment })
        });

        console.log('Response status:', response.status);

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
            setShowConfirmation(true);
            setAppointment({
                ownerName: '',
                petName: '',
                petType: '',
                email: '',
                phone: '',
                date: '',
                time: '',
                service: '',
                message: ''
            });
        } else {
            throw new Error(data.error || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        setError('Failed to book appointment. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

  const handleChange = (e) => {
    setAppointment({
      ...appointment,
      [e.target.name]: e.target.value
    });
  
    
  };

  // Your existing main content components
  return (
  
    <div className="App">
      <nav className={`navbar ${isNavVisible ? 'active' : ''}`}>
        <div className="logo">
          <span className="paw-icon">🐾</span>
          <h1>Lucky Paws</h1>
        </div>
        <button className="nav-toggle" onClick={() => setIsNavVisible(!isNavVisible)}>
          <span className="hamburger"></span>
        </button>
        <ul className={`nav-links ${isNavVisible ? 'active' : ''}`}>
          <li><a href="#home">Home</a></li>
          <li><a href="#services">Services</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#appointment">Appointment</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><button
  className="login-btn navloginbtn"
  onClick={() => {
    console.log('Navigating to Login page');
    navigate('/Login');
  }}
>
  Login
</button></li>
        </ul>
      </nav>

      <header className="hero" id="home">
        <div className="hero-content">
          <h1 className="hidden">Welcome to Lucky Paws</h1>
          <p className="hidden">Providing exceptional care for your beloved pets</p>
          <a href="#appointment" className="cta-button hidden">Book Appointment</a>
        </div>
      </header>

      <section className="services" id="services">
        <h2 className="section-title hidden">Our Services</h2>
        <div className="services-grid">
          {[
            { title: 'Wellness Exams', icon: '🏥', description: 'Comprehensive health checkups' },
            { title: 'Vaccinations', icon: '💉', description: 'Preventive care and immunizations' },
            { title: 'Surgery', icon: '🔬', description: 'Advanced surgical procedures' },
            { title: 'Dental Care', icon: '🦷', description: 'Complete dental services' },
            { title: 'Emergency Care', icon: '🚑', description: '24/7 emergency services' },
            { title: 'Pet Grooming', icon: '✂️', description: 'Professional grooming services' }
          ].map((service, index) => (
            <div key={index} className="service-card hidden">
              <span className="service-icon">{service.icon}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>
   
<section className="about" id="about">
  <div className="about-content hidden">
    <h2 className="section-title">Why Choose Us?</h2>
    <div className="features-grid">
      <div className="feature">
        <span className="feature-icon">👨‍⚕️</span>
        <h3>Expert Team</h3>
        <p>Experienced veterinarians and staff</p>
      </div>
      <div className="feature">
        <span className="feature-icon">🏆</span>
        <h3>Quality Care</h3>
        <p>State-of-the-art facilities and equipment</p>
      </div>
      <div className="feature">
        <span className="feature-icon">❤️</span>
        <h3>Compassionate Service</h3>
        <p>We treat your pets like family</p>
      </div>
    </div>
  </div>
</section>

<section className="appointment-section" id="appointment">
        <h2 className="section-title hidden">Book an Appointment</h2>
        <div className="appointment-container hidden">
          {error && ( // Add error message display
            <div className="error-message">
              {error}
            </div>
          )}
          {showConfirmation ? (
            <div className="confirmation-message">
              <h3>Thank you for booking!</h3>
              <p>We'll contact you shortly to confirm your appointment.</p>
              <button 
                onClick={() => setShowConfirmation(false)} 
                className="cta-button"
              >
                Book Another Appointment
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="appointment-form">
              <div className="form-grid">
                <div className="form-group">
                  <input
                    type="text"
                    name="petName"
                    placeholder="Pet Name"
                    value={appointment.petName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <select
                    name="petType"
                    value={appointment.petType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Pet Type</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="ownerName"
                    placeholder="Your Name"
                    value={appointment.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={appointment.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone"
                    value={appointment.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="date"
                    name="date"
                    value={appointment.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="time"
                    name="time"
                    value={appointment.time}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <select
                    name="service"
                    value={appointment.service}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Service</option>
                    <option value="checkup">General Checkup</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="dental">Dental Care</option>
                    <option value="surgery">Surgery</option>
                    <option value="grooming">Grooming</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <textarea
                    name="message"
                    placeholder="Additional Notes"
                    value={appointment.message}
                    onChange={handleChange}
                    rows="4"
                  ></textarea>
                </div>
              </div>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isLoading}
              >
                {isLoading ? 'Booking...' : 'Book Appointment'}
              </button>
            </form>
          )}
        </div>
      </section>
      <section className="location-section" id="location">
    <div className="container">
        <h2 className="section-title hidden">Our Location</h2>
        <div className="location-content hidden">
            <div className="location-info">
                <h3>Visit Our Clinic</h3>
                <div className="info-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <p>123 Pet Care Lane<br />Veterinary City</p>
                </div>
                <div className="info-item">
                    <i className="fas fa-phone"></i>
                    <p>(555) 123-4567</p>
                </div>
                <div className="info-item">
                    <i className="fas fa-clock"></i>
                    <div>
                        <p>Monday - Friday: 8am - 8pm</p>
                        <p>Saturday: 9am - 6pm</p>
                        <p>Sunday: 10am - 4pm</p>
                    </div>
                </div>
            </div>
            <div className="map-container">
                <Map />
                <div className="directions-container">
                    <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=25.23934,73.23521`}
          target="_blank"
          rel="noopener noreferrer"
                        className="directions-button"
                    >
                        <i className="fas fa-directions"></i>
                        Get Directions to Our Clinic
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>



      <footer className="footer" id="contact">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Contact Us</h3>
            <p>📞 (555) 123-4567</p>
            <p>📧 info@vetcareplus.com</p>
            <p>📍 123 Pet Care Lane, Veterinary City</p>
          </div>
          <div className="footer-section">
            <h3>Hours</h3>
            <p>Monday - Friday: 8am - 8pm</p>
            <p>Saturday: 9am - 6pm</p>
            <p>Sunday: 10am - 4pm</p>
          </div>
          <div className="footer-section">
            <h3>Emergency</h3>
            <p>24/7 Emergency Services Available</p>
            <p>Emergency: (555) 999-9999</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 VetCare Plus. All rights reserved.</p>
        </div>
      </footer>
    </div>

    
  )
}

function App() { 
  return (
    <AuthProvider>
  <Router>
  <SessionTimeoutWarning />
  <Routes>
    <Route path="/" element={<MainContent />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
      <Route path="/" element={<Navigate to="/login" replace />} />
  </Routes>
</Router>
</AuthProvider>
  );
 
}

export default App;
