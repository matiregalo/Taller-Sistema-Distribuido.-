import {describe, it, expect, vi} from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuccessModal from './SuccessModal';

describe('SuccessModal', () => {
  it('no renderiza nada cuando isOpen es false', () => {
    render(<SuccessModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText(/reporte enviado/i)).not.toBeInTheDocument();
  });

  it('muestra mensaje de éxito y botón Entendido cuando isOpen es true', () => {
    render(<SuccessModal isOpen onClose={vi.fn()} />);
    expect(screen.getByText(/reporte enviado/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entendido/i })).toBeInTheDocument();
  });

  it('llama onClose al hacer clic en Entendido', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SuccessModal isOpen onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: /entendido/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
