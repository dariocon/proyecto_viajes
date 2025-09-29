import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';
import { inject } from '@angular/core';
import { tap } from 'rxjs';

//AÚN NO IMPLEMENTADO
export const loginGuard: CanMatchFn = (route, segments) => {
  console.log('Guardián')
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);
  // if (authService.isLogged()){
  //   return true;
  // }
  // else{
  //   router.navigateByUrl('/login');
  //   return false;
  // }
  return authService.validateToken()
  .pipe(
    tap(valid => {
      console.log('Valid: ', valid)
      if (!valid) router.navigateByUrl('/login')     
    })
  )
};


