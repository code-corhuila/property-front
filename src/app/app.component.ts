import { Component } from '@angular/core';
import { ShellLayoutComponent } from './layout/shell-layout.component';

@Component({
  selector: 'app-root',
  imports: [ShellLayoutComponent],
  template: '<app-shell-layout />',
})
export class AppComponent {}
