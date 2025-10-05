import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, catchError, debounceTime, delay, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EmailValidatorService implements AsyncValidator{

    constructor(private authService: AuthService) {}

    validate(control: AbstractControl): Observable<ValidationErrors | null> {
            if (!control.value) {
                return of(null); 
            }

            return of(control.value).pipe(
                debounceTime(500), // espera 0.5s tras el último cambio para evitar enviar una petición al servidor por cada letra que se escribe.
                distinctUntilChanged(),// evita llamadas repetidas con el mismo valor (si el usuario borra y vuelve a escribir la misma letra)
                switchMap(value => //Toma el valor y lo usa para iniciar una nueva validación. Si ya había una en curso, la cancela automáticamente. Esto previene problemas de "condiciones de carrera" donde una respuesta antigua podría llegar tarde y sobrescribir una nueva.
                    this.authService.emailIsRegistered(value).pipe(
                    map(isTaken => (isTaken ? { emailTaken: true } : null)), // si está en uso devuelve true y, si no, null (es válido)
                    catchError(() => of(null)) // Si la llamada falla, se considera válido para no bloquear al usuario
                    )
                )
                );
    }
    //Método necesario para validar el email en la edición de usuario.
    emailTakenOnEditValidator(originalEmail: string): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
    // Si el valor actual es igual al original, no hay error
    if (control.value === originalEmail) {
        return of(null);
    }
    // Si el campo está vacío, es válido.
    if (!control.value) {
        return of(null);
    }

    return of(control.value).pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(value =>
        this.authService.emailIsRegistered(value).pipe(
            map(isTaken => (isTaken ? { emailTaken: true } : null)),
            catchError(() => of(null))
        )
        )
    );
    };
}
}