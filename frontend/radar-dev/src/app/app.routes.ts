import { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { BoardSettingsComponent } from './features/board-settings/board-settings.component';
import { userIdentificationGuard } from './core/guards/user-identification.guard';
import { boardConfigGuard } from './core/guards/board-config.guard';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [userIdentificationGuard],
    children: [
      { path: '', component: DashboardComponent, canActivate: [boardConfigGuard] },
      { path: 'settings', component: BoardSettingsComponent }
    ]
  }
];
