import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { Categoria } from '../../../_interfaces/categoria';
import { TripsService } from '../../../_services/trips.service';

@Component({
  selector: 'app-categories',
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css'
})
export class CategoriesComponent implements OnChanges, OnInit {

@Output() categorySelected = new EventEmitter<{ categoryName: string, idCategory?: number }>();
@Input() reset: boolean = false;
constructor(private tripsService: TripsService) { }
selectedCategory: string = 'Todos';
tripCategories:Categoria[]= [] 


onFilter(categoryName: string, idCategory?: number): void {
        this.selectedCategory = categoryName; 

        this.categorySelected.emit({ categoryName, idCategory });
    }

ngOnInit(): void {
         this.tripsService.getCategories().subscribe(cats => {
          this.tripCategories = cats;
      })
  }
ngOnChanges(changes: SimpleChanges): void {
  if (changes['reset'] && changes['reset'].currentValue === true) {
    this.selectedCategory = '';
  }
}


}


