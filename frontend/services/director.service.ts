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
    const response = await api.post('/auth/register/director', data);
    return response.data;
  }
};