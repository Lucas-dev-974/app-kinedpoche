import { Accessor, createSignal } from "solid-js";
import { ContractEntity } from "../../models/contract.entity";
import { contractService } from "../../services/contract.service";
import { loggedIn } from "../../const.data";

export function useContractSearch(contracts: Accessor<ContractEntity[]>) {
    const [searchQuery, setSearchQuery] = createSignal<string>("");
    const [filteredContracts, setFilteredContracts] = createSignal<ContractEntity[]>(contracts());

    // Compteur monotone : seule la dernière requête émise peut écrire le résultat
    // (la plus lente des anciennes requêtes n'écrase plus la plus récente).
    let searchSequence = 0;

    const filterLocal = (query: string): ContractEntity[] => {
        const lowerQuery = query.toLowerCase();
        return contracts().filter((contract) => {
            const replacedName = contract.replacedName?.toLowerCase() || "";
            const substituteName = contract.substituteName?.toLowerCase() || "";
            const replacedEmail = contract.replacedEmail?.toLowerCase() || "";
            const substituteEmail = contract.substituteEmail?.toLowerCase() || "";

            return (
                replacedName.includes(lowerQuery) ||
                substituteName.includes(lowerQuery) ||
                replacedEmail.includes(lowerQuery) ||
                substituteEmail.includes(lowerQuery)
            );
        });
    };

    const performSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setFilteredContracts(contracts());
            return;
        }

        const sequence = ++searchSequence;

        if (loggedIn()) {
            try {
                // Recherche via API
                const results = await contractService.search(query);
                if (sequence !== searchSequence) return; // réponse périmée
                setFilteredContracts(results);
            } catch {
                // Erreur déjà notifiée par le fetcher : fallback sur la recherche locale
                if (sequence !== searchSequence) return;
                setFilteredContracts(filterLocal(query));
            }
        } else {
            // Recherche locale
            setFilteredContracts(filterLocal(query));
        }
    };

    return {
        searchQuery,
        filteredContracts,
        performSearch,
        setFilteredContracts,
    };
}
