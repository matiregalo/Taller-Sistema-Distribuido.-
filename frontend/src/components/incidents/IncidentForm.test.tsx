import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IncidentForm from './IncidentForm';
import { complaintsService } from '../../services/complaints.service';
import { IncidentType } from '../../types/incident';

vi.mock('../../services/complaints.service');

describe('IncidentForm', () => {
  beforeEach(() => {
    vi.mocked(complaintsService.createComplaint).mockReset();
  });

  it('renderiza campos: email, número de línea, tipo de incidente, descripción y botón enviar', () => {
    render(<IncidentForm />);
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/número de línea/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de incidente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar reporte/i })).toBeInTheDocument();
  });

  it('ofrece todos los tipos de incidente del dominio (sin prioridad en UI)', () => {
    render(<IncidentForm />);
    const select = screen.getByLabelText(/tipo de incidente/i);
    expect(select).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    const values = options.map((o) => (o as HTMLOptionElement).value);
    expect(values).toContain(IncidentType.NO_SERVICE);
    expect(values).toContain(IncidentType.INTERMITTENT_SERVICE);
    expect(values).toContain(IncidentType.SLOW_CONNECTION);
    expect(values).toContain(IncidentType.ROUTER_ISSUE);
    expect(values).toContain(IncidentType.BILLING_QUESTION);
    expect(values).toContain(IncidentType.OTHER);
    expect(values).not.toContain('HIGH');
    expect(values).not.toContain('LOW');
    expect(values).not.toContain('MEDIUM');
    expect(values).not.toContain('PENDING');
  });

  it('envía al API exactamente lineNumber, email, incidentType y description cuando se completa el formulario', async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockResolvedValueOnce({
      ticketId: 'ticket-1',
      status: 'RECEIVED',
    });

    render(<IncidentForm />);
    await user.type(screen.getByLabelText(/correo electrónico/i), 'test@example.com');
    await user.type(screen.getByLabelText(/número de línea/i), '0991234567');
    await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.NO_SERVICE);
    await user.type(screen.getByLabelText(/descripción/i), 'Sin conexión');
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(complaintsService.createComplaint).toHaveBeenCalledWith({
        email: 'test@example.com',
        lineNumber: '0991234567',
        incidentType: IncidentType.NO_SERVICE,
        description: 'Sin conexión',
      });
    });
    expect(complaintsService.createComplaint).toHaveBeenCalledTimes(1);
  });

  it('no intenta priorizar: solo envía incidentType tal cual lo elige el usuario', async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockResolvedValueOnce({
      ticketId: 'ticket-2',
      status: 'RECEIVED',
    });

    render(<IncidentForm />);
    await user.type(screen.getByLabelText(/correo electrónico/i), 'a@b.com');
    await user.type(screen.getByLabelText(/número de línea/i), '0987654321');
    await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.ROUTER_ISSUE);
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(complaintsService.createComplaint).toHaveBeenCalledWith(
        expect.objectContaining({
          incidentType: IncidentType.ROUTER_ISSUE,
        })
      );
    });
  });

  it('exige descripción cuando el tipo es OTHER y muestra error si falta', async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockReset();

    render(<IncidentForm />);
    await user.type(screen.getByLabelText(/correo electrónico/i), 'other@test.com');
    await user.type(screen.getByLabelText(/número de línea/i), '0990000000');
    await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.OTHER);
    const descriptionField = screen.getByLabelText(/descripción/i);
    await user.clear(descriptionField);
    // Bypass HTML5 validation para ejercitar la validación cliente (mensaje de error)
    const form = screen.getByRole('button', { name: /enviar reporte/i }).closest('form');
    if (form) {
      form.noValidate = true;
    }
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(screen.getByText(/la descripción es obligatoria cuando seleccionas "Otro"/i)).toBeInTheDocument();
    });
    expect(complaintsService.createComplaint).not.toHaveBeenCalled();
  });

  it('permite enviar con tipo OTHER si la descripción está completa', async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockResolvedValueOnce({
      ticketId: 'ticket-other',
      status: 'RECEIVED',
    });

    render(<IncidentForm />);
    await user.type(screen.getByLabelText(/correo electrónico/i), 'other@test.com');
    await user.type(screen.getByLabelText(/número de línea/i), '0990000000');
    await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.OTHER);
    await user.type(screen.getByLabelText(/descripción/i), 'Problema con el módem');
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(complaintsService.createComplaint).toHaveBeenCalledWith({
        email: 'other@test.com',
        lineNumber: '0990000000',
        incidentType: IncidentType.OTHER,
        description: 'Problema con el módem',
      });
    });
  });

  it('muestra error del API cuando createComplaint falla', async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockRejectedValueOnce(
      new Error('Error al enviar el reporte')
    );

    render(<IncidentForm />);
    await user.type(screen.getByLabelText(/correo electrónico/i), 'fail@test.com');
    await user.type(screen.getByLabelText(/número de línea/i), '0991111111');
    await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.NO_SERVICE);
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(screen.getByText('Error al enviar el reporte')).toBeInTheDocument();
    });
  });

  it('abre el modal de éxito tras envío correcto', async () => {
    const user = userEvent.setup();
    vi.mocked(complaintsService.createComplaint).mockResolvedValueOnce({
      ticketId: 'ok-1',
      status: 'RECEIVED',
    });

    render(<IncidentForm />);
    await user.type(screen.getByLabelText(/correo electrónico/i), 'ok@test.com');
    await user.type(screen.getByLabelText(/número de línea/i), '0992222222');
    await user.selectOptions(screen.getByLabelText(/tipo de incidente/i), IncidentType.SLOW_CONNECTION);
    await user.click(screen.getByRole('button', { name: /enviar reporte/i }));

    await waitFor(() => {
      expect(screen.getByText(/reporte enviado/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument();
    });
  });
});
