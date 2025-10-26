import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  console.log('Guardián de rol')
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  const role = authService.role;
  const allowedRoles: string[] = route.data['roles'] || [];

  if (allowedRoles.includes(role)) {
    return true; 
  }else {
     router.navigateByUrl('');
    return false;
  }
};
