import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';

export const loggedGuard: CanMatchFn = (route, segments) => {
  console.log('Ya estás logueado')
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  //const token = authService.getToken(); 

  const accessToken = authService.getAccessToken();

  if (accessToken) {
    router.navigateByUrl('');
    return false; 
  }else {
    return true;
  }
};
