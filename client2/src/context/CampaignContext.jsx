import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const CampaignContext = createContext(null);
const API = 'http://localhost:3000/api';

export const CampaignProvider = ({ children }) => {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [activeCampaign, setActiveCampaignState] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    const fetchCampaigns = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API}/campaigns`, authHeaders);
            setCampaigns(res.data);

            const savedId = localStorage.getItem('activeCampaignId');
            if (savedId) {
                const found = res.data.find(c => c.id === parseInt(savedId, 10));
                if (found) {
                    setActiveCampaignState(found);
                } else if (res.data.length > 0) {
                    setActiveCampaignState(res.data[0]);
                    localStorage.setItem('activeCampaignId', res.data[0].id);
                }
            } else if (res.data.length > 0) {
                // Seleccionar la primera campaña por defecto
                setActiveCampaignState(res.data[0]);
                localStorage.setItem('activeCampaignId', res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (user) {
            fetchCampaigns();
        }
    }, [user, fetchCampaigns]);

    const setActiveCampaign = (campaign) => {
        setActiveCampaignState(campaign);
        if (campaign) {
            localStorage.setItem('activeCampaignId', campaign.id);
        } else {
            localStorage.removeItem('activeCampaignId');
        }
    };

    return (
        <CampaignContext.Provider value={{
            campaigns,
            activeCampaign,
            setActiveCampaign,
            refreshCampaigns: fetchCampaigns,
            loading
        }}>
            {children}
        </CampaignContext.Provider>
    );
};

export const useCampaign = () => {
    const context = useContext(CampaignContext);
    if (!context) {
        throw new Error('useCampaign debe ser utilizado dentro de un CampaignProvider');
    }
    return context;
};
