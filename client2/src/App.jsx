import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CampaignProvider } from './context/CampaignContext';
import Login from './pages/Login';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import RegisterVoter from './pages/RegisterVoter';
import Users from './pages/Users';
import VotersList from './pages/VotersList';
import CensoManagement from './pages/CensoManagement';
import CampaignsPage from './pages/CampaignsPage';
import WhatsAppAgent from './pages/WhatsAppAgent';
import MeetingsPage from './pages/MeetingsPage';
import SocialMediaPage from './pages/SocialMediaPage';
import DiaDDashboard from './features/diaD/DiaDDashboard';
import TerritorialHeatMap from './features/territorio/TerritorialHeatMap';
import DHondtSimulator from './features/simulador/DHondtSimulator';
import LogisticaFlotaDashboard from './features/logistica/LogisticaFlotaDashboard';
import CallCenterOperator from './features/callcenter/CallCenterOperator';
import NecesidadesPage from './pages/NecesidadesPage';
import ParticipaCiudadano from './pages/ParticipaCiudadano';
import GovernancePage from './pages/GovernancePage';

const ProtectedRoute = ({ children, requireAdmin }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    if (requireAdmin && user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/dashboard" />;
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            {/* Rutas Públicas (Sin login) para Participación Ciudadana */}
            <Route path="/participa" element={<ParticipaCiudadano />} />
            <Route path="/necesidad-ciudadana" element={<Navigate to="/participa" replace />} />
            <Route path="/voz-ciudadana" element={<Navigate to="/participa" replace />} />

            <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="gobernanza" element={<GovernancePage />} />
                {/* Rutas operativas avanzadas */}
                <Route path="dia-d" element={<DiaDDashboard />} />
                <Route path="logistica" element={<LogisticaFlotaDashboard />} />
                <Route path="callcenter" element={<CallCenterOperator />} />
                <Route path="territorio" element={<TerritorialHeatMap />} />
                <Route path="necesidades" element={<NecesidadesPage />} />
                <Route path="simulador" element={<DHondtSimulator />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="social" element={<SocialMediaPage />} />
                <Route path="campaigns" element={<CampaignsPage />} />
                <Route path="whatsapp" element={<WhatsAppAgent />} />
                <Route path="register" element={<RegisterVoter />} />
                <Route path="voters" element={<VotersList />} />
                <Route path="censo" element={<CensoManagement />} />
                <Route path="reports" element={<Reports />} />
                <Route path="users" element={<ProtectedRoute requireAdmin={true}><Users /></ProtectedRoute>} />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CampaignProvider>
                    <AppRoutes />
                </CampaignProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}
