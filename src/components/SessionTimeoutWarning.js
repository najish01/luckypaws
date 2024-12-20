// components/SessionTimeoutWarning.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Define constants at the top of the file
const SESSION_TIMEOUT = 5* 60 * 1000; // 30 minutes in milliseconds
const WARNING_TIME = 5* 30 * 1000; // 5 minutes in milliseconds

const SessionTimeoutWarning = () => {
    const [showWarning, setShowWarning] = useState(false);
    const navigate = useNavigate();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        let warningTimeout;
        let logoutTimeout;

        const resetTimeouts = () => {
            if (warningTimeout) clearTimeout(warningTimeout);
            if (logoutTimeout) clearTimeout(logoutTimeout);

            // Set warning timeout (5 minutes before session expires)
            warningTimeout = setTimeout(() => {
                setShowWarning(true);
            }, SESSION_TIMEOUT - WARNING_TIME);

            // Set logout timeout
            logoutTimeout = setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('loginTime');
                navigate('/login', { 
                    state: { message: 'Session expired. Please login again.' }
                });
            }, SESSION_TIMEOUT);
        };

        // Reset timeouts on user activity
        const handleUserActivity = () => {
            if (localStorage.getItem('token')) {
                resetTimeouts();
                setShowWarning(false);
            }
        };

        // Add event listeners for user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        // Initial timeout setup if user is logged in
        if (localStorage.getItem('token')) {
            resetTimeouts();
        }

        // Cleanup function
        return () => {
            if (warningTimeout) clearTimeout(warningTimeout);
            if (logoutTimeout) clearTimeout(logoutTimeout);
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
        };
    }, [navigate]);

    // Update time left when warning is shown
    useEffect(() => {
        let interval;
        if (showWarning) {
            interval = setInterval(() => {
                const currentTime = Date.now();
                const loginTime = localStorage.getItem('loginTime');
                if (loginTime) {
                    const sessionAge = currentTime - parseInt(loginTime);
                    const timeUntilTimeout = SESSION_TIMEOUT - sessionAge;
                    setTimeLeft(Math.max(0, Math.ceil(timeUntilTimeout / 1000 / 60)));
                }
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showWarning]);

    // Don't show warning if not needed
    if (!showWarning) return null;

    return (
        <div className="session-warning">
            <p>Your session will expire in {timeLeft} minutes.</p>
            <div className="session-warning-buttons">
                <button 
                    onClick={() => {
                        localStorage.setItem('loginTime', Date.now().toString());
                        setShowWarning(false);
                    }}
                    className="extend-button"
                >
                    Extend Session
                </button>
                <button 
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('loginTime');
                        navigate('/login');
                    }}
                    className="logout-button"
                >
                    Logout Now
                </button>
            </div>
        </div>
    );
};

export default SessionTimeoutWarning;
