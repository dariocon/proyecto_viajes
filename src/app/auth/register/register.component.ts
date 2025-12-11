
import { Component, inject, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserRegister } from '../../_interfaces/user';
import { EmailValidatorService } from '../../_services/email-validator.service';
import { UsernameValidatorService } from '../../_services/username-validator-service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  @Input() admin: boolean = false;
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  private emailValidator: EmailValidatorService = inject(EmailValidatorService); 
  private userValidator: UsernameValidatorService = inject(UsernameValidatorService); 


  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required], 
    username: ['', [Validators.required],[this.userValidator]],
    birthDate: ['', [Validators.required, this.minimumOneYearAgeValidator()]],
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
  minimumOneYearAgeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;

    const [year, month, day] = control.value.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day); // month-1 porque JS usa 0-11
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    return birthDate > oneYearAgo ? { minAgeOneYear: true } : null;
  };
}

  onSubmit() {
    if (this.registerForm.valid) {
      const { username, name, surname, email, password, gender, birthDate, address } = this.registerForm.value;

      const userRegister: UserRegister = this.registerForm.value;

      this.authService.register( userRegister ).subscribe({
        next: () => {
          if (!this.admin) {
              Swal.fire({
                  title: "Registro correcto",
                  text: "Te hemos enviado un enlace de confirmación a tu correo.",
                  icon: 'success',
                  confirmButtonText: 'Aceptar',  
                  background: 'linear-gradient(135deg, #F95596, #FE7079)',
                  color: 'white',
                  iconColor: 'white',
                  confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
              }).then(
                () => this.router.navigate(['/auth/login'])
              )
          
         }else{
              Swal.fire({
                  title: "Usuario creado",
                  text: "Se ha registrado un nuevo usuario.",
                  icon: 'success',
                  confirmButtonText: 'Aceptar',  
                  background: 'linear-gradient(135deg, #F95596, #FE7079)',
                  color: 'white',
                  iconColor: 'white',
                  confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
              })
          }
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

      goBack(): void {
        history.back(); 
    }
}

