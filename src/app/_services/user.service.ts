import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { UserPageResponse } from '../_interfaces/user';

@Injectable({
providedIn: 'root'
})
export class UserService {

private apiUrl = 'https://apiviajes.onrender.com';
http: HttpClient = inject(HttpClient);
public searchTermSubject$ = new BehaviorSubject<string>('');
currentSearchTerm$: Observable<string> = this.searchTermSubject$.asObservable();
public authService = inject(AuthService);

private _usersPageState = new BehaviorSubject<UserPageResponse | null>(null);
public myUsersPageState$ = this._usersPageState.asObservable();


getUsers(page: number = 0, size: number = 12, order: string = 'DESC', sortBy?: string): Observable<UserPageResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('order', order); 

  if (sortBy) {
    params = params.set('sortBy', sortBy);
  }

  return this.http.get<UserPageResponse>(`${this.apiUrl}/usuarios/all`, { params }).pipe(
    tap(response => {
      this._usersPageState.next(response);
    }),
    catchError(error => {
      console.error('Error al obtener los viajes:', error);
      this._usersPageState.next(null);
      return throwError(() => error);
    })
  );
}

  setSearchTerm(term: string) {
    this.searchTermSubject$.next(term);
  }

  get currentSearchTermValue(): string {
    return this.searchTermSubject$.value.trim();
  }



deleteUserFromAdminUsers(username: string): Observable<any> {
  const url = `${this.apiUrl}/usuarios/${username}`;
  return this.http.delete<any>(url).pipe(
    tap(() => {
      this.removeUserFromState(this._usersPageState, username);
    })
  );
}

private removeUserFromState(subject: BehaviorSubject<UserPageResponse | null>, username: string) {
  const state = subject.value;
  if (!state) return;

  const newContent = state.content.filter(t => t.username !== username);
  const newTotal = state.page.totalElements - 1;

  const newState: UserPageResponse = {
    ...state,
    content: newContent,
    page: {
      ...state.page,
      totalElements: newTotal,
      totalPages: Math.ceil(newTotal / state.page.size)
    }
  };

  subject.next(newState);
}

resetSearchTerm(): void {
      this.searchTermSubject$.next(''); 
}
updateUserStatus(username: string, newStatus: string): Observable<any> {
  const url = `${this.apiUrl}/usuarios/${username}/status`;

  const params = new HttpParams()
    .set('status', newStatus);

  return this.http.patch<any>(url, null, { params }).pipe(
    tap(() => {
      // para actualizar el estado del usuario en la tabla:
      const state = this._usersPageState.value;
      if (!state) return;

      const newContent = state.content.map(user =>
        user.username === username ? { ...user, userStatus: newStatus } : user
      );

      this._usersPageState.next({
        ...state,
        content: newContent
      });
    })
  );
}

updateUserRole(username: string, newRole: string): Observable<any> {
  const url = `${this.apiUrl}/usuarios/${username}/role`;

  const params = new HttpParams()
    .set('role', newRole);

  return this.http.patch<any>(url, null, { params }).pipe(
    tap(() => {
      // para actualizarel estado en memoria para reflejar el cambio en la tabla sin recargar
      const state = this._usersPageState.value;
      if (!state) return;

      const newContent = state.content.map(user =>
        user.username === username ? { ...user, role: newRole } : user
      );

      this._usersPageState.next({
        ...state,
        content: newContent
      });
    })
  );
}


getUsersBySearchTerm(
  term: string, 
  page: number = 0, 
  size: number = 12, 
  sortBy: string = 'username', 
  sortDir: string = 'ASC', 
  targetState?: BehaviorSubject<UserPageResponse | null>
): Observable<UserPageResponse> {
  const finalTerm = (term || '').trim();
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);

  const stateSubjectUsers = targetState || this._usersPageState; 

  return this.http.get<UserPageResponse>(`${this.apiUrl}/usuarios/search/${finalTerm}`, { params }).pipe(
    tap(response => stateSubjectUsers.next(response)),
    catchError(error => {
      console.error(`Error al buscar usuarios por término "${finalTerm}":`, error);
      stateSubjectUsers.next(null);
      return throwError(() => error);
    })
  );
}

}