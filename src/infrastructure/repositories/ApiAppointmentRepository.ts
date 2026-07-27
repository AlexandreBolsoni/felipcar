import { api } from '../../lib/api';

export type AppointmentDTO = {
  id: string;
  clientName: string;
  clientPhone: string;
  carModel: string;
  carPlate: string;
  serviceId: string;
  date: string;
  hour: string;
  status: string;
};

export class ApiAppointmentRepository {
  async getAll(): Promise<AppointmentDTO[]> {
    return api.get('/appointments');
  }

  async getByDate(date: string): Promise<AppointmentDTO[]> {
    return api.get(`/appointments/date/${date}`);
  }

  async create(appointment: Omit<AppointmentDTO, 'id'>): Promise<AppointmentDTO> {
    return api.post('/appointments', appointment);
  }

  async update(id: string, appointment: Partial<AppointmentDTO>): Promise<AppointmentDTO> {
    return api.put(`/appointments/${id}`, appointment);
  }
}
