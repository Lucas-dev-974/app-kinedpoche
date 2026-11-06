import { createSignal } from "solid-js";
import storeService from "./utils/store.service";
import { ContractEntity } from "./models/contract.entity";

// Audit 🟠 (double source de vérité) : `loggedIn` est désormais DÉRIVÉ du store
// réactif (proxy.isLogin) — plus de signal parallèle à désynchroniser après
// login/logout. setLoggedIn écrit directement le store.
export const loggedIn = (): boolean => (storeService.proxy.isLogin ?? false);

export function setLoggedIn(isLogin: boolean) {
  storeService.proxy.isLogin = isLogin;
}
export const [loadContract, setLoadContrat] = createSignal<Partial<ContractEntity>>();
// Flux "signe-back" (?signe-back=<token>) — vivait dans pages/PageWrapper ; déplacé
// ici pour éviter l'import circulaire PageWrapper → DialogWrapper → PageWrapper.
export const [signeBack, setSigneBack] = createSignal<boolean>(false);
