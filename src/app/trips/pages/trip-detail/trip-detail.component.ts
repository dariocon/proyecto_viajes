import { Component, Input, OnDestroy, LOCALE_ID, OnInit } from '@angular/core';
import { TripDto } from '../../../_interfaces/trip';
import { AuthService } from '../../../_services/auth.service';
import { TripsService } from '../../../_services/trips.service';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';
import { Categoria } from '../../../_interfaces/categoria';
import { switchMap, tap } from 'rxjs';
import { DatePipe, registerLocaleData, CommonModule } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ParticipationAdd } from '../../../_interfaces/user';
registerLocaleData(localeEs, 'es');

@Component({
  selector: 'app-trip-detail',
  imports: [RouterLink, DatePipe, CommonModule],
  templateUrl: './trip-detail.component.html',
  styleUrl: './trip-detail.component.css',
  providers: [
    
    { provide: LOCALE_ID, useValue: 'es' } 
  ],
})
export class TripDetailComponent implements OnInit, OnDestroy {

  constructor(public authService: AuthService, private tripsService: TripsService) {}

  @Input() id!: number;
  trip?: TripDto;
  categoryName?: String;
  currentImageIndex: number = 0;
  hasParticipated: boolean | null = null;
  participationDate: string | null = null;

  ngOnInit(): void {
      document.body.style.backgroundColor = '#F6F7F8';

      if (this.authService.isLogged()) {
          this.hasParticipated = null; 
      } else {
          this.hasParticipated = false; // No está logueado, no participa. El estado es definitivo.
      }

      this.tripsService.getTripById(this.id).pipe(
        switchMap((trip: TripDto) => {
          this.trip = trip;
          console.log(trip.participations)
          
          if (this.authService.isLogged()) { 
              return this.tripsService.checkParticipation(this.id).pipe(
                  tap(participation => {
                      this.hasParticipated = !!participation;;
                        this.participationDate = participation ? participation.participationDate : null;

                  }),
                  switchMap(() => this.tripsService.getCategoryById(trip.categoryId)) 
              );
          } else {
              return this.tripsService.getCategoryById(trip.categoryId);
          }
        })
      ).subscribe({
        next: (category: Categoria) => {
          if (category) {
            this.categoryName = category.name;
          }
        },
        error: (err) => {
          Swal.fire({
            title: "Error al obtener el viaje",
            text: err?.error.message || "No se ha podido obtener el viaje.",
            icon: 'error',
            confirmButtonText: 'Aceptar',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          });
        }
      });
    }
  ngOnDestroy(): void {
          // Al asignar una cadena vacía (''), Angular y el navegador restaurarán el estilo definido en styles.css (blanco).
          document.body.style.backgroundColor = ''; 
      }

onSubmit(): void {
    const participation: ParticipationAdd = {
      idTrip: this.id,
      username: this.authService.username
    }

    // Confirmación antes de registrar la participación
    Swal.fire({
      title: '¿Deseas unirte a este viaje?',
      text: 'Confirma si quieres reservar tu plaza.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, reservar',
      cancelButtonText: 'Cancelar',
      background: 'linear-gradient(135deg, #F95596, #FE7079)',
      color: 'white',
      iconColor: 'white',
      confirmButtonColor: 'rgba(255, 255, 255, 0.3)',
      cancelButtonColor: '#d33'
    }).then(result => {
      if (result.isConfirmed) {

        // llamada al servicio para registrar participación
        this.tripsService.addParticipation(participation).subscribe(
          {
             next: response => {
                Swal.fire({      
                      title: "¡Participación Registrada!",
                      text: "Te has unido al viaje con éxito. ¡Prepárate para la aventura!",
                      icon: 'success',
                      confirmButtonText: 'Aceptar',
                      background: 'linear-gradient(135deg, #F95596, #FE7079)',
                      color: 'white', 
                      iconColor: 'white', 
                      confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                    }).then(() => {
                          this.hasParticipated = true;

                          // cambiamos visualmente el número de plazas disponibles tras reservar
                            if (this.trip?.participations && response) {
                              this.trip.participations.push(response); 
                              this.participationDate = response.participationDate;
                            }
                        });
             },
              error: error => Swal.fire({
                  title: '¡Error!',
                  text: error?.error.message,
                  icon: 'error',
                  confirmButtonText: 'Aceptar',
                  background: 'linear-gradient(135deg, #F95596, #FE7079)', 
                  color: 'white',
                  iconColor: 'white',
                  confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                })
          });
      }
    });
}


  nextSlide(): void {
    if (this.trip && this.trip.images && this.trip.images.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.trip.images.length;
    }
  }

  prevSlide(): void {
    if (this.trip && this.trip.images && this.trip.images.length > 1) {
      // Calcula el índice anterior de forma circular
      this.currentImageIndex = (this.currentImageIndex - 1 + this.trip.images.length) % this.trip.images.length;
    }
  }

  onCancelParticipation(): void {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar participación',
            cancelButtonText: 'No, mantener',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        }).then((result) => {
            if (result.isConfirmed) {
                
                
                this.tripsService.deleteParticipation(this.id, this.authService.username, this.participationDate!).subscribe({
                    next: (deletedParticipation) => {
                        Swal.fire({
                            title: "¡Participación Cancelada!",
                            text: "Tu participación ha sido eliminada.",
                            icon: 'info',
                            background: 'linear-gradient(135deg, #F95596, #FE7079)',
                            color: 'white',
                            iconColor: 'white',
                            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                        });
                        this.hasParticipated = false;
                          if (this.trip?.participations) {
                            this.trip.participations = this.trip.participations.filter(
                              p => p.username !== this.authService.username
                            );
                          } // cambiamos visualmente el número de plazas disponibles tras cancelar

                    },
                        error: error => {
                        Swal.fire({
                            title: '¡Error!',
                            text: error?.error?.message || 'No se pudo cancelar la participación.',
                            icon: 'error',
                            confirmButtonText: 'Aceptar',
                            background: 'linear-gradient(135deg, #F95596, #FE7079)',
                            color: 'white',
                            iconColor: 'white',
                            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                    });
                    }
                });
            }
        });
    }

  isTripInThePast(): boolean {
    if (!this.trip?.startDate) {
      return false;
    }

    const startDate = new Date(this.trip.startDate);
    const now = new Date();
    
    return startDate.getTime() < now.getTime();
}

getNumberOfDays(): number {
  // Retorna 0 si las fechas no están definidas
  if (!this.trip?.startDate || !this.trip?.endDate) return 0; 

  const msPerDay = 86400000;
  const days = Math.floor((new Date(this.trip.endDate).getTime() - new Date(this.trip.startDate).getTime()) / msPerDay) + 1;

  return days > 0 ? days : 0;
}

}
