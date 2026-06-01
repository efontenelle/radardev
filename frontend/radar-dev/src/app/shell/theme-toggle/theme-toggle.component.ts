import { Component, inject } from '@angular/core';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss'
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);

  readonly modes: { value: ThemeMode; label: string }[] = [
    { value: 'light',  label: 'Claro'  },
    { value: 'dark',   label: 'Escuro' },
    { value: 'system', label: 'Sistema' },
  ];

  set(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }
}
