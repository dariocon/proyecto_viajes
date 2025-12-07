import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TripsService } from '../../_services/trips.service';
import { TripDto } from '../../_interfaces/trip';
import { UsuariosDto } from '../../_interfaces/user';
import { UserService } from '../../_services/user.service';
import { Subscription } from 'rxjs';
import { NgClass , CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../_services/auth.service';
import { TableUsersComponent } from "../tables/table-users/table-users.component";
import { TableTripsComponent } from "../tables/table-trips/table-trips.component";

@Component({
  selector: 'app-administration',
  imports: [NgClass, FormsModule, CommonModule, RouterLink, TableUsersComponent, TableTripsComponent],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.css'
})
export class AdministrationComponent  {

  activeSection: 'trips' | 'users' = 'trips';

}
