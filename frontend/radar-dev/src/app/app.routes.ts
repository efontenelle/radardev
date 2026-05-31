import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BoardSettingsComponent } from './features/board-settings/board-settings.component';
import { boardConfigGuard } from './core/guards/board-config.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', component: DashboardComponent, canActivate: [boardConfigGuard] },
      { path: 'settings', component: BoardSettingsComponent }
    ]
  }
];
