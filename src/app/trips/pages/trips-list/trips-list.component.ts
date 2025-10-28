import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter, OnInit } from '@angular/core';
import { TripsService } from '../../../_services/trips.service';
import { TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import { RouterLink, Router } from '@angular/router';
import { CategoriesComponent } from '../categories/categories.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-trips-list',
  imports: [RouterLink, CategoriesComponent, CommonModule],
  templateUrl: './trips-list.component.html',
  styleUrls: ['./trips-list.component.css']
})
export class TripsListComponent implements OnChanges, OnInit {

  // Inputs de withComponentInputBinding()
  @Input() term?: string;
  @Input() category?: number;

  isLoading: boolean = false;
  filteredTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = [];

  itemsPerPage: number = 12;
  currentPage: number = 1;

resetCategories = false;

  constructor(
    private tripsService: TripsService,
    public authService: AuthService,
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  ngOnChanges(changes: SimpleChanges): void {
    /* solo funciona si uno de los dos cambian y no es la primera vez que se ejecutan. 
       Sirve para que al entrar en la página sin buscar, para ver todos los viajes, no se ejecute tanto
       el loadTrips de ngOnInit como el de ngOnChanges.
    */
    if ((changes['category'] && !changes['category'].firstChange) || 
          (changes['term'] && !changes['term'].firstChange)) {
      this.loadTrips();
    }
  }

  loadTrips(): void {
    this.isLoading = true;
    
    const currentId = this.category; 
    const currentTerm = this.term;

    const handleTrips = (trips: TripDto[] | null) => {
      this.filteredTrips = Array.isArray(trips) ? trips : [];
      this.currentPage = 1;
      this.applyPagination();
      this.isLoading = false;
    };

    const handleError = () => {
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
    // método de comunicación con el componente hijo categorías
  onCategorySelected(event: { categoryName: string, idCategory?: number }): void {
    const queryParams: any = {};
    if (event.idCategory && event.categoryName !== 'Todos') {
      queryParams['category'] = event.idCategory;
    }
    this.router.navigate(['/viajes'], { queryParams }); 
  }
}