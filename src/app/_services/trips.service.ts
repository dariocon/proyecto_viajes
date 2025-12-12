import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { ParticipationAdd, ParticipationDto } from '../_interfaces/user';
import { Categoria } from '../_interfaces/categoria';
import { TripPageResponse, TripDto } from '../_interfaces/trip';
import { AuthService } from './auth.service';
import { RatingPageResponse } from '../_interfaces/rating';

@Injectable({
providedIn: 'root'
})
export class TripsService {

private apiUrl = 'https://apiviajes.onrender.com';
http: HttpClient = inject(HttpClient);
private searchTermSubject = new BehaviorSubject<string>('');
public currentSearchTerm: Observable<string> = this.searchTermSubject.asObservable();
public authService = inject(AuthService);

public _myTripsPageState = new BehaviorSubject<TripPageResponse | null>(null);
public myTripsPageState$ = this._myTripsPageState.asObservable();

private _tripsPageState = new BehaviorSubject<TripPageResponse | null>(null);
public tripsPageState$ = this._tripsPageState.asObservable();

public _adminTripsPageState = new BehaviorSubject<TripPageResponse | null>(null);
public adminTripsPageState$ = this._adminTripsPageState.asObservable();

setSearchTerm(term: string): void {
    this.searchTermSubject.next(term.toLowerCase()); 
}
resetSearchTerm(): void {
      this.searchTermSubject.next(''); 
}
getCategories(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
}

public resetTripsPageState(targetState?: BehaviorSubject<TripPageResponse | null>): void {
  const stateSubject = targetState || this._tripsPageState;
  stateSubject.next(null);
}

getTrips(page: number = 0, size: number = 12, order: string = 'DESC', sortBy?: string): Observable<TripPageResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('order', order); 

  if (sortBy) {
    params = params.set('sortBy', sortBy);
  }

  return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/all`, { params }).pipe(
    tap(response => {
      this._adminTripsPageState.next(response);
    }),
    catchError(error => {
      console.error('Error al obtener los viajes:', error);
      this._adminTripsPageState.next(null);
      return throwError(() => error);
    })
  );
}
/*
getTripsAvailable(): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes/available`);
}*/
getTripsAvailable(page: number = 0, size: number = 12, sortBy: string = 'startDate', 
  sortDir: string = 'ASC', timeFilter?: string): Observable<TripPageResponse> {
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

getTripsByOrganizer(organizer: string, page: number = 0, size: number = 12, 
  sortBy: string = 'startDate', sortDir: string = 'DESC', timeFilter?: string): Observable<TripPageResponse> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);
  
  if (timeFilter) {
    params = params.set('timeFilter', timeFilter);
  }
  
  return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/organizer/${organizer}`, { params }).pipe(
    tap(response => {
      this._myTripsPageState.next(response); 
    }),
    catchError(error => {
      console.error('Error al cargar la lista de viajes creados:', error);
      this._myTripsPageState.next(null); // Emite null si hay error
      return throwError(() => new Error('No se pudo cargar la lista de viajes.'));
    })
  );
}


getTripsBySearchTermAdmin(
  term: string, 
  page: number = 0, 
  size: number = 12, 
  sortBy: string = 'startDate', 
  sortDir: string = 'ASC'
): Observable<TripPageResponse> {
  const finalTerm = (term || '').trim();
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);

  return this.http.get<TripPageResponse>(`${this.apiUrl}/viajes/searchAdmin/${finalTerm}`, { params }).pipe(
    tap(response => this._adminTripsPageState.next(response)),
    catchError(error => {
      console.error(`Error al buscar viajes por término "${finalTerm}":`, error);
      this._adminTripsPageState.next(null);
      return throwError(() => error);
    })
  );
}


searchTripsAvailable(
  term: string, 
  page: number = 0, 
  size: number = 12, 
  sortBy: string = 'startDate', 
  sortDir: string = 'ASC'
): Observable<TripPageResponse> {
  const finalTerm = (term || '').trim();
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortBy', sortBy)
    .set('sortDir', sortDir);

  return this.http.get<TripPageResponse>(
    `${this.apiUrl}/viajes/search/${finalTerm}`, 
    { params }
  ).pipe(
   // tap(response => this._tripsPageState.next(response)),
    catchError(error => {
      console.error(`Error al buscar viajes disponibles por término "${finalTerm}":`, error);
   //   this._tripsPageState.next(null);
      return throwError(() => error);
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

deleteTripFromMyTrips(idTrip: number): Observable<any> {
  const url = `${this.apiUrl}/viajes/${idTrip}`;
  return this.http.delete<any>(url).pipe(
    tap(() => {
      this.removeTripFromState(this._myTripsPageState, idTrip);
    })
  );
}

deleteTripFromAdminTrips(idTrip: number): Observable<any> {
  const url = `${this.apiUrl}/viajes/${idTrip}`;
  return this.http.delete<any>(url).pipe(
    tap(() => {
      this.removeTripFromState(this._adminTripsPageState, idTrip);
    })
  );
}

private removeTripFromState(subject: BehaviorSubject<TripPageResponse | null>, idTrip: number) {
  const state = subject.value;
  if (!state) return;

  const newContent = state.content.filter(t => t.idTrip !== idTrip);
  const newTotal = state.page.totalElements - 1;

  const newState: TripPageResponse = {
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
    tap(response => {
      this._myTripsPageState.next(response); // Actualiza el estado central
    }),
    catchError(error => {
      console.error('Error al buscar viajes paginados:', error);
      this._myTripsPageState.next(null); // Emite null si hay error
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
    tap(response => {
      this._myTripsPageState.next(response); // Actualiza el estado central
    }),
    catchError(error => {
      console.error('Error al obtener la lista de viajes en los que ha participado:', error);
      this._myTripsPageState.next(null); // Emite null si hay error
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