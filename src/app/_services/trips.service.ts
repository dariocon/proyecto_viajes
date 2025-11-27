import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { LoginResponse, ParticipationAdd, ParticipationDto, RegisterResponse, Token,User,UserEdit,UserLogin,UserLoginResponse, UserRegister, VerifiedResponse } from '../_interfaces/user';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Categoria } from '../_interfaces/categoria';
import { TripPageResponse, TripAdd, TripDto } from '../_interfaces/trip';
import { AuthService } from './auth.service';
import { RatingPageResponse } from '../_interfaces/rating';

@Injectable({
providedIn: 'root'
})
export class TripsService {

private apiUrl = 'http://localhost:8080';
http: HttpClient = inject(HttpClient);
private searchTermSubject = new BehaviorSubject<string>('');
public currentSearchTerm: Observable<string> = this.searchTermSubject.asObservable();
public authService = inject(AuthService);

setSearchTerm(term: string): void {
    this.searchTermSubject.next(term.toLowerCase()); 
}
resetSearchTerm(): void {
      this.searchTermSubject.next(''); 
}
getCategories(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
}

getTrips(): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes`);
}
/*
getTripsAvailable(): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes/available`);
}*/
  getTripsAvailable(page: number = 0, size: number = 12, sortBy: string = 'startDate', sortDir: string = 'ASC', timeFilter?: string): Observable<TripPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (timeFilter) {
      params = params.set('timeFilter', timeFilter);
    }
    
    return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/available`, { params });
  }
  getTripByIdCategory(idCat: number, page: number = 0, size: number = 12, sortBy: string = 'startDate', sortDir: string = 'ASC', timeFilter?: string): Observable<TripPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (timeFilter) {
      params = params.set('timeFilter', timeFilter);
    }
    
    return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/filter/${idCat}`, { params }).pipe(
      catchError(error => {
        console.error('Error al obtener los viajes:', error);
        return throwError(() => new Error('No se pudo cargar.'));
      })
    );
  }

getTripsByOrganizer(organizer: string, page: number = 0, size: number = 12, sortBy: string = 'startDate', sortDir: string = 'DESC', timeFilter?: string): Observable<TripPageResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);
  
  if (timeFilter) {
    params = params.set('timeFilter', timeFilter);
  }
  
  return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/organizer/${organizer}`, { params });
}


  getTripsBySearchTerm(term: string, page: number = 0, size: number = 12, sortBy: string = 'title', sortDir: string = 'ASC'): Observable<TripPageResponse> {
    const finalTerm = (term || '').trim();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    
    return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/search/${finalTerm}`, { params }).pipe(
      catchError(error => {
        console.error(`Error al buscar viajes por término "${finalTerm}":`, error);
        return throwError(() => new Error('No se pudo cargar la búsqueda.'));
      })
    );
  }
/*addTrip(trip: TripAdd): Observable<any>
{
return this.http.post<any>(`${this.apiUrl}/viajes`, trip);
}*/
addTrip(formData: FormData): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/viajes`, formData);
}
checkParticipation(idTrip: number): Observable<any> {
    const url = `${this.apiUrl}/participations/check/${idTrip}`;
    return this.http.get<any>(url);
  }
addParticipation(formData: ParticipationAdd): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/participations`, formData);
}
deleteParticipation(idTrip: number, username: string, participationDate: string): Observable<any> {
      const url = `${this.apiUrl}/participations/${idTrip}/${username}/${participationDate}`;
      return this.http.delete<any>(url);
}

  deleteTrip(idTrip: number): Observable<any> {
        const url = `${this.apiUrl}/viajes/${idTrip}`;
        return this.http.delete<any>(url);
  }


    updateTrip(id: number, formData: FormData): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/viajes/${id}`, formData);
  }


 getTripById(id: number): Observable<TripDto> {
    return this.http.get<TripDto>(`${this.apiUrl}/viajes/${id}`).pipe(
      
      catchError(error => {
        console.error('Error al obtener el viaje:', error);
        return throwError(() => error);
      })
    );
  }

   getCategoryById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/categorias/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener la categoría:', error);
        return throwError(() => error);
      })
    );
  }
  
 /* searchMyTrips(term: string, type: string): Observable<TripDto[]> {
  const finalTerm = (term || '').trim();
  return this.http.get<TripDto[]>(
    `${this.apiUrl}/viajes/mis-viajes/buscar?termino=${encodeURIComponent(finalTerm)}&tipo=${encodeURIComponent(type)}`
  );
  }*/
searchMyTripsPaginated(
  term: string, 
  type: string, 
  timeFilter?: string,
  page: number = 0, 
  size: number = 12, 
  sortBy: string = 'startDate', 
  sortDir: string = 'DESC'
): Observable<TripPageResponse> {
  let params = new HttpParams()
    .set('termino', term)
    .set('tipo', type)
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);

  if (timeFilter) {
    params = params.set('timeFilter', timeFilter);
  }

  return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/mis-viajes/buscar`, { params }).pipe(
    catchError(error => {
      console.error('Error al buscar viajes paginados:', error);
      return throwError(() => new Error('No se pudo realizar la búsqueda de viajes.'));
    })
  );
}


  //El objetivo de este método es usarlo tanto en mytrips como en un ver participaciones de x user por parte de un admin.
getTripParticipationsByUser(targetUsername?: string, page: number = 0, size: number = 12, sortBy: string = 'startDate', sortDir: string = 'DESC', timeFilter?: string): Observable<TripPageResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);
  
  if (targetUsername) {
    params = params.set('targetUsername', targetUsername);
  }
  
  if (timeFilter) {
    params = params.set('timeFilter', timeFilter);
  }
  console.log('Llamando a getTripParticipationsByUser con params:', {
  targetUsername, page, size, sortBy, sortDir, timeFilter
});
  return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/mis-viajes-participados`, { params }).pipe(
    catchError(error => {
      console.error('Error al obtener la lista de viajes en los que ha participado:', error);
      return throwError(() => new Error('No se pudo cargar la lista de viajes en los que participa.'));
    })
  );
}

  getTripParticipationsByTrip(id: number): Observable<ParticipationDto[]> {
      return this.http.get<ParticipationDto[]>(`${this.apiUrl}/participations/trip/${id}`).pipe(
      catchError(error => {
        console.error('Error al obtener la lista de participantes:', error);
        return throwError(() => new Error('No se pudo cargar la lista de participantes.'));
      })
    );

  }
/*addTrip(trip: TripAdd, image?: File): Observable<any> {
  const formData = new FormData();
  formData.append('trip', new Blob([JSON.stringify(trip)], { type: 'application/json' }));
  if (image) {
    formData.append('image', image);
  }
  return this.http.post<any>(`${this.apiUrl}/viajes`, formData);
}*/

getOrganizerByUsername(username: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/organizer/${username}`);
}

getOrganizerReviews(username: string, page: number = 0, size: number = 12, sortBy: string = 'submissionDate', sortDir: string = 'DESC'): Observable<RatingPageResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);

    return this.http.get<RatingPageResponse>(`${this.apiUrl}/ratings/organizer/${username}/all`, { params });
}

getOrganizerStats(username: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/ratings/organizer/stats/${username}`);
}
}