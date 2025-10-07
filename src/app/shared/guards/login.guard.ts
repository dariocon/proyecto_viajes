import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../../_services/auth.service';
import { inject } from '@angular/core';
import { map, of, tap } from 'rxjs';


export const loginGuard: CanMatchFn = (route, segments) => {
  console.log('Guardián')
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  //const token = authService.getToken(); 

  const accessToken = authService.getAccessToken();

  if (!accessToken) {
   
    router.navigateByUrl('/login');
    return of(false); 
  }else {
    return of(true);
  }

/*     if (authService.isLogged){
     return true;
   }
   else{
     router.navigateByUrl('/login');
     return false;
   }  */
/*   
 

        /**
   * Este método valida el token de autenticación del usuario con el servidor.
   * Es más seguro que una simple comprobación local de isLogged, ya que verifica que el token no haya
   * expirado, sido revocado o alterado, protegiendo las rutas privadas y la sesión del usuario.
   * Si el token es inválido, el usuario es redirigido a la página de login.
   */
/*  return authService.validateToken()
  .pipe(
    tap(isValid => {
      console.log('Validación de Token: ', isValid);
      if (!isValid) {
        router.navigateByUrl('/login');
      }
    }),
  
  );*/
};


