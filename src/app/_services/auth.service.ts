import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap } from 'rxjs';
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

private router: Router = inject(Router);
    constructor(){
    let username = localStorage.getItem('username');
    if (username) {
      this._username = username;
      this.isLoggedSignal.set(true);
    }
    
   this.validateToken().subscribe();
  }

getDecodedAccessToken(token: string): Token | null {
  try {
    return jwtDecode(token);
  } catch(Error) {
    return null;
  }
}


  
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
            this.isLoggedSignal.set(true);
          }
        return true;
      }),
      catchError(err => of(false))
    )

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
          this.isLoggedSignal.set(true);
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
  this.isLoggedSignal.set(false);
  this.router.navigateByUrl('/login')

}

editUser(user : UserEdit):Observable<UserEdit>{
return this.http.put<UserEdit>(`${this.apiUrl}/usuarios/${this._username}`, user)
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


