(window as any).global = window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
// Supports weights 100-900
//import '@fontsource-variable/inter';
import './styles/fonts.css';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));