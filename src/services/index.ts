// Unified service exports
// All services use the same client which automatically switches based on VITE_USE_MOCK env flag

export { userApiService as userService } from '@/modules/users/services/user.api';
