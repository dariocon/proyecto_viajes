import { NgClass, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, Form, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserRegister } from '../../_interfaces/user';
import { EmailValidatorService } from '../../_services/email-validator.service';
import { UsernameValidatorService } from '../../_services/username-validator-service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  private emailValidator: EmailValidatorService = inject(EmailValidatorService); 
  private userValidator: UsernameValidatorService = inject(UsernameValidatorService); 


  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required], 
    username: ['', [Validators.required],[this.userValidator]],
    birthDate: ['', Validators.required],
    address: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')], [this.emailValidator]],
    password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[*?¿!]).+$/)
      ]],
    confirmPassword: ['', Validators.required],
    gender: ['Femenino', Validators.required]
  }, { validators: this.equalFields('password', 'confirmPassword') });


   equalFields(field1: string, field2: string): ValidatorFn {
    return (form: AbstractControl): ValidationErrors | null => {
      const control1 = form.get(field1);
      const control2 = form.get(field2);

      if (control1?.value !== control2?.value) {
        control2?.setErrors({ nonEquals: true });
        return { nonEquals: true };
      }

      // Si los valores son iguales, eliminamos el error solo si 'nonEquals' estaba presente antes
      if (control2?.hasError('nonEquals')) {
        control2.setErrors(null);
        control2.updateValueAndValidity({ onlySelf: true });
      }

      return null;
    };

  }

  onSubmit() {
    if (this.registerForm.valid) {
      const { username, name, surname, email, password, gender, birthDate, address } = this.registerForm.value;

      const userRegister: UserRegister = this.registerForm.value;

      this.authService.register( userRegister ).subscribe({
        next: () => {
          Swal.fire({
              title: "Registro correcto",
              text: "Se ha registrado correctamente",
              icon: 'success',
              confirmButtonText: 'Aceptar',  
              background: 'linear-gradient(135deg, #F95596, #FE7079)',
              color: 'white',
              iconColor: 'white',
              confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          }).then(
            () => this.router.navigate(['/login'])
          )

        },
        error: (error) => {
          Swal.fire({
              title: "Error en el registro",
              text: error?.error.error,
              icon: 'error',
              confirmButtonText: 'Aceptar',
              background: 'linear-gradient(135deg, #F95596, #FE7079)',
              color: 'white',
              iconColor: 'white',
              confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          })
          console.log(error)

        }
      });
     } else {
    this.registerForm.markAllAsTouched();
  }
  }
}

