import { Component, inject, OnInit } from '@angular/core';
import { TripDto } from '../../../_interfaces/trip';
import { TripsService } from '../../../_services/trips.service';
import { AuthService } from '../../../_services/auth.service';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-trips-list',
  imports: [FormsModule, RouterLink],
  templateUrl: './my-trips-list.component.html',
  styleUrl: './my-trips-list.component.css'
})
export class MyTripsListComponent implements OnInit{
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  constructor(private tripsService: TripsService) { }
 /* filterGroups = [
    {
      title: 'Creados',
      options: ['Todos', 'Próximos', 'Pasados']
    },
    {
      title: 'Asistente',
      options: ['Todos', 'Próximos', 'Pasados']
    }
  ];*/
  filterGroups: { title: string; options: string[] }[] = [];
  // Estado inicial del filtro
  activeFilter = '';
  allTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = []; 
  participatedTrips: TripDto[] = [];
  itemsPerPage: number = 12;
  currentPage: number = 1;
  isLoading: boolean = true;
  searchTerm: string = ''; 
  currentUserId = this.authService.username; 
  private dataLoads = { allTripsLoaded: false, participatedTripsLoaded: false };
  role: string= '';

ngOnInit(): void {
  this.authService.role$.subscribe(role => {
    this.role = role;

    if (this.role === 'organizer') {
      this.filterGroups = [
        {
          title: 'Creados',
          options: ['Todos', 'Próximos', 'Pasados']
        },
        {
          title: 'Asistente',
          options: ['Todos', 'Próximos', 'Pasados']
        }
      ];
      this.activeFilter = 'Creados - Todos';
      this.loadTripsByGroup('Creados');
    } else {
      this.filterGroups = [
        {
          title: 'Asistente',
          options: ['Todos', 'Próximos', 'Pasados']
        }
      ];
      this.activeFilter = 'Asistente - Todos';
    }
    this.dataLoads.allTripsLoaded = true;
    this.loadTripsByGroup('Asistente');
  });
}


  private checkLoadingStatus(): void {
        if (this.dataLoads.allTripsLoaded && this.dataLoads.participatedTripsLoaded) {
            this.isLoading = false;
            this.applyPagination();
        }
    }

  private loadTripsByGroup(group: string): void {
    this.currentPage = 1;

    if (group === 'Creados') {
      this.tripsService.getTripsByOrganizer(this.currentUserId).subscribe({
        next: (trips) => {
          this.allTrips = Array.isArray(trips) ? trips : [];
          this.dataLoads.allTripsLoaded = true;
          this.applyPagination();
          this.checkLoadingStatus();
        },
        error: (err) => {
          this.allTrips = [];
          console.error('Error al cargar viajes creados:', err);
          this.dataLoads.allTripsLoaded = true;
          this.checkLoadingStatus();
        }
      });
    } else if (group === 'Asistente') {
      this.tripsService.getTripParticipationsByUser(this.authService.username).subscribe({
        next: (trips) => {
          this.participatedTrips = Array.isArray(trips) ? trips : [];
          this.dataLoads.participatedTripsLoaded = true;
          this.applyPagination();
          this.checkLoadingStatus();
        },
        error: (err) => {
          this.participatedTrips = []; 
          console.error('Error al cargar viajes participados:', err);
          this.dataLoads.participatedTripsLoaded = true;
          this.checkLoadingStatus();
        }
      });
    }
  }

  onSearch(inputValue: string): void {
    this.searchTerm = inputValue.trim();
    this.currentPage = 1;

    const [group] = this.activeFilter.split(' - '); 
    const type = group === 'Creados' ? 'creados' : 'participante';

      if (!this.searchTerm) {
        // Si la búsqueda está vacía, recargamos el grupo correspondiente
        this.loadTripsByGroup(group);
        return;
      }

    // Solo llamamos al backend si hay texto
    this.tripsService.searchMyTrips(this.searchTerm, type).subscribe({
      next: (trips: TripDto[]) => {
        if (type === 'creados') this.allTrips = Array.isArray(trips) ? trips : [];
        else this.participatedTrips = Array.isArray(trips) ? trips : [];
        this.applyPagination();
      },
      error: (err) => {
        console.error('Error al buscar viajes:', err);
      }
    });
  }



