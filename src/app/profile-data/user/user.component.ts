import { NgClass, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AbstractControl, Form, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../../_services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user',
  imports: [ReactiveFormsModule, NgIf, NgClass],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent {
//AÚN SIN IMPLEMENTAR
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);


  editUserForm: FormGroup = this.fb.group({
  name: ['', Validators.required],
  surname: ['', Validators.required], 
  username: ['', [Validators.required],[this.authService.userTakenValidator()]],
  birthDate: ['', Validators.required],
  address: ['', Validators.required],
  email: ['', [Validators.required, Validators.email],[this.authService.emailTakenValidator()]],
  password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[*?¿!]).+$/)
    ]],
  confirmPassword: ['', Validators.required],
  gender: ['femenino', Validators.required]
})

onSubmit() {}

}
