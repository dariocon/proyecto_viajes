import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, debounceTime, delay, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UsernameValidatorService implements AsyncValidator{


  constructor(private authService: AuthService) {}

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    // Si el valor del control está vacío, la validación se considera válida.
    if (!control.value) {
      return of(null);
    }
    
    return of(control.value).pipe(
      debounceTime(500),  // Espera 500ms tras la última pulsación para evitar peticiones innecesarias 
      distinctUntilChanged(), // Solo continúa si el valor ha cambiado
      switchMap(value => //cancela la petición de validación anterior y lanza una nueva con el valor más reciente, previniendo errores por respuestas tardías.
        this.authService.usernameIsRegistered(value).pipe(
          map(isTaken => (isTaken ? { usernameTaken: true } : null)),// si está en uso devuelve true y, si no, null (es válido)
          catchError(() => of(null)) // Si la llamada falla, se considera válido para no bloquear al usuario
        )
      )
    );
  }


    //Método necesario para validar el nombre de usuario en la edición de usuario.
   userTakenOnEditValidator(originalUsername: string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      // Si el nombre de usuario actual es igual al original, es válido.
      if (control.value === originalUsername) {
        return of(null);
      }
      // Si el campo está vacío, también es válido.
      if (!control.value) {
        return of(null);
      }

      // El resto de la lógica de validación es la misma que la del registro.
      return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value =>
          this.authService.usernameIsRegistered(value).pipe(
            map(isTaken => (isTaken ? { usernameTaken: true } : null)),
            catchError(() => of(null))
          )
        )
      );
    };
  }
}