  get filteredTrips(): TripDto[] {
    const now = new Date();
    // Dividir el filtro en grupo (asistente, creados) y opción de fecha (pasados, próximos, todos)
    const [group, option] = this.activeFilter.split(' - '); 

    // la lista base a filtrar (creados o asistente)
    let baseTrips: TripDto[] = [];
    
    if (group === 'Creados') {     
      baseTrips = this.allTrips || [];
    } else if (group === 'Asistente') {
      baseTrips = this.participatedTrips || [];
    } else {
      return []; 
    }

    let filtered = baseTrips;
    // Ahora aplicamos el filtro de fecha (próximos, pasados, todos)
    switch (option) {
    /* case 'Todos':
        break;*/
       // return filtered;
        
      case 'Próximos':
        //fecha de inicio posterior a la hora actual
        filtered = baseTrips.filter(trip => new Date(trip.startDate).getTime() > now.getTime());
        break;
       // return baseTrips.filter(trip => new Date(trip.startDate).getTime() > now.getTime());

      case 'Pasados':
        // fecha de INICIO anterior a la hora actual
        filtered = baseTrips.filter(trip => new Date(trip.startDate).getTime() < now.getTime());
        break;
        //return baseTrips.filter(trip => new Date(trip.startDate).getTime() < now.getTime());

     // default:
     //   return baseTrips; 
    }

    if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(trip =>
            trip.title.toLowerCase().includes(term) ||
            trip.description?.toLowerCase().includes(term)
        );
    }
    return filtered || [];
  }

  
  // Para cambiar el filtro activo (se usa cada vez que clickamos en un filtro)
  setActiveFilter(group: string, option: string): void {
    this.activeFilter = `${group} - ${option}`;
    this.searchTerm = '';
    this.currentPage = 1;
      if (group === 'Creados') {
    this.tripsService.getTripsByOrganizer(this.currentUserId).subscribe({
      next: (trips) => {
        this.allTrips = Array.isArray(trips) ? trips : [];
        this.applyPagination();
      },
      error: (err) => {
        this.allTrips = [];
        this.applyPagination();
        console.error('Error al cargar viajes creados:', err)
      }
    });
  } else if (group === 'Asistente') {
    this.tripsService.getTripParticipationsByUser(this.authService.username).subscribe({
      next: (trips) => {
        this.participatedTrips = Array.isArray(trips) ? trips : [];
        this.applyPagination();
      },
      error: (err) => 
      {
        console.error('Error al cargar viajes participados:', err);
        this.participatedTrips = [];
        this.applyPagination();
      }
    });
  }
    this.applyPagination();
  }

  // Métodos para la gestión de mis viajes (editar, borrar)

  isTripCreatable(trip: TripDto): boolean {
    // Solo si el usuario es el organizador y está en la vista "Creados"
    const [group] = this.activeFilter.split(' - ');
    return group === 'Creados' && trip.organizerUsername === this.currentUserId;
  }

  canEditTrip(trip: TripDto): boolean {
    const now = new Date();
    const start = new Date(trip.startDate);
    // solo editable si aún no comienza
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

    this.router.navigate(['/viajes/edit', trip.idTrip, this.authService.username]);
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
            this.tripsService.deleteTrip(trip.idTrip).subscribe({
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

                    // Actualización local de la lista
                    this.allTrips = this.allTrips.filter(t => t.idTrip !== trip.idTrip);
                    this.applyPagination();
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

      // Buscamos la imagen marcada como portada
      const coverImage = trip.images.find(image => image.isCover);
      if (coverImage) {
          return coverImage.imageUrl;
      }

      // Si no hay portada explícita (iscover=true), se usa la primera imagen
      if (trip.images.length > 0) {
          return trip.images[0].imageUrl;
      }

      // SI no, imagen por defecto
      return defaultImage;
  }
  
  // Métodos de paginación
  get totalPages(): number {
    return Math.ceil(this.filteredTrips.length / this.itemsPerPage);
  }

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedTrips = this.filteredTrips.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
      document.querySelector('.trips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

}
