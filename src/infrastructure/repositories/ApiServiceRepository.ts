import { api } from '../../lib/api';

export type ServiceDTO = {
  id: string;
  title: string;
  description: string;
  durationValue: number;
  durationUnit: string;
  durationMinutes: number;
  price: number;
  priceType: string;
  hasDetailedView: boolean;
  detailedDescription: string;
  detailedImages: string[];
  additionalInfo: string;
};

export class ApiServiceRepository {
  async getAll(): Promise<ServiceDTO[]> {
    return api.get('/services');
  }

  async getById(id: string): Promise<ServiceDTO> {
    return api.get(`/services/${id}`);
  }

  async create(service: Omit<ServiceDTO, 'id'>): Promise<ServiceDTO> {
    return api.post('/services', service);
  }

  async update(id: string, service: Partial<ServiceDTO>): Promise<ServiceDTO> {
    return api.put(`/services/${id}`, service);
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/services/${id}`);
  }
}
