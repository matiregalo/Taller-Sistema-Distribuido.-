import { describe, it, expect, beforeEach } from 'vitest';
import { complaintsRepository } from './complaints.repository.js';
import { IncidentType } from '../types/ticket.types.js';

const baseTicket = {
  lineNumber: '099123456',
  email: 'a@b.com',
  incidentType: IncidentType.NO_SERVICE,
  description: null as string | null,
  status: 'RECEIVED' as const,
  priority: 'PENDING' as const,
  createdAt: new Date(),
};

describe('complaintsRepository', () => {
  beforeEach(() => {
    complaintsRepository.clear();
  });

  it('save persiste y findById devuelve el ticket', () => {
    const ticket = { ...baseTicket, ticketId: 'id-1' };
    complaintsRepository.save(ticket);
    expect(complaintsRepository.findById('id-1')).toEqual(ticket);
  });

  it('findById devuelve undefined cuando no existe', () => {
    expect(complaintsRepository.findById('no-existe')).toBeUndefined();
  });

  it('findAll devuelve todos los tickets', () => {
    const t1 = { ...baseTicket, ticketId: 'a' };
    const t2 = { ...baseTicket, ticketId: 'b' };
    complaintsRepository.save(t1);
    complaintsRepository.save(t2);
    const all = complaintsRepository.findAll();
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.ticketId).sort()).toEqual(['a', 'b']);
  });

  it('count devuelve la cantidad de tickets', () => {
    expect(complaintsRepository.count()).toBe(0);
    complaintsRepository.save({ ...baseTicket, ticketId: '1' });
    expect(complaintsRepository.count()).toBe(1);
    complaintsRepository.save({ ...baseTicket, ticketId: '2' });
    expect(complaintsRepository.count()).toBe(2);
  });

  it('clear elimina todos los tickets', () => {
    complaintsRepository.save({ ...baseTicket, ticketId: 'x' });
    expect(complaintsRepository.count()).toBe(1);
    complaintsRepository.clear();
    expect(complaintsRepository.count()).toBe(0);
    expect(complaintsRepository.findById('x')).toBeUndefined();
  });
});
