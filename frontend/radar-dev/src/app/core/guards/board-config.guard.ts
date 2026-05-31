import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BoardConfigService } from '../services/board-config.service';
import { UserService } from '../services/user.service';

export const boardConfigGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const boardConfigService = inject(BoardConfigService);
  const router = inject(Router);

  // Se usuário ainda não se identificou, deixa o AppShell mostrar o modal
  if (!userService.hasUser()) return true;

  if (boardConfigService.hasConfig()) return true;
  return router.createUrlTree(['/settings']);
};
