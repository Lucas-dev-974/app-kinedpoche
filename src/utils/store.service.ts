import { createEffect, createSignal } from "solid-js";
import { createMutable } from "solid-js/store";
import { ContractEntity } from "../models/contract.entity";
import { UserEntity } from "../models/user.entity";

export const [localeUpdateEvent, setLocalUpdateEvent] = createSignal<boolean>(false)

type StoreDataType = {
  [key: string]: any;
  isLogin: boolean | undefined;
  contracts?: Partial<ContractEntity>[];
  signeBackContracts?: Partial<ContractEntity>[];
  user?: UserEntity;
};

// Exporté : la fusion login fait la même dérivation de défauts (audit TS2322)
export const EMPTY_USER: UserEntity = {
  fullname: "",
  email: "",
  orderNumber: 0,
  department: "",
  birthday: new Date(0),
  bornLocation: "",
  personalAdress: "",
  officeAdress: "",
  // On utilise les valeurs string brutes pour éviter une dépendance circulaire avec PDFTool (où les enums sont définis).
  gender: "male" as any,
  status: "professionnal" as any,
};

const STORE_KEY = "store";
const SESSION_TOKEN_KEY = "sessionToken";

// F2 (sécurité) : le JWT de session n'est PLUS persisté dans `store`
// (localStorage en clair = vol de session à la moindre XSS, survivance sur une
// machine partagée). Il vit en sessionStorage : survit au rechargement, purgé à
// la fermeture de l'onglet. Les tokens par contrat des invités, eux, restent
// dans le store persisté (ils identifient les contrats côté serveur).
function serializeStore(target: StoreDataType): string {
  return JSON.stringify({ ...target, token: undefined });
}

// Pendant un effacement, l'effet de persistance ne doit pas écrire les états
// intermédiaires (l'ancien code repersistait le store, token encore valide, à
// la première affectation de clearUserData).
let persistSilenced = false;

class StoreService {
  /**
   * Store réactif Solid (audit 🟠 "le store n'est pas réactif") : l'ancien
   * Proxy+localStorage maison ne déclenchait AUCUN re-render — les lectures
   * `proxy.user` / `proxy.contracts` dans le JSX restaient figées au montage.
   * `createMutable` garde la syntaxe d'affectation directe ET rend les lectures
   * trackées ; la persistance est câblée par effets (voir constructeur).
   */
  public mutable = createMutable<StoreDataType>({
    isLogin: undefined,
    contracts: [],
  });

  /** Alias rétro-compatibles : même objet réactif que `mutable`. */
  get data(): StoreDataType {
    return this.mutable;
  }

  get proxy(): StoreDataType {
    return this.mutable;
  }

  constructor() {
    const storeData = this.getStore();
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

    if (!storeData) {
      // Aucun store en localStorage : initialiser avec un user défini mais vide
      this.mutable.user = EMPTY_USER;
      this.mutable.isLogin = undefined;
      this.mutable.contracts = [];
    } else if (storeData.isLogin === true && !sessionToken) {
      // Store persisté sans JWT de session alors que isLogin = true : session
      // perdue (onglet fermé, navigateur relancé, machine partagée) → purger et
      // repartir déconnecté au lieu de rester "connecté" sans token.
      this.clearUserData();
    } else {
      for (const key in storeData) {
        (this.mutable as StoreDataType)[key] = (storeData as Record<string, any>)[key];
      }
      // S'assurer que user existe toujours comme clé, même après d'anciennes versions du store
      if (typeof this.mutable.user === "undefined") {
        this.mutable.user = EMPTY_USER;
      }
      this.mutable.isLogin = storeData.isLogin;

      if (sessionToken) {
        this.mutable.token = sessionToken;
      }
    }

    // Persistance : l'effet sérialise TOUT le store (=> suivi réactif de chaque
    // clé) et réécrit le JSON à tout changement réel. serializeStore exclut le
    // token de session, jamais persisté en clair.
    createEffect(() => {
      const snapshot = serializeStore(this.mutable);
      if (!persistSilenced) {
        localStorage.setItem(STORE_KEY, snapshot);
      }
    });

    // Miroir du JWT de session en sessionStorage (jamais dans le JSON persisté)
    createEffect(() => {
      const token = this.mutable.token;
      if (token) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      }
    });

    // L'event historique des consommateurs suit le contracts réactif
    // (l'ancien trap `set` le déclenchait à chaque affectation).
    createEffect(() => {
      this.mutable.contracts; // lecture trackée : l'effet re-tourne à chaque changement
      setLocalUpdateEvent(!localeUpdateEvent());
    });
  }

  getStore(): StoreDataType | null {
    const stored = localStorage.getItem(STORE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as StoreDataType;
    } catch {
      return null;
    }
  }

  setState() {
    localStorage.setItem(STORE_KEY, serializeStore(this.mutable));
  }

  /**
   * Vide toutes les données utilisateur du localStorage et réinitialise le store
   */
  clearUserData() {
    // (1) Le JWT de session quitte le disque IMMÉDIATEMENT — un crash pendant
    // la neutralisation ne laisse plus d'entrée avec token en localStorage.
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);

    // (2) Neutraliser en mémoire sans persister les états intermédiaires.
    persistSilenced = true;
    try {
      this.mutable.token = "";
      this.mutable.isLogin = false;
      this.mutable.user = EMPTY_USER;
      this.mutable.contracts = [];
    } finally {
      persistSilenced = false;
    }
    // Pas d'écriture immédiate : l'entrée `store` se recréera seule à la
    // prochaine vraie écriture (login, contrats invités…).
  }
}

export default new StoreService();
