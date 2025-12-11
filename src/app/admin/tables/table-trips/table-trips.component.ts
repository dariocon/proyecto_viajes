import { Component, OnInit, OnDestroy, inject, } from '@angular/core';
import { TripsService } from '../../../_services/trips.service';
import { TripDto, TripPageResponse } from '../../../_interfaces/trip';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../_services/auth.service';

@Component({
  selector: 'app-table-trips',
  templateUrl: './table-trips.component.html',
  styleUrl: './table-trips.component.css',
  standalone: false
})
export class TableTripsComponent implements OnInit, OnDestroy {


  private tripsService = inject(TripsService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  paginatedTrips: TripDto[] = [];
  tripsCurrentPage = 0;
  tripsItemsPerPage = 12;
  tripsTotalPages = 0;
  tripsSortColumn = 'startDate';
  sortColumnDirection: 'ASC' | 'DESC' = 'DESC';
  tripsSearchTerm = '';
  isLoading = true;

  ngOnInit(): void {
    this.subscriptions.add(
      this.tripsService.adminTripsPageState$.subscribe((state) => {
        if(state){
          this.paginatedTrips = state.content;
          this.tripsTotalPages = state.page.totalPages;
          this.tripsCurrentPage = state.page.number;
        }
        this.isLoading = false;
      })
    );

    this.loadTrips();
  }


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.tripsService.resetTripsPageState(this.tripsService._adminTripsPageState)
  }

loadTrips(page: number = this.tripsCurrentPage): void {
  this.isLoading = true;

  const order = ['proximo','en curso','pasado'].includes(this.tripsSortColumn) ? undefined : this.sortColumnDirection;

  let tripRequest: Observable<TripPageResponse>;

  if (this.tripsSearchTerm.trim()) {
    tripRequest = this.tripsService.getTripsBySearchTermAdmin(
      this.tripsSearchTerm, 
      page, 
      this.tripsItemsPerPage, 
      this.tripsSortColumn, 
      order
    );
  } else {
    tripRequest = this.tripsService.getTrips(
      page, 
      this.tripsItemsPerPage, 
      order, 
      this.tripsSortColumn
    );
  }

  tripRequest.subscribe();
}

  toggleSort(column: string): void {
    const estados = ['proximo','en curso','pasado'];
    if(estados.includes(column)) {
      const currentIndex = estados.indexOf(this.tripsSortColumn);
      this.tripsSortColumn = currentIndex === -1 || currentIndex === estados.length-1 ? estados[0] : estados[currentIndex+1];
      this.sortColumnDirection = 'DESC';
    } else {
      this.sortColumnDirection = this.tripsSortColumn === column ? (this.sortColumnDirection === 'ASC' ? 'DESC' : 'ASC') : 'ASC';
      this.tripsSortColumn = column;
    }
    this.loadTrips();
  }

  onSearchInput(term: string): void {
    this.tripsSearchTerm = term;
    this.tripsCurrentPage = 0;
    this.loadTrips();
  }

  deleteTrip(trip: TripDto): void {
    const participantCount = trip.participations?.length || 0;
    const notificationPart = participantCount > 0 ? ` y se notificará a los ${participantCount} inscritos.` : '';

    Swal.fire({
        title: '¿Estás seguro de eliminar?',
        text: `Se eliminará el viaje "${trip.title}"${notificationPart}`,
        icon: 'warning',
        showCancelButton: true,
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar viaje',
        cancelButtonText: 'No, mantener',
        background: 'linear-gradient(135deg, #F95596, #FE7079)',
        color: 'white',
        iconColor: 'white',
        confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
    }).then((result) => {
      if(result.isConfirmed) {
        this.tripsService.deleteTripFromAdminTrips(trip.idTrip).subscribe({
          next: () => {
            Swal.fire({
              title: '¡Viaje Eliminado!',
              text: `El viaje "${trip.title}" ha sido eliminado.`,
              icon: 'success',
              background: 'linear-gradient(135deg, #F95596, #FE7079)',
              color: 'white',
              iconColor: 'white',
              confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
            });
             this.loadTrips();
          },
            error: (err) => Swal.fire({
              title: 'Error',
              text: err?.error?.message || 'Error al eliminar viaje',
              icon: 'error',
              background: 'linear-gradient(135deg, #F95596, #FE7079)',
              color: 'white',
              iconColor: 'white',
              confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
            })
        });
      }
    });
  }

  editTrip(trip: TripDto): void {
    const now = new Date();
    const start = new Date(trip.startDate);
    if(start.getTime() <= now.getTime()) {
      Swal.fire('Edición no permitida', 'Este viaje ya comenzó o terminó.', 'info');
      return;
    }
    this.router.navigate(['/trips/edit', trip.idTrip, this.authService.username]);
  }

  changeTripPage(page: number): void {
    const backendPage = page - 1;
    if(backendPage < 0 || backendPage >= this.tripsTotalPages) {
      return;
    }
    this.tripsCurrentPage = backendPage;
    this.loadTrips();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getTripStatus(trip: TripDto): string {
    if(!trip.endDate) return 'Próximo';
    const now = new Date();
    if(new Date(trip.endDate).getTime() < now.getTime()) return 'Pasado';
    if(new Date(trip.startDate).getTime() < now.getTime()) return 'En curso';
    return 'Próximo';
  }

  getTripPageNumbers(): number[] {
    return Array(this.tripsTotalPages).fill(0).map((_,i) => i+1);
  }

  get displayTripCurrentPage(): number {
    return this.tripsCurrentPage + 1;
  }
}


