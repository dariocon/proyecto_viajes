import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { LoginResponse, RegisterResponse, Token,User,UserEdit,UserLogin,UserLoginResponse, UserRegister, VerifiedResponse } from '../_interfaces/user';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';

@Injectable({
providedIn: 'root'
})
export class AuthService {

private apiUrl = 'http://localhost:8080';
http: HttpClient = inject(HttpClient);
//private isLoggedSubject = new BehaviorSubject<boolean>(false)
private isLoggedSignal = signal<boolean>(false)
private _username: string = '';

private isRefreshing = new BehaviorSubject<boolean>(false);
private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

private roleSubject = new BehaviorSubject<string>('');
role$ = this.roleSubject.asObservable();

private router: Router = inject(Router);
    constructor(){
        const accessToken = localStorage.getItem('accessToken');
        const username = localStorage.getItem('username');

        if (username) {
          this._username = username;
          this.isLoggedSignal.set(true);
        }

        if (accessToken) {
          const tokenInfo = this.getDecodedAccessToken(accessToken);
          if (tokenInfo?.role) {
            this.roleSubject.next(tokenInfo.role);
          }
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

getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}

getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
}

setRole(role: string) {
  this.roleSubject.next(role);
}

get refreshing$() {
  return this.isRefreshing.asObservable();
}

get refreshToken$() {
  return this.refreshTokenSubject.asObservable();
}

setRefreshing(value: boolean) {
  this.isRefreshing.next(value);
}

setRefreshToken(token: string | null) {
  this.refreshTokenSubject.next(token);
}



private saveTokens(accessToken: string, refreshToken: string): void {
  // Quitar "Bearer " de forma más agresiva (puede venir con mayúsculas/minúsculas)
  const cleanAccessToken = accessToken.trim().replace(/^Bearer\s*/gi, '');
  const cleanRefreshToken = refreshToken.trim().replace(/^Bearer\s*/gi, '');
    
  localStorage.setItem('accessToken', cleanAccessToken);
  localStorage.setItem('refreshToken', cleanRefreshToken);
  
  const tokenInfo = this.getDecodedAccessToken(cleanAccessToken);
  if (tokenInfo) {
    this._username = tokenInfo.username;
    localStorage.setItem('username', tokenInfo.username);
    this.isLoggedSignal.set(true);
    if (tokenInfo?.role) {
      this.roleSubject.next(tokenInfo.role);
    }
  }
}


get isLogged() {
  return this.isLoggedSignal.asReadonly();
}

isLoggedF(): boolean{
  // return this.isLogged();
  if (this.isLogged()){
    return true;
  }
  else{
    //this.router.navigateByUrl('/login');
    return false;
  }
}

get username(){
  return this._username;
}
get role(): string {
  return this.roleSubject.value;
}
getUser(): Observable<UserEdit> {
return this.http.get<UserEdit>(`${this.apiUrl}/usuarios/${this._username}`);
}

getToken(): string | null {
return localStorage.getItem('token');
}

register(userRegister: UserRegister): Observable<RegisterResponse>
{
return this.http.post<any>(`${this.apiUrl}/register`, userRegister);
}

login(personaLogin: UserLogin) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {  
        username: personaLogin.username,
        password: personaLogin.password 
    }).pipe(
        tap({
            next: response => {
                this.saveTokens(response.accessToken, response.refreshToken); 
                this.refreshTokenSubject.next(response.refreshToken);
                const tokenInfo = this.getDecodedAccessToken(response.accessToken);
                if (tokenInfo?.role) this.roleSubject.next(tokenInfo.role);
            }
        })
    );
}


/*refreshAccessToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    const url = `${this.apiUrl}/refresh`;

    if (!refreshToken) {
        this.logout();
        return throwError(() => new Error('no hay refresh token disponible.'));
    }

    return this.http.post<{ accessToken: string, refreshToken: string }>(url, { refreshToken })
        .pipe(
            tap(response => {
                this.saveTokens(response.accessToken, response.refreshToken);
                this.refreshTokenSubject.next(response.refreshToken);
            }),
            catchError(error => {
                // Si falla el refresco (token expirado o inválido)
                this.logout();
                return throwError(() => error);
            })
        );
}*/

refreshAccessToken(): Observable<any> {
  const refreshToken = this.getRefreshToken();
  const url = `${this.apiUrl}/refresh`;

  if (!refreshToken) {
    this.logout();
    return throwError(() => new Error('No refresh token'));
  }

  return this.http.post<{ accessToken: string; refreshToken: string }>(url, { refreshToken }).pipe(
    tap(response => {
      this.saveTokens(response.accessToken, response.refreshToken);
      this.refreshTokenSubject.next(response.refreshToken);
    }),
    catchError((error) => { // Si falla el refresco (token expirado o inválido)
      this.logout();
      return throwError(() => error);
    })
  );
}

logout() {
  localStorage.removeItem('username')
  localStorage.removeItem('accessToken'); 
  localStorage.removeItem('refreshToken');
  this._username = '';
  this.isLoggedSignal.set(false);
  this.router.navigateByUrl('/login')
  this.roleSubject.next('');

}

editUser(user : UserEdit):Observable<UserEdit>{
return this.http.put<UserEdit>(`${this.apiUrl}/usuarios/${this._username}`, user)
}

confirmAccount(token: string):Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/register/confirm`, token);
}

resendVerification(token: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/register/resend`, token);
}


editUserWithPasswordVerification(userEdit: UserEdit, currentPassword: string): Observable<UserEdit> {
const url = `${this.apiUrl}/usuarios/${this._username}`;
return this.http.put<UserEdit>(url, {
    ...userEdit,
    currentPassword: currentPassword 
});
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



}


