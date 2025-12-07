import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { TripsService } from '../../../_services/trips.service';
import { TripPageResponse, TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../../_interfaces/categoria';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-trips-list',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './trips-list.component.html',
  styleUrls: ['./trips-list.component.css']
})
export class TripsListComponent implements OnChanges, OnInit {

  @Input() term?: string;
  @Input() category?: number;

  tripCategories: Categoria[] = [];
  isLoading: boolean = false;
  isHeroImageLoading: boolean = true;
  isCategoriesLoading: boolean = true;

  //filteredTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = [];
  
  // Variables de paginación del backend
  currentPage: number = 0; // Backend usa índice 0
  itemsPerPage: number = 12;
  totalElements: number = 0;
  totalPages: number = 0;
  
  selectedTimeFilter: string = '';
  sortBy: string = 'startDate';
  sortDir: string = 'ASC';

  constructor(
    private tripsService: TripsService,
    public authService: AuthService,
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.tripsService.getCategories().subscribe(cats => {
      this.tripCategories = cats;
      this.isHeroImageLoading = false;
      this.isCategoriesLoading = false;
      this.loadTrips();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['category'] && !changes['category'].firstChange) || 
        (changes['term'] && !changes['term'].firstChange)) {
      this.currentPage = 0; // Resetear a página 0
      this.loadTrips();
    }
  }

  isCategoryActive(categoryId?: number): boolean {
    if (this.term){
      return false;
    }     
    if (!categoryId) {
      return !this.category;
    }
    return Number(this.category) === Number(categoryId);
  }

  loadTrips(): void {
    this.isLoading = true;

    const handlePageResponse = (response: TripPageResponse) => {
        this.paginatedTrips = response.content;
        this.totalElements = response.page.totalElements;
        this.totalPages = response.page.totalPages;
        this.currentPage = response.page.number;
        this.itemsPerPage = response.page.size;
        this.isLoading = false;
    };

    const handleError = () => {
        this.paginatedTrips = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.isLoading = false;
    };

    // Determinar sortBy y sortDir según el filtro de tiempo
    this.updateSortParams();

        const timeFilter = (this.selectedTimeFilter === 'week' || this.selectedTimeFilter === 'month') 
        ? this.selectedTimeFilter 
        : undefined;

    // Prioridad: 1) Búsqueda, 2) Categoría, 3) Todos
    if (this.term) {
      this.tripsService.searchTripsAvailable(this.term, this.currentPage, this.itemsPerPage, this.sortBy, this.sortDir)
        .subscribe({ next: handlePageResponse, error: handleError });
    } else if (this.category) {
      this.tripsService.getTripByIdCategory(this.category, this.currentPage, this.itemsPerPage, this.sortBy, this.sortDir,timeFilter)
        .subscribe({ next: handlePageResponse, error: handleError });

    } else {
      this.tripsService.getTripsAvailable(this.currentPage, this.itemsPerPage, this.sortBy, this.sortDir, timeFilter)
        .subscribe({ next: handlePageResponse, error: handleError });
    }
  }

  updateSortParams(): void {
    if (this.selectedTimeFilter === 'soon') {
      this.sortBy = 'startDate';
      this.sortDir = 'ASC';
    } else if (this.selectedTimeFilter === 'far') {
      this.sortBy = 'startDate';
      this.sortDir = 'DESC';
    } else {
      // Por defecto
      this.sortBy = 'startDate';
      this.sortDir = 'ASC';
    }
  }

  onFilter(categoryId?: number): void {
    const queryParams: any = {};
    
    if (categoryId) {
      queryParams['category'] = categoryId;
    }
    
    this.router.navigate(['/viajes'], { queryParams });
  }

  onTimeFilterChange(): void {
    this.currentPage = 0; // Resetear a página 0

    // Si hay búsqueda activa, limpiarla primero. Si he buscado y pulso en un filtro temporal, que no se aplique a la búsqueda.
    if (this.term && this.term.trim()) {
      this.term = undefined;
      this.router.navigate(['/viajes']); // Limpia query params
      return; // para evitar llamar loadTrips() dos veces
    }

    this.loadTrips();
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

  // Métodos de paginación
  
  changePage(page: number): void {
    // Convertir de 1 a 0 (backend)
    const backendPage = page - 1;
    
    if (backendPage < 0 || backendPage >= this.totalPages) return;
    
    this.currentPage = backendPage;
    this.loadTrips();
    document.querySelector('.trips-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getPageNumbers(): number[] {
    // Convertir índices 0a 1 para la UI
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }

  get displayCurrentPage(): number {
    // Mostrar página 1 en la UI
    return this.currentPage + 1;
  }
}