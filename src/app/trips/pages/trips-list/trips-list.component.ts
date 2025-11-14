import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { TripsService } from '../../../_services/trips.service';
import { TripDto } from '../../../_interfaces/trip';
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

  // Inputs de withComponentInputBinding()
  @Input() term?: string;
  @Input() category?: number;

  tripCategories: Categoria[] = [];
  isLoading: boolean = false;
  filteredTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = [];
  allTrips: TripDto[] = [];
  itemsPerPage: number = 12;
  currentPage: number = 1;
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
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Solo recarga cuando cambien los filtros y no sea la primera vez
    if ((changes['category'] && !changes['category'].firstChange) || 
        (changes['term'] && !changes['term'].firstChange)) {
      this.loadTrips();
    }
  }

  // Método para saber si una categoría está seleccionada
  isCategoryActive(categoryId?: number): boolean {
    // Si hay término de búsqueda, ninguna categoría está activa
    if (this.term){
      return false;
    }     
    // Si no hay categoryId (botón "Todos")
    if (!categoryId) {
      return !this.category; // Activo si no hay categoría en URL
    }
    
    // Comparar con la categoría actual - convertir ambos a número
    return Number(this.category) === Number(categoryId);
  }

  loadTrips(): void {
    this.isLoading = true;

    const handleTrips = (trips: TripDto[] | null) => {
      this.allTrips = Array.isArray(trips) ? trips : [];
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

    // Prioridad: 1) Búsqueda, 2) Categoría, 3) Todos
    if (this.term) {
      this.tripsService.getTripsBySearchTerm(this.term)
        .subscribe({ next: handleTrips, error: handleError });
    } else if (this.category) {
      this.tripsService.getTripByIdCategory(this.category)
        .subscribe({ next: handleTrips, error: handleError });
    } else {
      this.tripsService.getTripsAvailable()
        .subscribe({ next: handleTrips, error: handleError });
    }
  }

  // Método que se dispara con cada click en una categoría
  onFilter(categoryId?: number): void {
    const queryParams: any = {};
    
    if (categoryId) {
      queryParams['category'] = categoryId;
    }
    // Si categoryId es undefined, navegamos a /viajes sin params (Todos)
    
    this.router.navigate(['/viajes'], { queryParams });
  }

  applyTimeFilter(): void {
    const now = new Date();
    let trips = [...this.allTrips]; 

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

    // Si no, imagen por defecto
    return defaultImage;
  }



  // Métodos de paginación
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