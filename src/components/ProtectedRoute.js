// components/ProtectedRoute.js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, isSessionExpired } = useAuth();
    const navigate = useNavigate();
    const hasChecked = useRef(false);

    useEffect(() => {
        if (!hasChecked.current) {
            hasChecked.current = true;
            if (!user || isSessionExpired()) {
                navigate('/login', {
                    state: { 
                        message: isSessionExpired() 
                            ? 'Session expired. Please login again.' 
                            : 'Please login to continue.' 
                    }
                });
            }
        }
    }, [user, navigate, isSessionExpired]);

    return user ? children : null;
};

export default ProtectedRoute;
