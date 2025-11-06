import { bootstrapApplication } from '@angular/platform-browser';
import { ApplicationRef, PlatformRef } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()],
})
  .then((appRef: ApplicationRef) => {
    // You can access DI here
    const injector = appRef.injector;

    // If you needed the platform ref (rough equivalent to what you expected on BootstrapContext):
    const platformRef = injector.get(PlatformRef);

    // do any post-bootstrap init here
    console.log('Bootstrapped. appRef:', appRef, 'platformRef:', platformRef);
  })
  .catch(err => console.error(err));
