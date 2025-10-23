import { Component, OnDestroy, OnInit } from '@angular/core';
import { TripsService } from '../../../_services/trips.service';
import { TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; 
import { CategoriesComponent } from '../categories/categories.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { Categoria } from '../../../_interfaces/categoria';


@Component({
  selector: 'app-trips-list',
  imports: [RouterLink, CategoriesComponent, CommonModule], 
  templateUrl: './trips-list.component.html',
  styleUrl: './trips-list.component.css'
})
export class TripsListComponent implements OnInit, OnDestroy {
  
  constructor(private tripsService: TripsService, public authService: AuthService,
    private activatedRoute: ActivatedRoute, private router: Router) { } 
  isLoading: boolean = false;
  allTrips: TripDto[] = [];
  filteredTrips: TripDto[] = [];
  paginatedTrips: TripDto[] = [];
  tripsLimit: number = 6;
  selectedCategory: string = 'Todos';
  resetCategories: boolean = false;
  itemsPerPage: number = 12;
  currentPage: number = 1;
  private currentSearchTerm: string = '';
/* 
  Evita que limpiar el término de búsqueda tras seleccionar una categoría
  dispare otra vez loadTrips desde la suscripción a currentSearchTerm.
  Sin esto, cuando tras hacer una búsqueda seleccionaba una categoría, se disparaba
  la suscripción a durrentSeartchTerm en ngOnInit, que, al ser un BehaviorSubject, salta
  con cada cambio. Al seleccionar categoría, limpio eso y por tanto eso también se detecta como cambio, 
  pero en ese caso no interesa que salte, pues provocaba
   un parpadeo cargando - viajes cargados - cargando - viajes cargados.
*/
  private ignoreNextSearchTerm: boolean = false; 

  ngOnInit(): void {

      // Suscripción a la URL para leer el estado inicial (search y category)
      this.activatedRoute.queryParams.subscribe(params => {
          const termFromUrl = params['search'] || '';
          const categoryIdFromUrl = params['category'];
          
          if (termFromUrl) {
              this.tripsService.setSearchTerm(termFromUrl);
          }
          
          if (categoryIdFromUrl) {
             // const category = this.tripCategories.find(c => c.id_category === Number(categoryIdFromUrl));
             this.loadTrips('', Number(categoryIdFromUrl));
          } else {
             this.selectedCategory = 'Todos';
             this.loadTrips(this.selectedCategory);
          }
          
         // this.loadTrips(this.selectedCategory); 
      });
      
     // Suscripción al Servicio de Búsqueda
     this.tripsService.currentSearchTerm
          .pipe(debounceTime(300), distinctUntilChanged())
          .subscribe(term => {     
              if (this.ignoreNextSearchTerm) { // Si la bandera está activa, ignoramos esta emisión
                  this.ignoreNextSearchTerm = false; // Reseteamos la bandera
                  return; // No hacemos loadTrips
              }         
              this.currentSearchTerm = term;

              // si hay término de búsqueda => deseleccionar categorías en UI (el hijo reacciona a resetCategories)
              this.resetCategories = term.trim() !== '';

              // Sólo recargamos viajes: si hay búsqueda usamos la búsqueda, si no usamos la categoría ya seleccionada.
              // NO cambiamos selectedCategory aquí para evitar pisarlo cuando la acción vino desde selección de categoría.
              
              this.loadTrips(this.selectedCategory);
          });
    }

  get totalPages(): number {
    return Math.ceil(this.filteredTrips.length / this.itemsPerPage);
  }
  
  ngOnDestroy(): void {
        this.tripsService.resetSearchTerm(); 
    }
    

  handleCategoryChange(event: { categoryName: string, idCategory?: number }): void {
    const { categoryName, idCategory } = event;
    this.resetCategories = false;
        //this.tripsService.resetSearchTerm(); 
    this.ignoreNextSearchTerm = true; //con el true le decimos que vamos a limpiar la búsqueda y no queremos que dispare loadTrips

    this.currentSearchTerm = '';
    this.tripsService.setSearchTerm('');
    
    const queryParams: any = {};
    //solo se muestra categoría en la url si no es la de "todos"
    if (idCategory !== undefined && categoryName !== 'Todos') {
        queryParams['category'] = idCategory;
    }
    
    // Se actualiza la url con cada cambio de categoria
    this.router.navigate(
        [],
        { 
            relativeTo: this.activatedRoute,
            queryParams: queryParams,
            queryParamsHandling: '',
            replaceUrl: true
        }
    );

        this.loadTrips(categoryName, idCategory);
  }



loadTrips(categoryName: string, idCategory?: number): void {
    this.selectedCategory = categoryName;
    this.currentPage = 1;
    this.isLoading = true;

    const handleTrips = (trips: TripDto[] | null) => {
        this.filteredTrips = Array.isArray(trips) ? trips : [];
        this.applyPagination();
        this.isLoading = false;
    };

    // 1️⃣ Si hay término de búsqueda activo, ignorar categoría temporalmente
    if (this.currentSearchTerm && this.currentSearchTerm.trim() !== '') {
        this.tripsService.getTripsBySearchTerm(this.currentSearchTerm).subscribe({
            next: handleTrips,
            error: err => { console.error('Error en búsqueda:', err); this.isLoading = false; }
        });
        return;
    }

    // 2️⃣ Si no hay búsqueda, filtrar por categoría
    if (categoryName !== 'Todos' && idCategory !== undefined) {
        this.tripsService.getTripByIdCategory(idCategory).subscribe({
            next: handleTrips,
            error: err => { console.error(`Error al cargar categoría ${idCategory}:`, err); this.isLoading = false; }
        });
        return;
    }

    // 3️⃣ Si no hay búsqueda ni categoría, cargar todos
    this.tripsService.getTripsAvailable().subscribe({
        next: handleTrips,
        error: err => { console.error('Error al cargar todos:', err); this.isLoading = false; }
    });
}


  // Métodos de paginación

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