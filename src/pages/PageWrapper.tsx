import { children, onMount, onCleanup, JSXElement } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Navbar } from "../components/navbar/Navbar";
import { Notification } from "../components/notification/Notification";
import { FloatingMenu } from "../components/FloattingMenu/floating-menu/FloatingMenu";
import { setNavigateFunction } from "../services/auth.service";
import { contractService } from "../services/contract.service";

import { setLoadContrat, setSigneBack } from "../const.data";
import { ContractEntity } from "../models/contract.entity";
import { DIALOG_NAMES, openDialogTool } from "../components/dialog/DialogWrapper";
import storeService from "../utils/store.service";

interface PageWrapperProps {
    children: JSXElement;
}

export function PageWrapper(props: PageWrapperProps) {

    const childs = children(() => props.children);
    const navigate = useNavigate();

    onMount(async () => {
        setNavigateFunction(navigate);

        // L'utilisateur peut naviguer (démontage) : ne pas garder un navigateFn
        // global pointant vers un composant mort (audit 🟡)
        onCleanup(() => setNavigateFunction(null));

        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get("signe-back");

        if (token) {
            try {
                const contract = await contractService.getContractByToken(token);
                if (contract) {
                    setLoadContrat(contract as Partial<ContractEntity>);
                    setSigneBack(true);
                    openDialogTool(DIALOG_NAMES.editContract);

                    // Fusionner par id au lieu d'écraser tous les contrats locaux
                    // (audit 🟠 PageWrapper) — l'ancien `contracts = [contract]`
                    // supprimait le store local du kiné.
                    const existing = (storeService.proxy.contracts ?? []) as Partial<ContractEntity>[];
                    const merged = existing.some((c) => c.id == contract.id)
                        ? existing.map((c) => (c.id == contract.id ? contract : c))
                        : [...existing, contract];
                    storeService.proxy.contracts = merged;
                }
            } catch {
                // Erreur déjà notifiée par le fetcher (401/Réseau) — pas d'unhandled rejection
            }
        }
    });

    return (
        <div class="font-[Nunito]">
            <Navbar />
            <FloatingMenu />
            <Notification />
            <div class="md:px-20 lg:w-2/4 mx-auto px-4 ">
                {childs()}
            </div>
        </div>
    );
}
