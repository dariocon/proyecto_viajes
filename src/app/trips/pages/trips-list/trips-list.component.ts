import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnInit } from '@angular/core';
import { TripsService } from '../../../_services/trips.service';
import { TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../../_interfaces/categoria';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-trips-list',
  imports: [RouterLink, CommonModule, FormsModule ],
  templateUrl: './trips-list.component.html',
  styleUrls: ['./trips-list.component.css']
})
export class TripsListComponent implements OnChanges, OnInit {

  // Inputs de withComponentInputBinding()
  @Input() term?: string;
  @Input() category?: number;

  tripCategories: Categoria[] = [];
  selectedCategory: string = '';

  isLoading: boolean = false;
  filteredTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = [];
  allTrips: TripDto[] = [];
  itemsPerPage: number = 12;
  currentPage: number = 1;

  resetCategories = false;

  selectedTimeFilter: string = '';

  constructor(
    private tripsService: TripsService,
    public authService: AuthService,
    private router: Router 
  ) {}

  ngOnInit(): void {
      this.tripsService.getCategories().subscribe(cats => {
      this.tripCategories = cats;
      this.loadTrips();
      this.syncCategoryState()
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    /* solo funciona si uno de los dos cambian y no es la primera vez que se ejecutan. 
       firstChange sirve para que al entrar en la página sin buscar, para ver todos los viajes, no se ejecute tanto
       el loadTrips de ngOnInit como el de ngOnChanges.
    */
     /*if (changes['resetCategories'] && this.resetCategories) {
        this.selectedCategory = '';
      }*/
    if ((changes['category'] && !changes['category'].firstChange) || 
          (changes['term'] && !changes['term'].firstChange)) {
            this.syncCategoryState();
            this.loadTrips();
    }
  }
  // método de actualización visual de la selección de categoría
  syncCategoryState(): void {
    if (this.resetCategories || this.term) {
      // si hay búsqueda o reset está activo, deseleccionamos.
      this.selectedCategory = ''; 
    } else if (this.category && this.tripCategories.length > 0) {
      // Si hay categoria en url
      const selected = this.tripCategories.find(c => c.id_category == this.category); 
      this.selectedCategory = selected ? selected.name : 'Todos'; 
    } else {
      // Por defecto (sin filtros) es Todos. Es decir, cuando se entra en /viajes a secas
      this.selectedCategory = 'Todos';
    }
  }

  
  loadTrips(): void {
    this.isLoading = true;
    
    const currentId = this.category; 
    const currentTerm = this.term;
    
    const handleTrips = (trips: TripDto[] | null) => {
      this.allTrips  = Array.isArray(trips) ? trips : [];
      this.filteredTrips = [...this.allTrips]; 
      this.currentPage = 1;
      this.applyTimeFilter(); 
      this.applyPagination();
      this.isLoading = false;
    };

    const handleError = () => {
        this.allTrips = [];
        this.filteredTrips = []; 
        this.currentPage = 1;
        this.applyPagination(); 
        this.isLoading = false; 
    };

    if (currentTerm) {
      this.resetCategories = true;
      this.tripsService.getTripsBySearchTerm(currentTerm)
        .subscribe({ next: handleTrips, error: () => this.isLoading = false });
    } else if (currentId) {
    this.resetCategories = false;
      this.tripsService.getTripByIdCategory(currentId)
        .subscribe({ next: handleTrips, error: handleError });
    } else {
      this.resetCategories = false;
      this.tripsService.getTripsAvailable()
        .subscribe({ next: handleTrips, error: handleError });
    }
    
  }

// método que se dispara con cada click en una categoría
  onFilter(categoryName: string, idCategory?: number): void {
    //this.selectedCategory = categoryName; 
    this.resetCategories = false;
    // this.category = idCategory;
   
    // Navega (esto dispara ngOnChanges y loadTrips)
    const queryParams: any = {};
    if (idCategory && categoryName !== 'Todos') {
      queryParams['category'] = idCategory;
    }
    this.router.navigate(['/viajes'], { queryParams}); 
  }

  applyTimeFilter(): void {
    const now = new Date();
    let trips = [...this.allTrips]; // filtramos siempre sobre todos los viajes

    if (this.selectedTimeFilter === 'soon') {
      trips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (this.selectedTimeFilter === 'far') {
      trips.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    } else if (this.selectedTimeFilter === 'week') {
      trips = trips.filter(t => {
        const start = new Date(t.startDate);
        const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      });
    } else if (this.selectedTimeFilter === 'month') {
      trips = trips.filter(t => {
        const start = new Date(t.startDate);
        return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
      });
    }

    this.filteredTrips = trips;
    this.currentPage = 1;
    this.applyPagination();
  }
  onTimeFilterChange(): void {
    this.applyTimeFilter();
    this.currentPage = 1;
    this.applyPagination();
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

        // Si no hay portada, usamos la primera imagen
        if (trip.images.length > 0) {
            return trip.images[0].imageUrl;
        }

        // sI no, imagen por defecto
        return defaultImage;
    }

  // métodos de paginación

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedTrips = this.filteredTrips.slice(start, start + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyPagination();
    document.querySelector('.trips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTrips.length / this.itemsPerPage);
  }

  getPageNumbers(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

}