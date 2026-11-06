import { createSignal } from "solid-js";
import storeService from "./utils/store.service";
import { ContractEntity } from "./models/contract.entity";

export const [loggedIn, setLoggedIn] = createSignal<boolean>(storeService.proxy.isLogin ?? false);
export const [loadContract, setLoadContrat] = createSignal<Partial<ContractEntity>>();
// Flux "signe-back" (?signe-back=<token>) — vivait dans pages/PageWrapper ; déplacé
// ici pour éviter l'import circulaire PageWrapper → DialogWrapper → PageWrapper.
export const [signeBack, setSigneBack] = createSignal<boolean>(false);
