import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TripDto, TripPageResponse } from '../../../_interfaces/trip';
import { TripsService } from '../../../_services/trips.service';
import { AuthService } from '../../../_services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { tap } from 'rxjs/operators';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-trips-list',
  standalone: false,
  templateUrl: './my-trips-list.component.html',
  styleUrl: './my-trips-list.component.css'
})
export class MyTripsListComponent implements OnInit , OnDestroy {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private subscriptions: Subscription = new Subscription();
  constructor(private tripsService: TripsService) { }
  
  filterGroups: { title: string; options: string[] }[] = [];
  activeFilter = '';
  paginatedTrips: TripDto[] = []; 
  
  // Variables de paginación del backend
  currentPage: number = 0;
  itemsPerPage: number = 12;
  totalElements: number = 0;
  totalPages: number = 0;
  
  isLoading: boolean = true;
  searchTerm: string = ''; 
  currentUserId = this.authService.username; 
  role: string = '';

 //private route: ActivatedRoute = inject(ActivatedRoute);

ngOnInit(): void {

  // Suscripción al estado de mis viajes
  this.subscriptions.add(
    this.tripsService.myTripsPageState$
      .pipe(
        tap(state => {
          if (state) { 
            this.paginatedTrips = state.content;
            this.totalElements = state.page.totalElements;
            this.totalPages = state.page.totalPages;
            this.currentPage = state.page.number;
          }
          this.isLoading = false;
        })
      )
      .subscribe()
  );

  // Suscripción al rol del usuario
  this.subscriptions.add(
    this.authService.role$.subscribe(role => {
      this.role = role;

      if (this.role === 'organizer' || this.role === 'admin') {
        this.filterGroups = [
          { title: 'Creados', options: ['Todos', 'Próximos', 'Pasados'] },
          { title: 'Asistente', options: ['Todos', 'Próximos', 'Pasados'] }
        ];
        this.activeFilter = 'Creados - Todos';
        this.loadTripsByGroup('Creados');
      } else {
        this.filterGroups = [
          { title: 'Asistente', options: ['Todos', 'Próximos', 'Pasados'] }
        ];
        this.activeFilter = 'Asistente - Todos';
        this.loadTripsByGroup('Asistente');
      }
    })
  );
}


  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.tripsService.resetTripsPageState(this.tripsService._myTripsPageState);
    this.isLoading = true;

  }

private loadTripsByGroup(group: string): void {
  this.isLoading = true;
  this.searchTerm = '';

  const [_, option] = this.activeFilter.split(' - ');
  const timeFilter = this.getTimeFilter(option);

  const handleResponse = (response: TripPageResponse) => {
    this.paginatedTrips = response.content;
    this.totalElements = response.page.totalElements;
    this.totalPages = response.page.totalPages;
    this.currentPage = response.page.number;
    this.isLoading = false;
  };

  const errorCallback = (error: any) => {
    console.error('Error completo al cargar viajes:', error);
    this.paginatedTrips = [];
    this.totalElements = 0;
    this.totalPages = 0;
    this.isLoading = false;
  };

  if (group === 'Creados') {
    this.subscriptions.add(
      this.tripsService.getTripsByOrganizer(this.currentUserId, this.currentPage, this.itemsPerPage, 'startDate', 'DESC', timeFilter)
        .subscribe({ next: handleResponse, error: errorCallback })
    );
  } else if (group === 'Asistente') {
    this.subscriptions.add(
      this.tripsService.getTripParticipationsByUser(this.authService.username, this.currentPage, this.itemsPerPage, 'startDate', 'DESC', timeFilter)
        .subscribe({ next: handleResponse, error: errorCallback })
    );
  }
}




  private getTimeFilter(option: string): string | undefined {
    switch (option) {
      case 'Próximos':
        return 'proximos';
      case 'Pasados':
        return 'pasados';
      default:
        return undefined;
    }
  }

 onSearch(inputValue: string): void {
  this.searchTerm = inputValue.trim();
  this.currentPage = 0;

  const [group, option] = this.activeFilter.split(' - '); //  obtenemos opción aquí
  const type = group === 'Creados' ? 'creados' : 'participante';
  const timeFilter = this.getTimeFilter(option);

  if (!this.searchTerm) {
    // Si la búsqueda está vacía, recargamos el grupo correspondiente
    this.loadTripsByGroup(group);
    return;
  }

  this.isLoading = true;

  this.tripsService.searchMyTripsPaginated(
    this.searchTerm,
    type,
    timeFilter, 
    this.currentPage,
    this.itemsPerPage,
    'startDate',
    'DESC'
  ).subscribe({
    error: (err) => {
      console.error('Error al buscar viajes paginados:', err);
      this.paginatedTrips = [];
      this.totalPages = 0;
      this.totalElements = 0;
      this.isLoading = false;
    }
  });
}


