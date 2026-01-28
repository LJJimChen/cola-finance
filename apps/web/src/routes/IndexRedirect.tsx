import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Loading } from '../components/Loading';

export function IndexRedirect() {
    const navigate = useNavigate();
    
    React.useEffect(() => {
         const token = window.localStorage.getItem('cola.finance.authToken');
         if (token) {
             navigate({ to: '/dashboard' });
         } else {
             navigate({ to: '/welcome' });
         }
    }, [navigate]);

    return <Loading />;
}
