// components/AuthContext.js
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const sessionTimerRef = useRef(null);
    const lastVerifiedRef = useRef(Date.now());
    const isVerifyingRef = useRef(false);

    const logout = useCallback(() => {
        if (sessionTimerRef.current) {
            clearTimeout(sessionTimerRef.current);
            sessionTimerRef.current = null;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        localStorage.setItem('sessionExpired', 'true');
        setUser(null);
    }, []);

    const verifySession = useCallback(async () => {
        if (isVerifyingRef.current) return;
        
        const token = localStorage.getItem('token');
        if (!token) {
            logout();
            return;
        }

        try {
            isVerifyingRef.current = true;
            const response = await axios.get('http://localhost:5000/api/verify-session', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.data.success) {
                logout();
            }
        } catch (error) {
            console.error('Session verification failed:', error);
            logout();
        } finally {
            isVerifyingRef.current = false;
            lastVerifiedRef.current = Date.now();
        }
    }, [logout]);

    // Initialize session management
    useEffect(() => {
        const initializeSession = async () => {
            if (user) {
                await verifySession();
            }
        };

        initializeSession();
    }, [user, verifySession]);

    // Handle session timeout
    useEffect(() => {
        if (!user) return;

        const resetTimer = () => {
            if (sessionTimerRef.current) {
                clearTimeout(sessionTimerRef.current);
            }
            sessionTimerRef.current = setTimeout(logout, SESSION_TIMEOUT);
        };

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastVerifiedRef.current >= SESSION_CHECK_INTERVAL) {
                verifySession();
            }
            resetTimer();
        };

        // Set up initial timer
        resetTimer();

        // Set up activity listeners
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, handleActivity));

        // Cleanup
        return () => {
            if (sessionTimerRef.current) {
                clearTimeout(sessionTimerRef.current);
            }
            events.forEach(event => window.removeEventListener(event, handleActivity));
        };
    }, [user, logout, verifySession]);

    const login = useCallback((token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('loginTime', Date.now().toString());
        localStorage.removeItem('sessionExpired');
        lastVerifiedRef.current = Date.now();
        setUser(userData);
    }, []);

    const contextValue = {
        user,
        login,
        logout,
        isSessionExpired: useCallback(() => 
            localStorage.getItem('sessionExpired') === 'true', 
        [])
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
