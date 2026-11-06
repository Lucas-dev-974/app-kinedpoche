import { GenderEnum } from "./PDFTool";
import { ContractEntity } from "../models/contract.entity";

/**
 * Configuration centralisée des mappings entre les IDs des champs PDF
 * et les propriétés de ContractEntity
 */

// IDs des champs de DATE du AcroForm (source unique — dupliqué avant dans
// PDFTool et PDFInputsOnCanvas, audit 🟡)
export const DATE_FIELD_IDS = new Set(["96R", "102R", "122R", "123R", "131R", "138R"]);

// Dimensions A4 en points PDF + fallbacks canvas (source unique — 3 copies avant,
// audit 🟡)
export const A4_PDF_DIMENSIONS = { width: 595.2, height: 841.68 } as const;
export const A4_CANVAS_FALLBACK = { width: 598, height: 299 } as const;

export type FieldMapping = {
    contractField: keyof ContractEntity;
    pdfIds: {
        male?: string[];
        female?: string[];
        default?: string;
    };
};

export const PDF_FIELD_MAPPING: Record<string, FieldMapping> = {
    // Contract Information Fields
    startDate: {
        contractField: "startDate",
        pdfIds: { default: "122R" }
    },
    endDate: {
        contractField: "endDate",
        pdfIds: { default: "123R" }
    },
    percentReturnToSubstitute: {
        contractField: "percentReturnToSubstitute",
        pdfIds: { default: "130R" }
    },
    percentReturnToSubstituteBeforeDate: {
        contractField: "percentReturnToSubstituteBeforeDate",
        pdfIds: { default: "131R" }
    },
    nonInstallationRadius: {
        contractField: "nonInstallationRadius",
        pdfIds: { default: "134R" }
    },
    conciliationCDOMK: {
        contractField: "conciliationCDOMK",
        pdfIds: { default: "137R" }
    },
    doneAtLocation: {
        contractField: "doneAtLocation",
        pdfIds: { default: "139R" }
    },
    doneAt: {
        contractField: "doneAt",
        pdfIds: { default: "138R" }
    },

    // Replaced Fields
    replacedEmail: {
        contractField: "replacedEmail",
        pdfIds: { default: "100R" }
    },
    replacedName: {
        contractField: "replacedName",
        pdfIds: {
            male: ["94R", "117R", "125R", "119R", "121R"],
            female: ["98R", "116R", "114R", "124R", "120R"]
        }
    },
    replacedBirthday: {
        contractField: "replacedBirthday",
        pdfIds: { default: "96R" }
    },
    replacedBirthdayLocation: {
        contractField: "replacedBirthdayLocation",
        pdfIds: { default: "95R" }
    },
    replacedOrderDepartement: {
        contractField: "replacedOrderDepartement",
        pdfIds: { default: "93R" }
    },
    replacedOrderDepartmentNumber: {
        contractField: "replacedOrderDepartmentNumber",
        pdfIds: { default: "97R" }
    },
    replacedProfessionnalAddress: {
        contractField: "replacedProfessionnalAddress",
        pdfIds: { default: "104R" }
    },

    // Substitute Fields
    substituteEmail: {
        contractField: "substituteEmail",
        pdfIds: { default: "111R" }
    },
    substituteName: {
        contractField: "substituteName",
        pdfIds: {
            male: ["99R", "118R", "127R"],
            female: ["105R", "115R", "126R"]
        }
    },
    substituteBirthday: {
        contractField: "substituteBirthday",
        pdfIds: { default: "102R" }
    },
    substituteBirthdayLocation: {
        contractField: "substituteBirthdayLocation",
        pdfIds: { default: "103R" }
    },
    substituteOrderDepartement: {
        contractField: "substituteOrderDepartement",
        pdfIds: { default: "109R" }
    },
    substituteOrderDepartmentNumber: {
        contractField: "substituteOrderDepartmentNumber",
        pdfIds: { default: "108R" }
    },
    substituteAdress: {
        contractField: "substituteAdress",
        pdfIds: { default: "112R" }
    }
};

function getAllPDFIdsForMapping(mapping: FieldMapping): string[] {
  if (mapping.pdfIds.default) return [mapping.pdfIds.default];
  const ids: string[] = [];
  if (mapping.pdfIds.male) ids.push(...mapping.pdfIds.male);
  if (mapping.pdfIds.female) ids.push(...mapping.pdfIds.female);
  return ids;
}

/**
 * Mapping inverse : ID PDF → nom du champ ContractEntity
 * Permet de savoir quel champ contrat mettre à jour quand on édite depuis le canvas (par ID PDF).
 */
const PDF_ID_TO_CONTRACT_FIELD: Record<string, keyof ContractEntity> = {};
for (const [_key, config] of Object.entries(PDF_FIELD_MAPPING)) {
  getAllPDFIdsForMapping(config).forEach((id) => {
    PDF_ID_TO_CONTRACT_FIELD[id] = config.contractField;
  });
}

/**
 * Obtient le champ ContractEntity correspondant à un ID de champ PDF.
 * Utilisé quand l'édition vient du canvas (on reçoit l'ID PDF, pas le nom du champ).
 */
export function getContractFieldForPDFId(pdfId: string): keyof ContractEntity | null {
  return PDF_ID_TO_CONTRACT_FIELD[pdfId] ?? null;
}

/**
 * Obtient les IDs PDF pour un champ donné selon le genre
 * @param fieldName Le nom du champ ContractEntity
 * @param gender Le genre du contrat
 * @returns Les IDs PDF pour le champ donné
 */
export function getPDFIdsForField(fieldName: string, gender?: GenderEnum): string | string[] {
    const mapping = PDF_FIELD_MAPPING[fieldName];
    if (!mapping) return [];

    if (mapping.pdfIds.default) {
        return mapping.pdfIds.default;
    }

    if (gender && mapping.pdfIds[gender]) {
        return mapping.pdfIds[gender]!;
    }

    // Si pas de genre spécifié, retourner tous les IDs possibles
    const allIds: string[] = [];
    if (mapping.pdfIds.male) allIds.push(...mapping.pdfIds.male);
    if (mapping.pdfIds.female) allIds.push(...mapping.pdfIds.female);
    return allIds;
}

