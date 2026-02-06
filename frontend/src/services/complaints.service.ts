import type { CreateIncidentRequest } from '../types/incident';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const complaintsService = {
    createComplaint: async (data: CreateIncidentRequest) => {
        try {
            const response = await fetch(`${API_BASE_URL}/complaints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const rawMessage = errorData.details ?? errorData.error;
                if (rawMessage) console.error('Complaints API error:', rawMessage);
                throw new Error('Error al enviar el reporte');
            }

            return await response.json();
        } catch (error) {
            console.error('Complaints Service Error:', error);
            throw error;
        }
    },

    getComplaint: async (ticketId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/complaints/${ticketId}`);

            if (!response.ok) {
                console.error('getComplaint failed:', response.status);
                throw new Error('No se pudo encontrar el reporte');
            }

            return await response.json();
        } catch (error) {
            console.error('Complaints Service Error:', error);
            throw error;
        }
    },
};
