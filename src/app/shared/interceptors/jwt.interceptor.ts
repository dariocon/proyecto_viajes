import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../../_services/auth.service';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { Router } from '@angular/router';

// Bandera global para controlar si ya hay un refresh en curso
let isRefreshing = false;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Función para añadir el token Authorization a la petición
  const addToken = (request: typeof req, token: string) => {
    const rawToken = token.startsWith('Bearer ') ? token.substring(7) : token;
    return request.clone({
      headers: request.headers.set('Authorization', `Bearer ${rawToken}`)
    });
  };

  const publicUrls = [
    '/login',
    '/register',
    '/refresh',
    '/categorias',
    '/verify',
    '/register/check-email',
    '/register/check-username'
  ];
  const isRefreshUrl = req.url.includes('/refresh');
  const isPublic = publicUrls.some(url => req.url.includes(url));

  // Si es ruta pública o refresh, pasa la petición tal cual
  if (isPublic || isRefreshUrl) {
    return next(req);
  }

// Obtener token de acceso del AuthService
  const accessToken = authService.getAccessToken();
  let authReq = req;

  if (accessToken) {
    authReq = addToken(req, accessToken);
  } else {
    return next(req); // Si no hay token, dejar pasar la petición tal cual
  }
 // Interceptar la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {  // Si da 401, significa que el token expiró
        // Si ya hay un refresh en curso, devolver el error y que la petición falle
        if (isRefreshing) {
          // Mientras se refresca, dejar pasar el error para que el componente lo maneje
          return throwError(() => error);
        }
       // Iniciar el refresh del token
        isRefreshing = true;

        return authService.refreshAccessToken().pipe(
            // switchMap: una vez que la solicitud de refresco finaliza con éxito, 
            // 'switchMap' toma el nuevo token y descarta ese Observable, sustituyéndolo por un Observable completamente nuevo: 
            // la PETICIÓN ORIGINAL REINTENTADA. Esto asegura que el componente reciba los datos, no el error 401.
          switchMap((response: { accessToken: string }) => {
            // El refresh terminó, actualizar bandera
            isRefreshing = false;
            // Reintentar la petición original con el nuevo token
            const newAuthReq = addToken(req, response.accessToken);
            return next(newAuthReq);
          }),
          catchError((refreshError) => {
            // Si el refresh falla (refresh token inválido o expirado), forzar logout
            console.error('Refresh token falló:', refreshError);
            isRefreshing = false;
            authService.logout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
