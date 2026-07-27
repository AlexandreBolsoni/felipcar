import { api } from '../../lib/api';
import type { BusinessHoursConfig } from './MockBusinessHoursRepository';

export class ApiBusinessHoursRepository {
  async get(): Promise<BusinessHoursConfig> {
    return api.get('/business-hours');
  }

  async update(config: Partial<BusinessHoursConfig>): Promise<BusinessHoursConfig> {
    return api.put('/business-hours', config);
  }
}
