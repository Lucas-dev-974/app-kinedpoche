import { createSignal } from "solid-js";
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

const EMPTY_USER: UserEntity = {
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

// Pendant un effacement, le trap `set` ne doit plus réécrire le localStorage
// (l'ancien code repersistait le store, token encore valide, à la première
// affectation de clearUserData).
let persistSilenced = false;

class StoreService {
  public data: StoreDataType = {
    isLogin: undefined,
    contracts: []
  };

  public proxy = new Proxy(this.data, {
    get(target, property, receiver) {
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      const oldValue = Reflect.get(target, property, receiver);
      const toReturn = Reflect.set(target, property, value, receiver);

      if (property === "contracts") {
        setLocalUpdateEvent(!localeUpdateEvent())
      }

      // Miroir du JWT de session en sessionStorage (jamais dans le store sérialisé)
      if (property === "token" && value) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, String(value));
      }

      // Ne rien persister pendant un effacement, ni pour une écriture sans
      // changement (l'isLogin=false du logout ne recrée plus l'entrée `store`
      // juste après le removeItem).
      if (!persistSilenced && oldValue !== value) {
        localStorage.setItem(STORE_KEY, serializeStore(target));
      }
      return toReturn;
    },
  });

  constructor() {
    const storeData = this.getStore();
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);

    if (!storeData) {
      // Aucun store en localStorage : initialiser avec un user défini mais vide
      this.proxy.user = EMPTY_USER;
      this.proxy.isLogin = undefined;
      this.proxy.contracts = [];
      this.setState();
      return;
    }

    // Store persisté sans JWT de session alors que isLogin = true : session
    // perdue (onglet fermé, navigateur relancé, machine partagée) → purger et
    // repartir déconnecté au lieu de rester "connecté" sans token.
    if (storeData.isLogin === true && !sessionToken) {
      this.clearUserData();
      return;
    }

    for (const key in storeData) {
      this.proxy[key] = storeData[key];
    }
    // S'assurer que user existe toujours comme clé, même après d’anciennes versions du store
    if (typeof this.proxy.user === "undefined") {
      this.proxy.user = EMPTY_USER;
    }
    this.proxy.isLogin = storeData.isLogin;

    if (sessionToken) {
      this.proxy.token = sessionToken;
    }
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
    localStorage.setItem(STORE_KEY, serializeStore(this.data));
  }

  /**
   * Vide toutes les données utilisateur du localStorage et réinitialise le store
   */
  clearUserData() {
    // F2 : neutraliser SANS re-persister à chaque affectation — les mutations
    // passent par le proxy ; rien n'est sérialisé tant que `persistSilenced`.
    persistSilenced = true;
    try {
      this.proxy.isLogin = false;
      this.proxy.token = "";
      this.proxy.user = EMPTY_USER;
      this.proxy.contracts = [];
    } finally {
      persistSilenced = false;
    }

    // L'entrée store est retirée APRÈS neutralisation ; les écritures sans
    // changement qui suivent (setGlobalIsLogin(false) dans logout) ne la
    // recréent pas.
    localStorage.removeItem(STORE_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  }
}

export default new StoreService();
