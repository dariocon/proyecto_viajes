import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { loginGuard } from './shared/guards/login.guard';
import { RegisterComponent } from './auth/register/register.component';
import { UserComponent } from './profile-data/user/user.component';
import { HomeComponent } from './home/home/home.component';
import { usernameGuard } from './shared/guards/username.guard';
import { CreateTripComponent } from './trips/pages/create-trip/create-trip.component';
import { MyTripsListComponent } from './trips/pages/my-trips-list/my-trips-list.component';
import { TripsListComponent } from './trips/pages/trips-list/trips-list.component';
import { loggedGuard } from './shared/guards/logged.guard';
export const routes: Routes = [
    { path:'', component: HomeComponent },
    { path: 'login', component: LoginComponent, canActivate: [loggedGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [loggedGuard] },
    { path: 'usuarios/:username', component: UserComponent, canMatch: [loginGuard], canActivate: [usernameGuard]},
    { path: 'create-trip', component: CreateTripComponent, canMatch: [loginGuard] },
    { path: 'mis-viajes', component: MyTripsListComponent, canMatch: [loginGuard] },
    { path: 'viajes', component: TripsListComponent }


];
