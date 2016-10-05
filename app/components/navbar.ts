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
    <ul class="nav navbar-nav navbar-right">
      <li><a href="https://github.com/bobby-brennan/xword" target="_blank">View on GitHub</a></li>
    </ul>
  </div>
</nav>
      `,
})
export class NavbarComponent {
  constructor() {
  }
}
