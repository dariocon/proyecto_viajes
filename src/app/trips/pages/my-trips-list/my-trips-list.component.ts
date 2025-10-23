import { Component, inject, OnInit } from '@angular/core';
import { TripDto } from '../../../_interfaces/trip';
import { TripsService } from '../../../_services/trips.service';
import { AuthService } from '../../../_services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-trips-list',
  imports: [FormsModule],
  templateUrl: './my-trips-list.component.html',
  styleUrl: './my-trips-list.component.css'
})
export class MyTripsListComponent implements OnInit{
  private authService: AuthService = inject(AuthService);
  constructor(private tripsService: TripsService) { }
  filterGroups = [
    {
      title: 'Creados',
      options: ['Todos', 'Próximos', 'Pasados']
    },
    {
      title: 'Asistente',
      options: ['Todos', 'Próximos', 'Pasados']
    }
  ];
  // Estado inicial del filtro
  activeFilter = 'Creados - Todos';
  allTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = []; 
  participatedTrips: TripDto[] = [];
  itemsPerPage: number = 12;
  currentPage: number = 1;
  isLoading: boolean = true;
  searchTerm: string = ''; 
  currentUserId = this.authService.username; 
  private dataLoads = { allTripsLoaded: false, participatedTripsLoaded: false };

    ngOnInit(): void {
    // Carga de todos los viajes organizados por el usuario ( para el filtro Creados)
    this.tripsService.getTripsByOrganizer(this.currentUserId).subscribe({
        next: (trips) => {            
            this.allTrips = trips;
            this.dataLoads.allTripsLoaded = true;
            this.checkLoadingStatus();
        },
        error: (err) => {
            console.error('Error al cargar todos los viajes:', err);
            this.dataLoads.allTripsLoaded = true;
            this.checkLoadingStatus(); 
        }
    });

    // Carga de los viajes en los que el usuario participa (filtro Asistente)
    this.tripsService.getTripParticipationsByUser().subscribe({
        next: (trips: TripDto[]) => {       
            this.participatedTrips = trips;
            this.dataLoads.participatedTripsLoaded = true;
            this.checkLoadingStatus(); 
        },
        error: (err) => {
            console.error('Error al cargar los viajes participados:', err);
             this.dataLoads.participatedTripsLoaded = true; 
             this.checkLoadingStatus(); 
        }
    });
  }

    private checkLoadingStatus(): void {
        if (this.dataLoads.allTripsLoaded && this.dataLoads.participatedTripsLoaded) {
            this.isLoading = false;
            this.applyPagination();
        }
    }

  onSearch(inputValue: string): void {
    this.searchTerm = inputValue.trim().toLowerCase();
    this.currentPage = 1;
    this.applyPagination();
  }

  get filteredTrips(): TripDto[] {
    const now = new Date();
    // Dividir el filtro en grupo (asistente, creados) y opción de fecha (pasados, próximos, todos)
    const [group, option] = this.activeFilter.split(' - '); 

    // la lista base a filtrar (Creados vs. Asistente)
    let baseTrips: TripDto[] = [];
    
    if (group === 'Creados') {     
      baseTrips = this.allTrips;
    } else if (group === 'Asistente') {
      baseTrips = this.participatedTrips;
    } else {
      return []; 
    }

    let filtered = baseTrips;
    // Ahora aplicamos el filtro de fecha (Próximos, Pasados, Todos)
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
    return filtered;
  }

  
  // Para cambiar el filtro activo (se usa cada vez que clickamos en un filtro)
  setActiveFilter(group: string, option: string): void {
    this.activeFilter = `${group} - ${option}`;
    this.currentPage = 1;
    this.applyPagination();
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
