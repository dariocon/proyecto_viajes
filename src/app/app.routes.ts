import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { loginGuard } from './shared/guards/login.guard';
import { RegisterComponent } from './auth/register/register.component';
import { UserComponent } from './profile-data/user/user.component';
import { HomeComponent } from './home/home/home.component';
import { usernameGuard } from './shared/guards/username.guard';
export const routes: Routes = [
    { path:'', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'usuarios/:username', component: UserComponent, canMatch: [loginGuard], canActivate: [usernameGuard]}
];
