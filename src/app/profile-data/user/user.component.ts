import { NgClass, NgIf, CommonModule, NgStyle } from '@angular/common';
import { Component, inject, OnInit, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../_services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { UserEdit } from '../../_interfaces/user';
import { EmailValidatorService } from '../../_services/email-validator.service';

@Component({
  selector: 'app-user',
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgClass, NgStyle],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {

  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private fb: FormBuilder = inject(FormBuilder);
  private emailValidator: EmailValidatorService = inject(EmailValidatorService);
  //private userValidator: UsernameValidatorService = inject(UsernameValidatorService);
  private usernameToEdit: string = '';
  @Input() username!:string;

  editUserForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    surname: ['', Validators.required],
    birthDate: ['', [Validators.required, this.minimumOneYearAgeValidator()]],
    address: ['', Validators.required],
    email: ['', [Validators.required, Validators.email, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
    password: ['', [
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[*?¿!]).+$/)
    ]],
    confirmPassword: [''],
    gender: ['', Validators.required]
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

  ngOnInit(): void {

   // const usernameFromRoute = this.route.snapshot.paramMap.get('username');
    //es el username del input que obtenemos de la url
    if (!this.username) {
      Swal.fire({
        title: "Error",
        text: "No se ha especificado un usuario",
        icon: 'error',
        confirmButtonText: 'Cerrar'
      });
      return;
    }

    this.usernameToEdit = this.username;

    // Traer los datos del usuario desde el backend
    this.authService.getUserByUsername(this.usernameToEdit).subscribe({
      next: (user: UserEdit) => {
        /*No podemos crear el validador condicional en el FormGroup porque
         el valor de referencia (user.username, user.email) solo está disponible después
          de la llamada asíncrona dentro del ngOnInit*/
        //const usernameControl = this.editUserForm.get('username')!;
        const emailControl = this.editUserForm.get('email')!;
        // 1. Añadimos el validador condicional de edición
        //usernameControl.setAsyncValidators(this.userValidator.userTakenOnEditValidator(user.username));
        emailControl.setAsyncValidators(this.emailValidator.emailTakenOnEditValidator(user.email!));
        // 2. Reseteamos el formulario con los datos
        this.editUserForm.reset({
          name: user.name,
          surname: user.surname,
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
      error: (error) => {
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
    });
  }

onSubmit() {
  this.editUserForm.markAllAsTouched();

  if (this.editUserForm.valid) {
    //si es admin no tengo que confirmar password
    if (this.authService.role === 'admin') {
      this.authService.editUserWithPasswordVerification(this.editUserForm.value, '', this.usernameToEdit).subscribe({
        next: () => Swal.fire({
          title: "Edición correcta",
          text: "Se ha editado correctamente",
          icon: 'success',
          confirmButtonText: 'Aceptar',
          background: 'linear-gradient(135deg, #F95596, #FE7079)',
          color: 'white',
          iconColor: 'white',
          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        }).finally(() => {
          this.editUserForm.get('password')?.reset();
          this.editUserForm.get('confirmPassword')?.reset();
        }),
        error: (error) => Swal.fire({
          title: "Error en la edición",
          text: error?.error?.message || "Contraseña incorrecta o ha ocurrido un error.",
          icon: 'error',
          confirmButtonText: 'Aceptar',
          background: 'linear-gradient(135deg, #F95596, #FE7079)',
          color: 'white',
          iconColor: 'white',
          confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
        })
      });
      return;
    }
    // 1. Mostrar el campo emergente para pedir la contraseña actual
    Swal.fire({
      title: 'Verifica tu identidad',
      text: 'Introduce tu contraseña actual para confirmar los cambios.',
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
      preConfirm: (password) => !password?.trim() ? Swal.showValidationMessage('La contraseña actual es obligatoria.') : password
    }).then(result => {
      // 2. Ejecutar la lógica de actualización SOLO si el usuario confirma
      if (result.isConfirmed) {
        // 3. Llamar al nuevo método del servicio que envía la contraseña actual
        this.authService.editUserWithPasswordVerification(this.editUserForm.value, result.value, this.usernameToEdit).subscribe({
          next: () => Swal.fire({
            title: "Edición correcta",
            text: "Se ha editado correctamente",
            icon: 'success',
            confirmButtonText: 'Aceptar',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          }).finally(() => {
            this.editUserForm.get('password')?.reset();
            this.editUserForm.get('confirmPassword')?.reset();
          }),
          error: (error) => Swal.fire({
            title: "Error en la edición",
            text: error?.error?.message || "Contraseña incorrecta o ha ocurrido un error.",
            icon: 'error',
            confirmButtonText: 'Aceptar',
            background: 'linear-gradient(135deg, #F95596, #FE7079)',
            color: 'white',
            iconColor: 'white',
            confirmButtonColor: 'rgba(255, 255, 255, 0.3)'
          })
        });
      }
    });

  } else {
    this.editUserForm.markAllAsTouched();
  }
}

    goBack(): void {
        history.back(); 
    }

}
