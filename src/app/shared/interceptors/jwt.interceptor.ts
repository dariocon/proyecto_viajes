import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../_services/auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken(); 
  const router = inject(Router);
  
  const addToken = (request: typeof req, token: string) => {
      return request.clone({
          headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
  };

  // Evitar interceptar el endpoint de refresh para prevenir bucles infinitos
  if (req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/refresh')) {
    // Si es una de estas rutas, simplemente pasa la petición sin modificarla.
    return next(req); 
  }

  let authReq = req;
  if (accessToken) {
    authReq = addToken(req, accessToken);
  } else {
    // Si no hay token, simplemente deja pasar la petición (será rechazada por el backend, 
    // pero evitas un 401 que no puedes manejar si no estás logueado)
    return next(req);
  }

      return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si da 401 = token expirado
            if (error.status === 401) {              
                // Se refresca token
                return authService.refreshAccessToken().pipe(
                  // switchMap: una vez que la solicitud de refresco finaliza con éxito, 
                  // 'switchMap' toma el nuevo token y descarta ese Observable, sustituyéndolo por un Observable completamente nuevo: 
                  // la PETICIÓN ORIGINAL REINTENTADA. Esto asegura que el componente reciba los datos, no el error 401.
                    switchMap((response: { accessToken: string }) => {
                        // El token se refrescó: clonar la petición original con el nuevo token
                        const newAuthReq = addToken(req, response.accessToken);
                        return next(newAuthReq); // Reintentar la petición
                    }),
                    catchError((refreshError) => {
                        // Si el refresco falló (refresh token expirado o inválido), forzar logout
                        authService.logout();
                        router.navigate(['/login']);
                        return throwError(() => refreshError); // Propagar el error
                    })
                );
            }
            // Cualquier otro error se propaga
            return throwError(() => error);
        })
    );
};
