import {Component, ApplicationRef} from '@angular/core';
import {GitHubService} from '../services/github';
import {GitWayService} from '../services/gitway';
declare let $: any;
declare let window: any;

@Component({
    selector: 'gitway',
    template: `
      <navbar></navbar>
      <div class="container">
        <router-outlet></router-outlet>
      </div>
      <footer></footer>
      `,
})
export class AppComponent {
  title: 'GitWay';
  ticker: string;

  constructor(private gitway: GitWayService,
              private github: GitHubService,
              private appref: ApplicationRef) {
    window.app = this;
    this.github.checkAuth();
  }
}
