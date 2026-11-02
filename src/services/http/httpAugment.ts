// Axios request metadata: suppressUnauthorizedEvent помечает bootstrap-запрос профиля,
// чтобы его 401 не эмитил глобальный unauthorized (аноним ≠ потеря сессии).
import 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    suppressUnauthorizedEvent?: boolean;
  }
}
