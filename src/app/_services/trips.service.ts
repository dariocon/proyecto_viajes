import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { LoginResponse, RegisterResponse, Token,User,UserEdit,UserLogin,UserLoginResponse, UserRegister, VerifiedResponse } from '../_interfaces/user';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Categoria } from '../_interfaces/categoria';
import { TripAdd, TripDto } from '../_interfaces/trip';

@Injectable({
providedIn: 'root'
})
export class TripsService {

private apiUrl = 'http://localhost:8080';
http: HttpClient = inject(HttpClient);
private searchTermSubject = new BehaviorSubject<string>('');
public currentSearchTerm: Observable<string> = this.searchTermSubject.asObservable();

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

getTripsAvailable(): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes/available`);
}

 getTripByIdCategory(idCat: number): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes/filter/${idCat}`).pipe(
      catchError(error => {
        console.error('Error al obtener los viajes:', error);
        return throwError(() => new Error('No se pudo cargar.'));
      })
    );
  }

   getTripsByOrganizer(organizer: string): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes/organizer/${organizer}`).pipe(
      catchError(error => {
        console.error('Error al obtener los viajes:', error);
        return throwError(() => new Error('No se pudo cargar.'));
      })
    );
  }


getTripsBySearchTerm(term: string): Observable<TripDto[]> {
    
    // Si el término es nulo o vacío, lo convertimos a una cadena vacía ('').
    // Esto construye una URL como '/viajes/search/' que el backend dinterpreta
    // que debe trare todos los viajes.
    const finalTerm = (term || '').trim(); 
    return this.http.get<TripDto[]>(`${this.apiUrl}/viajes/search/${finalTerm}`).pipe(
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

 getTripById(id: number): Observable<TripDto> {
    return this.http.get<TripDto>(`${this.apiUrl}/viajes/${id}`).pipe(
      // Opcional: para manejar errores de forma centralizada
      catchError(error => {
        console.error('Error al obtener el viaje:', error);
        return throwError(() => new Error('No se pudo cargar el viaje.'));
      })
    );
  }
  
  searchMyTrips(term: string, type: string): Observable<TripDto[]> {
  const finalTerm = (term || '').trim();
  return this.http.get<TripDto[]>(
    `${this.apiUrl}/viajes/mis-viajes/buscar?termino=${encodeURIComponent(finalTerm)}&tipo=${encodeURIComponent(type)}`
  );
  }


  getTripParticipationsByUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/viajes/mis-viajes-participados`).pipe(
      // Opcional: para manejar errores de forma centralizada
      catchError(error => {
        console.error('Error al obtener la lista de viajes en los que ha participado:', error);
        return throwError(() => new Error('No se pudo cargar la lista de viajes en los que participa.'));
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

}