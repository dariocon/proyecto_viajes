import { Component, inject, Input, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../_services/auth.service';
import { TripsService } from '../../../_services/trips.service';
import { ParticipationDto } from '../../../_interfaces/user';
import { NotificationDtoAdd } from '../../../_interfaces/notification';
import Swal from 'sweetalert2';
import { NotificationService } from '../../../_services/notification.service';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-trip-participants',
  imports: [FormsModule, RouterLink],
  templateUrl: './trip-participants.component.html',
  styleUrl: './trip-participants.component.css'
})
export class TripParticipantsComponent implements OnInit {

  @Input() id!: number;

    private authService: AuthService = inject(AuthService);
    private tripsService: TripsService = inject(TripsService);
    private notificationService: NotificationService = inject(NotificationService);
    private router: Router = inject(Router);


    participations: ParticipationDto[]= []

    ngOnInit(): void {
    this.tripsService.getTripParticipationsByTrip(this.id).subscribe({
              next: (participations: ParticipationDto[]) => {
                    this.participations= participations
              },
              error: (err) => {
                Swal.fire({
                  title: "Error al obtener los participantes",
                  text: err?.error.message || "No se han podido obtener los participantes.",
                  icon: 'error',
                  confirmButtonText: 'Aceptar',
                  background: 'linear-gradient(135deg, #F95596, #FE7079)',
                  color: 'white',
                  iconColor: 'white',
                  confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                });
              }
            }
        
    
    );
    
  }


    async openNotificationForm(username: string): Promise<void> {
        const { value: content } = await Swal.fire({
            title: `Enviar Notificación a <span style="color: #F95596; font-weight: bold;">${username}</span>`,
            html: `
                <div style="text-align: left; margin-top: 10px;">
                    <label for="swal-input-content" style="font-weight: 500; display: block; margin-bottom: 5px;">Contenido del Mensaje:</label>
                </div>
            `,
            input: 'textarea',
            inputAttributes: {
                id: 'swal-input-content',
                placeholder: 'Escribe el mensaje que quieres enviar al participante...',
                rows: '5',
                style: 'resize: none;'
            },
            showCancelButton: true,
            confirmButtonText: 'Enviar Notificación',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#F95596', 
            cancelButtonColor: '#6c757d',
            reverseButtons: true,
            background: '#fff',
            inputValidator: (value) => {
                if (!value || value.trim().length === 0) {
                    return '¡Debes escribir un mensaje para enviar la notificación!';
                }
                return null;
            }
        });

        // Si se recibe contenido 
        if (content) {
            this._executeSendNotification(username, content);
        }
    }

    //llamada al servicio de notificación.
    private _executeSendNotification(username: string, content: string): void {
                const getLocalIsoTime = (): string => {
            const now = new Date();
            const pad = (num: number) => num.toString().padStart(2, '0');
            return now.getFullYear() + '-' +
                   pad(now.getMonth() + 1) + '-' +
                   pad(now.getDate()) + 'T' +
                   pad(now.getHours()) + ':' +
                   pad(now.getMinutes()) + ':' +
                   pad(now.getSeconds());
        };

        const notificationDto: NotificationDtoAdd = {
            username: username,
            content: content.trim(),
            tripId: this.id, 
            sentDate: getLocalIsoTime() 
        };

        this.notificationService.addNotification(notificationDto).subscribe({
            next: () => {
                Swal.fire({
                    title: "¡Éxito!",
                    text: `Notificación enviada a ${username}.`,
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    background: 'linear-gradient(135deg, #F95596, #FE7079)',
                    color: 'white',
                    iconColor: 'white',
                    confirmButtonColor: 'rgba(255, 255, 255, 0.3)' 
                });
            },
            error: (err) => {
                const message = err?.error?.message || "Hubo un error al enviar la notificación.";
                Swal.fire({
                    title: '¡Error!',
                    text: message,
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

private _executeSendNotificationToAll(content: string): void {
    this.notificationService.sendNotificationToAllParticipants(this.id, content)
        .subscribe({
            next: () => {
                Swal.fire({
                    title: "¡Éxito!",
                    text: "La notificación se ha enviado a todos los participantes.",
                    icon: 'success',
                    confirmButtonText: 'Aceptar',
                    background: 'linear-gradient(135deg, #F95596, #FE7079)',
                    color: 'white',
                    iconColor: 'white',
                    confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                });
            },
            error: (err) => {
                Swal.fire({
                    title: "Error",
                    text: err?.error?.message || "No se pudo enviar la notificación.",
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

    async openNotificationFormForAll(): Promise<void> {
    const { value: content } = await Swal.fire({
        title: `Notificar a TODOS los participantes`,
        html: `
            <div style="text-align: left; margin-top: 10px;">
                <label for="swal-input-content" style="font-weight: 500; display: block; margin-bottom: 5px;">
                    Contenido del Mensaje:
                </label>
            </div>
        `,
        input: 'textarea',
        inputAttributes: {
            id: 'swal-input-content',
            placeholder: 'Escribe el mensaje a enviar a todos los participantes...',
            rows: '5',
            style: 'resize: none;'
        },
        showCancelButton: true,
        confirmButtonText: 'Enviar a Todos',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#F95596',
        cancelButtonColor: '#6c757d',
        reverseButtons: true,
        background: '#fff',
        inputValidator: (value) => {
            if (!value || value.trim().length === 0) {
                return '¡Debes escribir un mensaje!';
            }
            return null;
        }
    });

    if (content) {
        this._executeSendNotificationToAll(content);
    }
}

}