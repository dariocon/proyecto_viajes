import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-error',
  imports: [RouterLink,CommonModule],
  templateUrl: './error.component.html',
  styleUrl: './error.component.css'
})
export class ErrorComponent {
errorType: 'not-found' | 'forbidden' | null = null;
  
  constructor(private route: ActivatedRoute) { }
ngOnInit(): void {
    this.route.data.subscribe(data => {
      
      // 💡 Asignación y casting: Solo acepta los tipos definidos.
      this.errorType = data['error'] as 'not-found' | 'forbidden';
      
      // 💡 Valor por defecto: Si data['error'] es undefined o null, usamos 'not-found'.
      if (!this.errorType) {
        this.errorType = 'not-found'; 
      }
      
      console.log('Error Page Component initialized with type:', this.errorType);
    });
  }
}