import { api } from '../api/axios';

interface DirectorRegisterData {
  name: string;
  email: string;
  password: string;
  institutionId: string;
  cargo?: string;
}

export const directorService = {
  async register(data: DirectorRegisterData) {
    const response = await api.post('/directors/register', data);
    return response.data;
  }
};