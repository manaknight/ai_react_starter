import { userMockService } from '../modules/users/services/user.mock';
import { userApiService } from '../modules/users/services/user.api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const userService = USE_MOCK ? userMockService : userApiService;
