import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/trackerComponent', pathMatch: 'full' },

  {
    path: 'cutoffs',
    loadComponent: () =>
      import('./cutoffs/cutoffs.component').then((m) => m.CutoffsComponent),
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
  },
  {
    path: 'activity',
    loadComponent: () =>
      import('./activity/activity.component').then((m) => m.ActivityComponent),
  },
  {
    path: 'archives',
    loadComponent: () =>
      import('./archives/archives.component').then((m) => m.ArchivesComponent),
  },
  {
    path: 'bis-gear',
    loadComponent: () =>
      import('./bis-gear/bis-gear.component').then((m) => m.BisGearComponent),
  },
  {
    path: 'bis-players',
    loadComponent: () =>
      import('./bis-players/bis-players.component').then((m) => m.BisPlayersComponent),
  },
];