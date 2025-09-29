import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap } from 'rxjs';
import { LoginResponse, RegisterResponse, Token,User,UserLogin,UserLoginResponse, UserRegister, VerifiedResponse } from '../_interfaces/user';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';

@Injectable({
providedIn: 'root'
})
export class AuthService {

private apiUrl = 'http://localhost:8080';



http: HttpClient = inject(HttpClient);
private isLoggedSubject = new BehaviorSubject<boolean>(false)
private _username: string = '';

private router: Router = inject(Router);
    constructor(){
    let username = localStorage.getItem('username');
    if (username) {
      this._username = username;
      this.isLoggedSubject.next(true);
    }
   //this.validateToken().subscribe();
  }

  getDecodedAccessToken(token: string): Token | null {
    try {
      return jwtDecode(token);
    } catch(Error) {
      return null;
    }
  }


  //Aún no usado dado que no he implementado Login Guard.
  validateToken(){
    const url = `${this.apiUrl}/verify`;
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${localStorage.getItem('token') || ''}`);

      return this.http.get<LoginResponse>(url, {headers})
      .pipe(
        map( response => {
          const token = this.getDecodedAccessToken(response.token);
            console.log('Token:' , token)
            if (token) {
              this._username = token?.username;
              localStorage.setItem('username', token.username)
              localStorage.setItem('token', response.token);
              this.isLoggedSubject.next(true);
            }
          return true;
        }),
        catchError(err => of(false))
      )

}


get isLogged() {
    return this.isLoggedSubject.asObservable();
}

get username(){
    return this._username;
}

isLoggedF(): boolean{
    if (this.isLogged){
      return true;
    }
    else{
      this.router.navigateByUrl('/login');
      return false;
    }
}



register(userRegister: UserRegister): Observable<RegisterResponse>
{
  return this.http.post<any>(`${this.apiUrl}/register`, userRegister);
}

login(personaLogin: UserLogin) {
  return this.http.post<LoginResponse>(`${this.apiUrl}/login`, 
    {  
      username: personaLogin.username,
      password: personaLogin.password }).pipe(
    tap({
        next: response => {
          const token = this.getDecodedAccessToken(response.token);
          if (token) {
            this._username = token?.username;
            localStorage.setItem('username', token.username)
            localStorage.setItem('token', response.token);
            this.isLoggedSubject.next(true);
          }

        }

    }
    )
  );
}

logout() {
    localStorage.removeItem('username')
    localStorage.removeItem('token')
    this._username = '';
    this.isLoggedSubject.next(false);
    this.router.navigateByUrl('/login')

}



usernameIsRegistered (username: string): Observable<boolean> {
  const url = `${this.apiUrl}/register/check-username/${encodeURIComponent(username)}`;
  return this.http.get<boolean>(url).pipe(
    catchError(() => of(false)) // error= no está
  );
}



emailIsRegistered (email: string): Observable<boolean> {
  const url = `${this.apiUrl}/register/check-email/${encodeURIComponent(email)}`;
  return this.http.get<boolean>(url).pipe(
    catchError(() => of(false))  // error= no está
  );
}

emailTakenValidator(): AsyncValidatorFn {
return (control: AbstractControl) => {
  if (!control.value) return of(null);

  return of(control.value).pipe(
    debounceTime(500),               // espera 0.5s tras el último cambio
    distinctUntilChanged(),          // evita llamadas repetidas con el mismo valor
    switchMap(value => 
      this.emailIsRegistered(value).pipe(
        map(isTaken => (isTaken ? { emailTaken: true } : null)),
        catchError(() => of(null))
      )
    )
  );
};
}

userTakenValidator(): AsyncValidatorFn {
return (control: AbstractControl) => {
  if (!control.value) return of(null);

  return of(control.value).pipe(
    debounceTime(500),               // espera 0.5s tras el último cambio
    distinctUntilChanged(),          // evita llamadas repetidas con el mismo valor
    switchMap(value => 
      this.usernameIsRegistered(value).pipe(
        map(isTaken => (isTaken ? { usernameTaken: true } : null)),
        catchError(() => of(null))
      )
    )
  );
};
}


}


