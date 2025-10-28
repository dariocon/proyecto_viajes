import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Categoria } from '../../../_interfaces/categoria';
import { TripsService } from '../../../_services/trips.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit, OnChanges {

  @Output() categorySelected = new EventEmitter<{ categoryName: string, idCategory?: number }>();
  @Input() reset: boolean = false;

  tripCategories: Categoria[] = [];
  selectedCategory: string = 'Todos';

  constructor(private tripsService: TripsService) { }

  ngOnInit(): void {
    this.tripsService.getCategories().subscribe(cats => {
      this.tripCategories = cats;
    });
  }

  onFilter(categoryName: string, idCategory?: number): void {
    this.selectedCategory = categoryName;
    this.categorySelected.emit({ categoryName, idCategory });
  }
// Cuando busco, se deselecciona la categoría que esté pulsada, y si entro a viajes por búsqueda desde otra página, igual.
ngOnChanges(changes: SimpleChanges): void {
  if (changes['reset'] && this.reset) {
    this.selectedCategory = '';
  }
}



}
