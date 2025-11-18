import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';

export const editGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const targetUsername = route.paramMap.get('username');

  const loggedInUsername = authService.username; 

  if (loggedInUsername === targetUsername) {
    console.log(`Autorización CONCEDIDA: ${loggedInUsername} puede editar.`);
    return true; 
  } else {
    console.log(`Autorización DENEGADA: ${loggedInUsername} intentó editar.`);
    return router.createUrlTree(['/forbidden']); 
  }

 
};
