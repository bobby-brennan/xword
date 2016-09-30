import { Routes, RouterModule } from '@angular/router';
import {HomeComponent} from './components/home';
import {ShopComponent} from './components/shop';
import {DashboardComponent} from './components/dashboard';
import {NewRepoComponent} from './components/new_repo';
import {RepoComponent} from './components/repo';

export const appRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'sell', component: NewRepoComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'repo/:username/:repo', component: RepoComponent },
  { path: '**', redirectTo: 'dashboard' },
];

