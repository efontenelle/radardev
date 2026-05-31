import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BoardConfigService } from '../services/board-config.service';

export const boardConfigGuard: CanActivateFn = () => {
  const boardConfigService = inject(BoardConfigService);
  const router = inject(Router);

  if (boardConfigService.hasConfig()) return true;
  return router.createUrlTree(['/settings']);
};