/*
  private filterByOption(trips: TripDto[], option: string): TripDto[] {
    const now = new Date();
    
    switch (option) {
      case 'Próximos':
        return trips.filter(trip => new Date(trip.startDate).getTime() > now.getTime());
      case 'Pasados':
        return trips.filter(trip => new Date(trip.startDate).getTime() < now.getTime());
      default:
        return trips;
    }
  }
  */

//showTripsGrid = true;
  setActiveFilter(group: string, option: string): void {
    this.isLoading = true;
    this.activeFilter = `${group} - ${option}`;
    this.currentPage = 0;
    this.searchTerm = ''; // Limpiamos búsqueda al cambiar filtro
      this.router.navigate([], {
    queryParams: { filter: this.activeFilter, page: this.currentPage },
    queryParamsHandling: 'merge' // mantiene otros query params
  });
    // Siempre recargamos desde backend

    this.loadTripsByGroup(group);
  
  }

  isTripCreatable(trip: TripDto): boolean {
    const [group] = this.activeFilter.split(' - ');
    return group === 'Creados' && trip.organizerUsername === this.currentUserId;
  }

  canEditTrip(trip: TripDto): boolean {
    const now = new Date();
    const start = new Date(trip.startDate);
    return start.getTime() > now.getTime();
  }

  editTrip(trip: TripDto): void {
    if (!this.canEditTrip(trip)) {
      Swal.fire({
        title: 'Edición no permitida',
        text: 'Este viaje ya comenzó o terminó, por lo que no puede modificarse.',
        icon: 'info',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    this.router.navigate(['/trips/edit', trip.idTrip, this.authService.username]);
  }

  deleteTrip(trip: TripDto): void {
    const participantCount = trip.participations?.length || 0;
    let notificationPart = '';
    if (participantCount > 0) {
      notificationPart = ` y se notificará a los ${participantCount} inscritos.`;
    }
    
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
      if (result.isConfirmed) {
        this.tripsService.deleteTripFromMyTrips(trip.idTrip).subscribe({
          next: () => {
            Swal.fire({
              title: "¡Viaje Eliminado!",
              text: `El viaje "${trip.title}" ha sido eliminado exitosamente.`,
              icon: 'success',
              background: 'linear-gradient(135deg, #F95596, #FE7079)',
              color: 'white',
              iconColor: 'white',
              confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
            });

       //     const [group] = this.activeFilter.split(' - ');
         //   this.loadTripsByGroup(group);
          },
          error: (err) => {
            Swal.fire('Error', err?.error?.message || 'Hubo un error al intentar eliminar el viaje.', 'error');
          }
        });
      }
    });
  }

  getCoverImage(trip: TripDto): string {
    const defaultImage = 'assets/images/default-trip.png';

    if (!trip.images || trip.images.length === 0) {
      return defaultImage;
    }

    const coverImage = trip.images.find(image => image.isCover);
    if (coverImage) {
      return coverImage.imageUrl;
    }

    if (trip.images.length > 0) {
      return trip.images[0].imageUrl;
    }

    return defaultImage;
  }
  
  isTripFinished(trip: TripDto): boolean {
    if (!trip.endDate) return false;
    const endDate = new Date(trip.endDate);
    const now = new Date();
    return endDate.getTime() < now.getTime();
  }
  // Métodos de paginación
  changePage(page: number): void {
    const backendPage = page - 1;
    
    if (backendPage < 0 || backendPage >= this.totalPages) return;
    
    this.currentPage = backendPage;
    
    // Si hay búsqueda activa, volvemos a hacer búsqueda con nueva página
    if (this.searchTerm) {
      this.onSearch(this.searchTerm);
    } else {
      // Si no hay búsqueda, recargamos desde backend
      const [group] = this.activeFilter.split(' - ');
      this.loadTripsByGroup(group);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get displayCurrentPage(): number {
    return this.currentPage + 1;
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
}