import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../_services/auth.service';

@Component({
  selector: 'app-verify',
  imports: [],
  templateUrl: './verify.component.html',
  styleUrl: './verify.component.css'
})
export class VerifyComponent {
  statusMessage: string | null = null;
  isSuccess: boolean = false;
  token: string | null = null;

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (!this.token || !email) {
      this.statusMessage = 'Token o email no proporcionado';
      this.isSuccess = false;
      return;
    }

    this.confirmToken(this.token);
  }

  confirmToken(token: string) {
    this.authService.confirmAccount(token).subscribe({
      next: (res) => {
        this.statusMessage = res.message;
        this.isSuccess = true;
      },
      error: (err) => {
        this.statusMessage = err.error?.error || 'Error verificando la cuenta';
        this.isSuccess = false;
      }
    });
  }
  resendCode() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (!email) return;

    this.authService.resendVerification(email).subscribe({
      next: (res) => {
        this.statusMessage = res.message;
      },
      error: (err) => {
        this.statusMessage = err.error?.error || 'No se pudo reenviar el código';
      }
    });
  }
}
