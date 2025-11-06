import { Routes } from '@angular/router';
import { PlayerComponent } from './player/player.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tracker',
    pathMatch: 'full',
  },
  {
    path: 'tracker',
    loadComponent: () =>
      import('./tracker/tracker.component').then(m => m.TrackerComponent),
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
  },
  {
    path: 'cutoffs',
    loadComponent: () =>
      import('./cutoffs/cutoffs.component').then(m => m.CutoffsComponent),
  },
  {
    path: 'activity',
    loadComponent: () =>
      import('./activity/activity.component').then(m => m.ActivityComponent),
  },
  {
    path: 'archives',
    loadComponent: () =>
      import('./archives/archives.component').then(m => m.ArchivesComponent),
  },
  {
    path: 'bis-gear',
    loadComponent: () =>
      import('./bis-gear/bis-gear.component').then(m => m.BisGearComponent),
  },
  {
    path: 'bis-players',
    loadComponent: () =>
      import('./bis-players/bis-players.component').then(m => m.BisPlayersComponent),
  },
  { path: 'character/:region/:realm/:name', component: PlayerComponent },
  { path: 'player/:region/:realm/:name', component: PlayerComponent },
  { path: '**', redirectTo: 'tracker' },
];

