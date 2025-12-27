import { Navigate, Outlet } from 'react-router-dom';
import PageTransition from './PageTransition';

const ProtectedRoute = () => {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return (
        <PageTransition>
            <Outlet />
        </PageTransition>
    );
};

export default ProtectedRoute;
