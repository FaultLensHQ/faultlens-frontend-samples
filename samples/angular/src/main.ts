import { bootstrapApplication } from '@angular/platform-browser';
import { AngularSample } from './app/angular-sample';

bootstrapApplication(AngularSample)
  .catch((err) => console.error(err));
