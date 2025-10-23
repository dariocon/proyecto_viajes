import { NgClass, NgIf, CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, Form, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { UserEdit } from '../../_interfaces/user';
import { EmailValidatorService } from '../../_services/email-validator.service';
import { UsernameValidatorService } from '../../_services/username-validator-service';

@Component({
  selector: 'app-user',
  imports: [CommonModule,ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit{


  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  private emailValidator: EmailValidatorService = inject(EmailValidatorService); 
  //private userValidator: UsernameValidatorService = inject(UsernameValidatorService); 


  editUserForm: FormGroup = this.fb.group({
  name: ['', Validators.required],
  surname: ['', Validators.required], 
  //username: ['', [Validators.required]],
  birthDate: ['', Validators.required],
  address: ['', Validators.required],
  email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
  password: ['', [ 
    Validators.minLength(6),
    Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[*?¿!]).+$/)
  ]],
  confirmPassword: [''], 
  gender: ['', Validators.required]
},{ validators: this.equalFields('password', 'confirmPassword') })



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
    this.editUserForm.markAllAsTouched(); 

    if (this.editUserForm.valid) {

      // 1. Mostrar el campo emergente para pedir la contraseña actual
      Swal.fire({
          title: 'Verifica tu identidad',
          text: 'Por favor, introduce tu contraseña actual para confirmar los cambios.',
          input: 'password',
          inputLabel: 'Contraseña actual',
          inputPlaceholder: 'Ingresa tu contraseña actual',
          showCancelButton: true,
          confirmButtonText: 'Confirmar',
          cancelButtonText: 'Cancelar',
          background: 'linear-gradient(135deg, #F95596, #FE7079)',
          color: 'white',
          iconColor: 'white',
          confirmButtonColor: 'rgba(255, 255, 255, 0.3)',
          cancelButtonColor: 'transparent',
          preConfirm: (currentPassword) => {
              if (!currentPassword || currentPassword.trim() === '') {
                  Swal.showValidationMessage('La contraseña actual es obligatoria.');
              }
              return currentPassword;
          }
      }).then((result) => {
          // 2. Ejecutar la lógica de actualización SOLO si el usuario confirma
          if (result.isConfirmed) {
              const currentPassword = result.value;
              const userEdit: UserEdit = this.editUserForm.value;
              
              // 3. Llamar al nuevo método del servicio que envía la contraseña actual
              this.authService.editUserWithPasswordVerification(userEdit, currentPassword).subscribe({
                  next: () => {
                      Swal.fire({
                          title: "Edición correcta",
                          text: "Se ha editado correctamente",
                          icon: 'success',
                          confirmButtonText: 'Aceptar',  
                          background: 'linear-gradient(135deg, #F95596, #FE7079)',
                          color: 'white',
                          iconColor: 'white',
                          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                      });
                      
                      this.editUserForm.get('password')?.reset();
                      this.editUserForm.get('confirmPassword')?.reset();
                  },
                  error: (error) => {
                      console.error("Error al editar:", error);
                      // El error del backend indica que la contraseña actual es incorrecta o hay otro problema.
                      Swal.fire({
                          title: "Error en la edición",
                          text: error?.error.message || "La contraseña actual es incorrecta o ha ocurrido un error.",
                          icon: 'error',
                          confirmButtonText: 'Aceptar',
                          background: 'linear-gradient(135deg, #F95596, #FE7079)',
                          color: 'white',
                          iconColor: 'white',
                          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
                      });
                  }
              });
          }
      });
    } else {
      this.editUserForm.markAllAsTouched();
    }
  }

  ngOnInit(): void {
    this.authService.getUser().subscribe({
      next:(user: UserEdit)=>{ 
       
        /*No podemos crear el validador condicional en el FormGroup porque
         el valor de referencia (user.username, user.email) solo está disponible después
          de la llamada asíncrona dentro del ngOnInit*/
        //const usernameControl = this.editUserForm.get('username')!;
        const emailControl = this.editUserForm.get('email')!;

        // 1. Añadimos el validador condicional de edición
        //usernameControl.setAsyncValidators(this.userValidator.userTakenOnEditValidator(user.username));
        emailControl.setAsyncValidators(this.emailValidator.emailTakenOnEditValidator(user.email));

        // 2. Reseteamos el formulario con los datos
        this.editUserForm.reset({
            name: user.name,
            surname: user.surname,
           // username: user.username,
            birthDate: user.birthDate,
            address: user.address,
            email: user.email,
            gender: user.gender
        });
        
        // 3. Forzar la re-evaluación de los nuevos validadores asíncronos. 
        //  El propósito de updateValueAndValidity() es forzar al control a recalcular su estado
       // usernameControl.updateValueAndValidity();
        emailControl.updateValueAndValidity();
       

      },
      error:(error)=>{
        Swal.fire({
          title: "Error al obtener los datos",
          text: error?.error.error,
          icon: 'error',
          confirmButtonText: 'Cerrar',
          background: 'linear-gradient(135deg, #F95596, #FE7079)',
          color: 'white',
          iconColor: 'white',
          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        }); 
        
      }
    })    
  }

}
