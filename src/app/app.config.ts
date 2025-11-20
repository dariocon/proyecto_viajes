import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './shared/interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), 
  provideHttpClient(withInterceptors([jwtInterceptor])), 
  provideRouter(routes,withViewTransitions(),withInMemoryScrolling({ 
        scrollPositionRestoration: 'top' 
      }), withComponentInputBinding())]
};
