import { NgClass, NgForOf } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../_services/auth.service';
import { Categoria } from '../../../_interfaces/categoria';
import { TripsService } from '../../../_services/trips.service';
import { TripAdd } from '../../../_interfaces/trip';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-trip',
  imports: [ReactiveFormsModule, FormsModule, NgClass, NgForOf],
  templateUrl: './create-trip.component.html',
  styleUrl: './create-trip.component.css'
})
export class CreateTripComponent implements OnInit {

  private authService: AuthService = inject(AuthService);
  private tripsService: TripsService = inject(TripsService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  selectedImages: File[] = [];
  coverImageIndex: number | null = null;
  categorias: Categoria[] = [];


  createTripForm: FormGroup = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', []], 
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      maxCapacity: [null, [Validators.min(1), Validators.pattern(/^-?\d+$/)]],
      estimatedBudget: [null, [Validators.min(0)]],
      destination: ['', [Validators.required, Validators.maxLength(200)]],
      categoryId: [null, [Validators.required]],
      // FormArray para la tabla 'itinerario_actividad'
      itineraryActivities: this.fb.array([])
    }, {
      // Validador cruzado para las fechas
      validators: this.dateRangeValidator('startDate', 'endDate') 
    });
  

   ngOnInit(): void {
    this.tripsService.getCategories().subscribe({
        next: (data) => {
            this.categorias = data;
            console.log('Categorías cargadas:', this.categorias);
        },
        error: (err) => {
            console.error('Error al cargar categorías:', err);
           
        }
    });
  }

   
  get actividades(): FormArray {
    return this.createTripForm.get('itineraryActivities') as FormArray;
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files && files.length) {
      this.selectedImages = Array.from(files);
      this.coverImageIndex = 0;
    }
  }

  setCoverImage(index: number) {
    this.coverImageIndex = index;
  }

   // Se crea un nuevo FormGroup para una actividad individual.
   
  createActivityGroup(): FormGroup {
    return this.fb.group({
      date: ['', Validators.required],
      time: [''],
      activity: ['', [Validators.required, Validators.maxLength(255)]],
      location: ['', [Validators.maxLength(200)]]      
    });
  }

  
   // Para añadir un nuevo FormGroup de actividad al FormArray.
  addActivity(): void {
    this.actividades.push(this.createActivityGroup());
  }

   // Para eliminar un FormGroup de actividad del FormArray por índice.
  removeActivity(index: number): void {
    this.actividades.removeAt(index);
  }
  
  //  Para validar fechas 
  dateRangeValidator(startControlName: string, endControlName: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const startControl = formGroup.get(startControlName);
      const endControl = formGroup.get(endControlName);
      const activities = formGroup.get('itineraryActivities') as FormArray;

      if (!startControl?.value || !endControl?.value) {
        return null;
      }

      const startDate = new Date(startControl.value);
      const endDate = new Date(endControl.value);
      
      if (startDate > endDate) {
        return { fechaInvalida: true }; 
      }

      if (activities) {
      for (let i = 0; i < activities.length; i++) {
        const actDateControl = activities.at(i).get('date');
        if (actDateControl?.value) {
          const actDate = new Date(actDateControl.value);
          if (actDate < startDate || actDate > endDate) {
            return { actividadFueraDeRango: true };
          }
        }
      }
    }

      return null;
    };
  }
  // Para eliminar la selección de fotoss
removeSelectedImages() {
        this.selectedImages = [];
        this.coverImageIndex = null;
        
        const fileInput = document.getElementById('tripImage') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }
onSubmit() {
    if (this.createTripForm.valid) {
        const formValue = this.createTripForm.value;

        // Estructura de datos del viaje (JSON)
        const viajeData: any = {
            title: formValue.title,
            description: formValue.description,
            startDate: formValue.startDate,
            endDate: formValue.endDate,
            maxCapacity: formValue.maxCapacity,
            estimatedBudget: formValue.estimatedBudget,
            destination: formValue.destination,
            categoryId: formValue.categoryId,
            organizerUsername: this.authService.username,
            itineraryActivities: formValue.itineraryActivities.map((act: any) => ({
                date: act.date,
                time: act.time,
                activity: act.activity,
                location: act.location
            }))
        };

        // Se crea el BLOB JSON para la parte trip del formulario multipart
        const viajeBlob = new File(
            [JSON.stringify(viajeData)],
            'trip.json',
            { type: 'application/json' }
        );

        const formData = new FormData();
        // Añadimos el DTO (JSON)
        formData.append('trip', viajeBlob);

        // Añadimos archivos e índice de portada
        if (this.selectedImages && this.selectedImages.length > 0) {
            
            // Añadimos todos los archivos con la clave 'images' para @RequestPart
            this.selectedImages.forEach((file) => {
                formData.append('images', file);
            });
            
            // Añadimos el índice de portada con la clave coverImageIndex (también para @RequestParam)
            const coverIndex = this.coverImageIndex !== null ? this.coverImageIndex : 0;
            formData.append('coverImageIndex', String(coverIndex));
        }
        // Hasta aquí el manejo de archivos de imágenes


        this.tripsService.addTrip(formData).subscribe({
            next: () => {
                Swal.fire({
                    title: "Viaje correcto",
                    text: "Se ha añadido correctamente",
                    icon: 'success',
                    confirmButtonText: 'Aceptar', 
                    background: 'linear-gradient(135deg, #F95596, #FE7079)',
                    color: 'white',
                    iconColor: 'white',
                    confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                }).then(() => this.router.navigate(['']));
            },
            error: (error) => {
                Swal.fire({
                    title: "Error al añadir el viaje",
                    text: error?.error.error,
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    background: 'linear-gradient(135deg, #F95596, #FE7079)',
                    color: 'white',
                    iconColor: 'white',
                    confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                });
                console.log(error);
            }
        });

    } else {
        this.createTripForm.markAllAsTouched();
    }
}


}

