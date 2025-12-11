import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { UserLogin } from '../../_interfaces/user';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  @ViewChild('loginForm', { static: true }) loginForm!: NgForm;

  username: string = '';
  password: string = '';
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  notValid(field: string): boolean {
    const control = this.loginForm?.controls[field];
    return control?.invalid && control?.touched;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const personaLogin: UserLogin = this.loginForm.value;
          this.authService.login(personaLogin).subscribe(
            {
               next: response => {
                  console.log("logueado con éxito")
                  Swal.fire({      
                      title: "Login correcto",
                      text: "Has iniciado sesión",
                      icon: 'success',
                      confirmButtonText: 'Aceptar',
                      background: 'linear-gradient(135deg, #F95596, #FE7079)',
                      color: 'white',        
                      iconColor: 'white',    
                      confirmButtonColor: 'rgba(255, 255, 255, 0.3)' 
                      }).then(
                        () => this.router.navigateByUrl('') 

                      )
               },
                error: error => Swal.fire({
                    title: '¡Error!',
                    text: "Usuario o contraseña incorrectos",
                    icon: 'error',
                    confirmButtonText: 'Aceptar',
                    background: 'linear-gradient(135deg, #F95596, #FE7079)', 
                    color: 'white',
                    iconColor: 'white',
                    confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                    }
                  )
  }
          )
  } else {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  }}