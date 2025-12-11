import { Routes } from '@angular/router';
//import { LoginComponent } from './auth/login/login.component';
import { loginGuard } from './shared/guards/login.guard';
//import { RegisterComponent } from './auth/register/register.component';
import { UserComponent } from './profile-data/user/user.component';
import { HomeComponent } from './home/home/home.component';
import { editGuard } from './shared/guards/edit-guard.guard';
//import { FormTripComponent } from './trips/pages/form-trip/form-trip.component';
//import { MyTripsListComponent } from './trips/pages/my-trips-list/my-trips-list.component';
//import { TripsListComponent } from './trips/pages/trips-list/trips-list.component';
import { loggedGuard } from './shared/guards/logged.guard';
import { roleGuard } from './shared/guards/role.guard';
import { VerifyComponent } from './profile-data/verify/verify.component';
import { ErrorComponent } from './errors/error/error.component';
//import { TripDetailComponent } from './trips/pages/trip-detail/trip-detail.component';
//import { TripParticipantsComponent } from './trips/pages/trip-participants/trip-participants.component';
import { NotificationComponent } from './profile-data/notification/notification.component';
//import { tripResolver } from './trips/pages/trip-detail/trip.resolver';
import { OrganizerProfileComponent } from './profile-data/organizer-profile/organizer-profile.component';
import { AdministrationComponent } from './admin/administration/administration.component';
import { TripsListComponent } from './trips/pages/trips-list/trips-list.component';
export const routes: Routes = [
    { path: 'usuarios/:username', component: UserComponent, canMatch: [loginGuard], canActivate: [editGuard]},
   // { path: '', loadChildren: () => import('./trips/trips.module').then(m => m.TripsModule) },
    { path: '', component: TripsListComponent },
    { path: 'viajes', component: TripsListComponent },
    { path: 'trips', loadChildren: () => import('./trips/trips.module').then(m => m.TripsModule) },
    { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
    { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },
    { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
   // { path: 'create-user', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule), canMatch: [loginGuard, roleGuard], data: { roles: ['admin'] } },    { path: 'usuarios/:username', component: UserComponent, canMatch: [loginGuard], canActivate: [editGuard]},
   // { path: 'create-trip', component: FormTripComponent, canMatch: [loginGuard, roleGuard], data: {roles:['organizer', 'admin']} },
   /* { path: 'viajes/edit/:id/:username', 
    component: FormTripComponent, 
    canMatch: [loginGuard, roleGuard], 
    canActivate: [editGuard], 
    data: { roles: ['organizer', 'admin'] } 
    },    */
  //   { path: 'mis-viajes', component: MyTripsListComponent, canMatch: [loginGuard] },
  //  { path: 'viajes', component: TripsListComponent, runGuardsAndResolvers: 'paramsOrQueryParamsChange' },
  //  { path: 'viajes/:id', component: TripDetailComponent, resolve: { trip: tripResolver } },
  //  { path: 'viajes/participants/:id', component: TripParticipantsComponent, canMatch: [loginGuard, roleGuard], data: {roles:['organizer', 'admin']} },
    { path: 'confirm', component: VerifyComponent },
    { path: 'notifications', component: NotificationComponent, canMatch: [loginGuard] }, 
    { path: 'not-found', component: ErrorComponent, data: { error: 'not-found' } },
    { path: 'unauthorized', component: ErrorComponent, data: { error: 'unauthorized' } },
    { path: 'forbidden', component: ErrorComponent, data: { error: 'forbidden' } },
    {
        path: 'organizer',
        loadChildren: () => import('./profile-data/organizer-profile/organizer-profile.module')
            .then(m => m.OrganizerProfileModule)
    },
    { 
        path: 'administration', 
        loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
        canMatch: [loginGuard, roleGuard], 
        data: { roles: ['admin'] }
    },
    { path: '**', redirectTo: '/not-found' }



];
