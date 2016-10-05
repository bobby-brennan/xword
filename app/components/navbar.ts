import {Component} from '@angular/core';
declare let window: any;

@Component({
    selector: 'navbar',
    template: `
<nav class="navbar navbar-default">
  <div class="container-fluid">
    <div class="navbar-header">
      <a class="navbar-brand" href="#">XWord</a>
    </div>
  </div>
</nav>
      `,
})
export class NavbarComponent {
  constructor() {
  }
}
