import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncidentForm from './IncidentForm';
import { complaintsService } from '../../services/complaints.service';
import { IncidentType } from '../../types/incident';

vi.mock('../../services/complaints.service');

// Mock child components if necessary, but integration testing is better.
// We will test the full flow including the Zod validation in the hook.

describe('IncidentForm', () => {
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
        vi.mocked(complaintsService.createComplaint).mockReset();
        mockOnSuccess.mockReset();
    });

    it('renders all form fields', () => {
        render(<IncidentForm onSuccess={mockOnSuccess} />);
        expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/número de línea/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tipo de incidente/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /enviar reporte/i })).toBeInTheDocument();
    });

    it('validates required fields locally (Zod)', async () => {
        const user = userEvent.setup();
        render(<IncidentForm onSuccess={mockOnSuccess} />);

        // Click submit without filling anything
        await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

        await waitFor(() => {
            // Zod validation errors should appear
            // Email required
            expect(screen.getByText(/el correo electrónico es obligatorio/i)).toBeInTheDocument();
            // Line number required/length
            expect(screen.getByText(/el número de línea debe tener al menos 8 dígitos/i)).toBeInTheDocument();
        });

        expect(complaintsService.createComplaint).not.toHaveBeenCalled();
    });

    it('submits valid data successfully', async () => {
        const user = userEvent.setup();
        vi.mocked(complaintsService.createComplaint).mockResolvedValueOnce({
            ticketId: '123',
            status: 'RECEIVED',
            lineNumber: '0991234567',
            email: 'test@test.com',
            incidentType: IncidentType.NO_SERVICE,
            priority: 'HIGH',
            createdAt: new Date().toISOString(),
            description: 'test description',
        });

        render(<IncidentForm onSuccess={mockOnSuccess} />);

        await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
        await user.type(screen.getByLabelText(/número de línea/i), '0991234567');
        await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.NO_SERVICE);
        await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

        await waitFor(() => {
            expect(complaintsService.createComplaint).toHaveBeenCalledWith(expect.objectContaining({
                email: 'test@test.com',
                lineNumber: '0991234567',
                incidentType: IncidentType.NO_SERVICE,
            }));
        });

        expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('shows error when submission fails', async () => {
        const user = userEvent.setup();
        const errorMsg = 'Error simulado en el servidor';
        vi.mocked(complaintsService.createComplaint).mockRejectedValueOnce(new Error(errorMsg));

        render(<IncidentForm onSuccess={mockOnSuccess} />);

        // Fill valid data
        await user.type(screen.getByLabelText(/correo electrónico/i), 'fail@test.com');
        await user.type(screen.getByLabelText(/número de línea/i), '0991234567');
        await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

        await waitFor(() => {
            expect(screen.getByText(errorMsg)).toBeInTheDocument();
        });

        expect(mockOnSuccess).not.toHaveBeenCalled();
    });
});
