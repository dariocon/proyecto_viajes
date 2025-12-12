import { Routes } from '@angular/router';
import { loginGuard } from './shared/guards/login.guard';
import { UserComponent } from './profile-data/user/user.component';
import { editGuard } from './shared/guards/edit-guard.guard';
import { roleGuard } from './shared/guards/role.guard';
import { VerifyComponent } from './profile-data/verify/verify.component';
import { ErrorComponent } from './errors/error/error.component';
import { NotificationComponent } from './profile-data/notification/notification.component';
import { TripsListComponent } from './trips/pages/trips-list/trips-list.component';
export const routes: Routes = [

    { path: 'usuarios/:username', component: UserComponent, canMatch: [loginGuard], canActivate: [editGuard]},

    { path: '', component: TripsListComponent },

    { path: 'viajes', component: TripsListComponent },

    { path: 'trips', loadChildren: () => import('./trips/trips.module').then(m => m.TripsModule) },

    { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },

    { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },

    { path: 'auth', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },

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
