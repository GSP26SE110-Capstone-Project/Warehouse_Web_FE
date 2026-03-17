import type { NavigateFunction } from 'react-router-dom';

class NavigationService {
  private navigate: NavigateFunction | null = null;

  setNavigate(navigate: NavigateFunction) {
    this.navigate = navigate;
  }

  goTo(path: string, options?: { replace?: boolean; state?: any }) {
    if (this.navigate) {
      this.navigate(path, options);
    } else {
      // Fallback to window.location if navigate is not available
      window.location.href = path;
    }
  }

  goBack() {
    if (this.navigate) {
      this.navigate(-1);
    } else {
      window.history.back();
    }
  }

  replace(path: string, state?: any) {
    this.goTo(path, { replace: true, state });
  }
}

export const navigationService = new NavigationService();