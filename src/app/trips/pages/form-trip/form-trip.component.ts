import { NgClass, NgForOf, NgStyle } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../_services/auth.service';
import { Categoria } from '../../../_interfaces/categoria';
import { TripsService } from '../../../_services/trips.service';
import { TripAdd, TripDto } from '../../../_interfaces/trip';
import { SelectedImageFile, imageDto } from '../../../_interfaces/image';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-form-trip',
  imports: [ReactiveFormsModule, FormsModule, NgClass, NgStyle],
  templateUrl: './form-trip.component.html',
  styleUrl: './form-trip.component.css'
})
export class FormTripComponent implements OnInit {

    private authService: AuthService = inject(AuthService);
    private tripsService: TripsService = inject(TripsService);
    private router: Router = inject(Router);
    private fb: FormBuilder = inject(FormBuilder);

    // Input de withComponentInputBinding
    @Input() id!: number;
    trip!: TripDto;
    title:string='Crear viaje';
    
    selectedImages: SelectedImageFile[] = []; 
    coverImageIndex: number | null = null;
    categorias: Categoria[] = [];
    existingImages: imageDto[] = [];
    imagesToDelete: number[] = [];
    currentParticipantsCount: number = 0;

    createTripForm: FormGroup = this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(200)]],
        description: ['', []], 
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
        maxCapacity: [null, [Validators.min(1), Validators.pattern(/^-?\d+$/), this.minCapacityValidator.bind(this)]],
        estimatedBudget: [null, [Validators.min(0)]],
        destination: ['', [Validators.required, Validators.maxLength(200)]],
        categoryId: [null, [Validators.required]],
        itineraryActivities: this.fb.array([])
      }, {
        validators: this.dateRangeValidator('startDate', 'endDate') 
      });
    

    ngOnInit(): void {
        if(this.id){
            this.tripsService.getTripById(this.id).subscribe({
            next: (tripResponse) => {
                this.trip=tripResponse
                this.currentParticipantsCount = this.trip.participations?.length || 0;

                if (this.trip.images) {
                        this.existingImages = this.trip.images.map(img => ({ // Serán las imágenes ya existentes del viaje
                            imageUrl: img.imageUrl,
                            isCover: img.isCover,
                            id: img.id 
                        }));
                        const coverIndexExisting = this.existingImages.findIndex(img => img.isCover);
                        this.coverImageIndex = coverIndexExisting !== -1 ? coverIndexExisting : 0;
                } else {
                    this.coverImageIndex = null;
                }

                // Inicializamos el formulario con los datos del viaje a editar
                this.createTripForm.reset({
                    title: this.trip.title,
                    description: this.trip.description,
                    startDate: this.trip.startDate,
                    endDate: this.trip.endDate,
                    destination: this.trip.destination,
                    categoryId: this.trip.categoryId,
                    maxCapacity: this.trip.maxCapacity,
                    estimatedBudget: this.trip.estimatedBudget 
                });
                this.trip.itineraryActivities.forEach(activity => {
                    this.actividades.push(this.fb.group(activity));
                });

                this.createTripForm.get('maxCapacity')?.updateValueAndValidity();
            },
            error: (err) =>{
                console.log(err)
            }
          })
        }
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

    // Método de manejo de archivos para la previsualización
    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files) return;

        const files: File[] = Array.from(input.files);

        files.forEach(file => {
            if (!file.type.match('image.*')) return; // Solo procesar imágenes

            const reader = new FileReader();

            reader.onload = (e: any) => {
                // Creamos el objeto con la URL de previsualización
                const fileWithPreview: SelectedImageFile = Object.assign(file, { previewUrl: e.target.result });
                
                // Lo añadimos al array principal de imágenes seleccionadas
                this.selectedImages.push(fileWithPreview);
                
                // Si no hay portada seleccionada, asignamos la primera
                if (this.coverImageIndex === null && this.existingImages.length === 0) {
                    this.coverImageIndex = 0;
                } else if (this.coverImageIndex === null && this.existingImages.length > 0) {
                    // Si ya hay existentes, la portada será la primera nueva (índice después de las existentes)
                    this.coverImageIndex = this.existingImages.length; 
                }
            };

            reader.readAsDataURL(file); // Inicia la lectura asíncrona
        });
        
        // Vaciar el input para permitir seleccionar el mismo archivo
        input.value = '';
    }

    // Getter combinado para crear lista combinada para visualizar
    get combinedImages(): { name: string, isFile: boolean, imageUrl: string, index: number }[] {
        const combined: { name: string, isFile: boolean, imageUrl: string, index: number }[] = [];
        
        // 1. Imágenes existentes
        this.existingImages.forEach((img, i) => {
            const urlName = img.imageUrl 
                ? `${img.imageUrl.substring(img.imageUrl.lastIndexOf('/') + 1)}` 
                : 'Imagen existente';
                
            combined.push({ 
                name: urlName, 
                isFile: false, 
                // Usamos la propiedad imageUrl existente para este campo
                imageUrl: img.imageUrl, 
                index: i
            });
        });
        
        // 2. Imágenes nuevas
        this.selectedImages.forEach((file, i) => {
            // Assert para usar la propiedad previewUrl
            const previewFile = file as SelectedImageFile;
            combined.push({ 
                name: file.name, 
                isFile: true,
                // Usamos la propiedad previewUrl, pero la asignamos al campo imageUrl
                imageUrl: previewFile.previewUrl, 
                index: this.existingImages.length + i
            });
        });
        
        return combined;
    }

    //método para borrar imágenes
    removeImage(index: number, isExisting: boolean): void {
        if (isExisting) { //para eliminar las imágenes ya existentes añadiéndolo al array de imágenes de la BBDD a eliminar
            const imageId = this.existingImages[index].id;
            this.imagesToDelete.push(imageId);
            this.existingImages.splice(index, 1); //para eliminar del frontend la imagen y su previsualización
            
            if (this.coverImageIndex === index) { //tras ello, se reestablece la portada si la imagen eliminada lo era.
                this.coverImageIndex = null; //se establece en nulo la portada<
            } else if (this.coverImageIndex !== null && this.coverImageIndex > index) { 
                this.coverImageIndex--; // si no era portada, se disminuye el índice de la portada a uno SI 
                                        // la imagen eliminada era anterior a la de la portada con el objetivo de ajustar el índice al mismo al que ha cambiado la imagen
            }

        } else {
            // dado que visualmente hay una lista combinada (se muestran tanto las existentes como las nuevas en el front)
            // debemos convertir el index de la lista visual (combinada) al índice ral dentro del array de selected (las nuevas, no las ya existentes)
            const newImageIndex = index - this.existingImages.length;
            this.selectedImages.splice(newImageIndex, 1);
            
            if (this.coverImageIndex === index) { //si no queda ya ninguna imagen en la galeria, portada es nul
                this.coverImageIndex = null;
            }
        }
        
        if (this.existingImages.length + this.selectedImages.length === 0) {
            this.coverImageIndex = null;
        }
    }

    // método para establecer portada
    setCoverImage(index: number) {
        this.coverImageIndex = index;
    }

    // método para abrir subformulario de actividades en grupo.
    createActivityGroup(): FormGroup {
        return this.fb.group({
            date: ['', Validators.required],
            time: [''],
            activity: ['', [Validators.required, Validators.maxLength(255)]],
            location: ['', [Validators.maxLength(200)]]     
        });
    }

    addActivity(): void {
      this.actividades.push(this.createActivityGroup());
    }

    removeActivity(index: number): void {
      this.actividades.removeAt(index);
    }
    
    // método para validar que la fecha de cada actividad no se sale del rango de las fechas de inicio y final del viaje
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

    // validamos que la capacidad no se pueda editar por debajo del número de participantes actuales del viaje
    minCapacityValidator(control: AbstractControl): ValidationErrors | null {
        if (!this.id) {
            return null;
        }

        const maxCapacity = control.value;

        if (maxCapacity !== null && maxCapacity < this.currentParticipantsCount) {
            return { 
                minCapacityRequired: { 
                    required: this.currentParticipantsCount,
                    actual: maxCapacity
                } 
            };
        }
        return null;
    }
   /* removeSelectedImages() {
        this.imagesToDelete = this.imagesToDelete.concat(this.existingImages.map(img => img.id));
        this.existingImages = []; 
        this.selectedImages = [];
        this.coverImageIndex = null;
        
        const fileInput = document.getElementById('tripImage') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    }*/

    onSubmit() {
        if (this.id) {
            this.onUpdate();
            return;
        }
        if (this.createTripForm.valid) {
            const formValue = this.createTripForm.value;

            const viajeData: any = {
                title: formValue.title,
                description: formValue.description,
                startDate: formValue.startDate,
                endDate: formValue.endDate,
                maxCapacity: formValue.maxCapacity,
                estimatedBudget: parseFloat(Number(formValue.estimatedBudget).toFixed(2)),
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

            const viajeBlob = new File(
                [JSON.stringify(viajeData)],
                'trip.json',
                { type: 'application/json' }
            );

            const formData = new FormData();
            formData.append('trip', viajeBlob);

            if (this.selectedImages && this.selectedImages.length > 0) {
                
                this.selectedImages.forEach((file) => {
                    formData.append('images', file);
                });
                
                const coverIndex = this.coverImageIndex !== null ? this.coverImageIndex : 0;
                formData.append('coverImageIndex', String(coverIndex));
            }

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

    onUpdate() {
        if (this.createTripForm.valid) {
            const formValue = this.createTripForm.value;

            const viajeData: any = {
                title: formValue.title,
                description: formValue.description,
                startDate: formValue.startDate,
                endDate: formValue.endDate,
                maxCapacity: formValue.maxCapacity,
                estimatedBudget: parseFloat(Number(formValue.estimatedBudget).toFixed(2)),
                destination: formValue.destination,
                id_category: formValue.categoryId,
                organizerUsername: this.authService.username,
                itineraryActivities: formValue.itineraryActivities.map((act: any) => ({
                    date: act.date,
                    time: act.time,
                    activity: act.activity,
                    location: act.location
                }))
            };

            const viajeBlob = new File(
                [JSON.stringify(viajeData)],
                'trip.json',
                { type: 'application/json' }
            );

            const formData = new FormData();
            formData.append('trip', viajeBlob);

        
            let newCoverIndex = -1;
            if (this.coverImageIndex !== null) {
                newCoverIndex = this.coverImageIndex;
            }

            let coverImageIndexForBackend = -1;
            
            // Si la portada es una imagen existente
            if (newCoverIndex !== -1 && newCoverIndex < this.existingImages.length) {
                formData.append('coverImageId', String(this.existingImages[newCoverIndex].id)); 
            } 
            
            // Si la portada es una imagen nueva si hay
            else if (newCoverIndex !== -1 && newCoverIndex >= this.existingImages.length) {
                coverImageIndexForBackend = newCoverIndex - this.existingImages.length;
            }

            // Se adjuntar imágenes nuevas si hay
            if (this.selectedImages && this.selectedImages.length > 0) {
                this.selectedImages.forEach((file) => {
                    formData.append('images', file);
                });
                
                if (coverImageIndexForBackend !== -1) {
                    formData.append('coverImageIndex', String(coverImageIndexForBackend));
                }
            }
            
            // Se pasan id de imágenes a eliminar 
            if (this.imagesToDelete.length > 0) {
                this.imagesToDelete.forEach(id => {
                    formData.append('imagesToDelete', String(id)); 
                });
            }

            
            this.tripsService.updateTrip(this.id, formData).subscribe({
                next: () => {
                    Swal.fire({
                        title: "Viaje actualizado",
                        text: "Los cambios se han guardado correctamente.",
                        icon: 'success',
                        confirmButtonText: 'Aceptar', 
                        background: 'linear-gradient(135deg, #F95596, #FE7079)',
                        color: 'white',
                        iconColor: 'white',
                        confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                    }).then(() => this.router.navigate(['/viajes/', this.id])); 
                },
                error: (error) => {
                        Swal.fire({
                        title: "Error al actualizar el viaje",
                        text: error?.error.error,
                        icon: 'error',
                        confirmButtonText: 'Aceptar',
                        background: 'linear-gradient(135deg, #F95596, #FE7079)',
                        color: 'white',
                        iconColor: 'white',
                        confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                    });
                    console.error(error);
                }
            });

        } else {
          this.createTripForm.markAllAsTouched();
        }
    }

}