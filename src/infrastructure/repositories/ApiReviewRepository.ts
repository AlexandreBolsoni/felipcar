import { api } from '../../lib/api';

export type ReviewDTO = {
  id: string;
  authorName: string;
  carModel: string;
  rating: number;
  comment: string;
  date: string;
  hidden: boolean;
  ownerReply: string | null;
};

export class ApiReviewRepository {
  async getAll(): Promise<ReviewDTO[]> {
    return api.get('/reviews');
  }

  async getPublicVisible(): Promise<ReviewDTO[]> {
    return api.get('/reviews/visible');
  }

  async create(review: Omit<ReviewDTO, 'id'>): Promise<ReviewDTO> {
    return api.post('/reviews', review);
  }

  async update(id: string, review: Partial<ReviewDTO>): Promise<ReviewDTO> {
    return api.put(`/reviews/${id}`, review);
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/reviews/${id}`);
  }
}
