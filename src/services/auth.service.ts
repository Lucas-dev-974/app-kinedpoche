import { setLoggedIn } from "../const.data";
import { UserEntity } from "../models/user.entity";
import storeService, { EMPTY_USER } from "../utils/store.service";
import { FetcherService } from "./fetch.service";
import { NotificationService } from "../utils/notification.service";

// Type pour la réponse d'authentification
interface AuthResponse {
  token: string;
  user: Partial<UserEntity>;
}

// Utilitaire pour la navigation (évite les dépendances circulaires)
let navigateFn: ((path: string) => void) | null = null;

export function setNavigateFunction(navigate: ((path: string) => void) | null) {
  navigateFn = navigate;
}

class AuthService {
  private setData(response: AuthResponse) {
    // Partial<UserEntity> fusionné sur les valeurs par défaut : le store attend
    // un UserEntity complet (TS2322 — les champs absents prennent l'EMPTY_USER)
    storeService.proxy.token = response.token;
    storeService.proxy.user = { ...EMPTY_USER, ...response.user };
    this.setGlobalIsLogin(true);
  }

  public setGlobalIsLogin(isLogin: boolean) {
    storeService.proxy.isLogin = isLogin;
    setLoggedIn(isLogin);
  }

  public logout() {
    // Vider toutes les données utilisateur du localStorage
    storeService.clearUserData();
    this.setGlobalIsLogin(false);
    // Rediriger vers la page d'accueil
    if (navigateFn) {
      navigateFn("/");
    } else {
      location.href = "/";
    }
  }

  async register(user: Partial<UserEntity>) {
    const response = await FetcherService.patch("/auth/", user) as AuthResponse;
    this.setData(response);
    if (navigateFn) {
      navigateFn("/");
    } else {
      location.href = "/";
    }
    return response;
  }

  async login(user: Pick<UserEntity, "email" | "password">) {
    const response = await FetcherService.post("/auth/", user) as AuthResponse;
    // Nettoyer les notifications d'erreur lors d'une connexion réussie
    NotificationService.clearErrors();
    this.setData(response);
    if (navigateFn) {
      navigateFn("/");
    } else {
      location.href = "/";
    }
    return response;
  }
}

export const authService = new AuthService();
