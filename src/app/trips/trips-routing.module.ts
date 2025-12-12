import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TripDetailComponent } from './pages/trip-detail/trip-detail.component';
import { FormTripComponent } from './pages/form-trip/form-trip.component';
import { MyTripsListComponent } from './pages/my-trips-list/my-trips-list.component';
import { TripParticipantsComponent } from './pages/trip-participants/trip-participants.component';
import { tripResolver } from './pages/trip-detail/trip.resolver';
import { loginGuard } from '../shared/guards/login.guard';
import { roleGuard } from '../shared/guards/role.guard';
import { editGuard } from '../shared/guards/edit-guard.guard';

const routes: Routes = [

  { path: 'mis-viajes', component: MyTripsListComponent, canMatch: [loginGuard] },

  { path: 'create-trip',
    component: FormTripComponent,
    canMatch: [loginGuard, roleGuard],
    data: { roles: ['organizer', 'admin'] }
  },

  { path: 'participants/:id',
    component: TripParticipantsComponent,
    canMatch: [loginGuard, roleGuard],
    data: { roles: ['organizer', 'admin'] }
  },

  { path: 'edit/:id/:username',
    component: FormTripComponent,
    canMatch: [loginGuard, roleGuard],
    canActivate: [editGuard],
    data: { roles: ['organizer', 'admin'] }
  },

  { path: ':id', component: TripDetailComponent, resolve: { trip: tripResolver } },




  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TripsRoutingModule { }