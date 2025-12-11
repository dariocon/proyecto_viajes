import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { loggedGuard } from '../shared/guards/logged.guard';
import { loginGuard } from '../shared/guards/login.guard';
import { roleGuard } from '../shared/guards/role.guard';

const routes: Routes = [
    {
    path: 'create-user',
    component: RegisterComponent,
    canMatch: [loginGuard, roleGuard],
    data: { roles: ['admin'] }
  },
 // { path: '', component: RegisterComponent, canMatch: [loginGuard, roleGuard], data: { roles: ['admin'] } },
  { path: 'login', component: LoginComponent, canActivate: [loggedGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [loggedGuard] },
    { path: 'create-user', component: RegisterComponent, canMatch: [loginGuard, roleGuard], data: { roles: ['admin'] } }
,{ path: '', component: RegisterComponent }
  // ruta adicional para uso desde Admin:
  //{ path: 'create-user', component: RegisterComponent, canMatch: [loginGuard, roleGuard], data: { roles: ['admin'] } }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule {}