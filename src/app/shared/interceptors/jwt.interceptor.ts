import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../_services/auth.service';
import { inject } from '@angular/core';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken(); 

  if (token) {
const authReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
    return next(authReq);
  }

  return next(req);
};
