import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RatingDto, RatingDtoAdd, RatingPageResponse } from '../_interfaces/rating';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RatingsService {
  private apiUrl = 'https://apiviajes.onrender.com';
  private http: HttpClient = inject(HttpClient);
  private authService = inject(AuthService);

  // Obtener todas las valoraciones
  getAllRatings(): Observable<RatingDto[]> {
    return this.http.get<RatingDto[]>(`${this.apiUrl}/ratings`).pipe(
      catchError(error => throwError(() => new Error('No se pudieron cargar las valoraciones')))
    );
  }

  // Obtener una valoración por ID
  getRatingById(id: number): Observable<RatingDto> {
    return this.http.get<RatingDto>(`${this.apiUrl}/ratings/${id}`).pipe(
      catchError(error => throwError(() => new Error(`No se pudo cargar la valoración ${id}`)))
    );
  }

  // Obtener valoraciones paginadas
  getRatingsPage(page: number = 0, size: number = 12, sortBy: string = 'submissionDate', sortDir: string = 'DESC'): Observable<RatingPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<RatingPageResponse>(`${this.apiUrl}/ratings/page`, { params }).pipe(
      catchError(error => throwError(() => new Error('No se pudo cargar la página de valoraciones')))
    );
  }

  // Obtener valoraciones de un viaje específico
  getRatingsByTrip(tripId: number, page: number = 0, size: number = 12, sortBy: string = 'submissionDate', sortDir: string = 'DESC'): Observable<RatingPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<RatingPageResponse>(`${this.apiUrl}/ratings/trip/${tripId}`, { params }).pipe(
      catchError(error => throwError(() => new Error(`No se pudieron cargar las valoraciones del viaje ${tripId}`)))
    );
  }

  // Obtener valoraciones de un usuario
  getRatingsByUser(username: string, page: number = 0, size: number = 12, sortBy: string = 'submissionDate', sortDir: string = 'DESC'): Observable<RatingPageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<RatingPageResponse>(`${this.apiUrl}/ratings/user/${username}`, { params }).pipe(
      catchError(error => throwError(() => new Error(`No se pudieron cargar las valoraciones del usuario ${username}`)))
    );
  }

  // Crear una nueva valoración
  addRating(rating: RatingDtoAdd): Observable<RatingDto> {
    return this.http.post<RatingDto>(`${this.apiUrl}/ratings`, rating).pipe(
      catchError(error => throwError(() => new Error('No se pudo crear la valoración')))
    );
  }

  // Actualizar valoración existente
  updateRating(id: number, rating: RatingDtoAdd): Observable<RatingDto> {
    return this.http.put<RatingDto>(`${this.apiUrl}/ratings/${id}`, rating).pipe(
      catchError(error => throwError(() => new Error(`No se pudo actualizar la valoración ${id}`)))
    );
  }
// Obtener la valoración media de un viaje
getAverageRatingByTrip(tripId: number): Observable<number> {
  return this.http.get<{ tripId: number, averageRating: number }>(`${this.apiUrl}/ratings/average/${tripId}`)
    .pipe(
      catchError(error => throwError(() => new Error(`No se pudo obtener la valoración media del viaje ${tripId}`))),
      // extraemos solo el número
      map(resp => resp.averageRating)
    );
}

  // Eliminar una valoración
  deleteRating(id: number): Observable<RatingDto> {
    return this.http.delete<RatingDto>(`${this.apiUrl}/ratings/${id}`).pipe(
      catchError(error => throwError(() => new Error(`No se pudo eliminar la valoración ${id}`)))
    );
  }

   /* likeRating(id: number) {
    return this.http.put<RatingDto>(`${this.apiUrl}/ratings/${id}/like`, {});
    }*/


}
