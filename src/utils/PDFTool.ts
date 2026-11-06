import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

import { formatDate } from "../components/ContractDialog/DropdownContratInformations/ContractInformationsFields";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { ContractEntity } from "../models/contract.entity";
import { Accessor, createSignal } from "solid-js";
import { loadContract } from "../const.data";
import { getPDFIdsForField, getContractFieldForPDFId } from "./pdf-field-mapping.config";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc as unknown as string;

export const [toSendBlob, setToSendBlob] = createSignal<Blob | undefined>()

export enum GenderEnum {
  male = "male",
  female = "female",
}

export enum AuthorsEnum {
  student = "student",
  professional = "professionnal",
}

export type OtherContractDataType = {
  replacedGender: GenderEnum;
  substituteGender: GenderEnum;

  authorName: string;
  authorEmail: string;
  authorStatus: AuthorsEnum;
};

export type PDFFields = {
  id: string;
  type: string;
  name: string;
  value: string;
  rect: number[];
  width: number;
  height: number;
  top: number;
  left: number;
}

export type PDFFieldsOfPages = {
  page: number;
  fields: PDFFields[]
}

export class PDFTool {
  private static instance: PDFTool | undefined;

  canvasID: string = "pdf-canvas";
  pdfDoc: pdfjsLib.PDFDocumentProxy | undefined;
  pdfBlob: Blob | undefined;
  url: string | undefined;
  isRendering: boolean = false;


  public pdfFile: File | undefined;
  public numPages: number | undefined;
  public currentPage: number = 1;

  public PDFInputsFieldsMetadata: PDFFieldsOfPages[];
  public contractData: Partial<ContractEntity>;

  private constructor(url: string, canvasID: string) {
    this.PDFInputsFieldsMetadata = []
    this.contractData = {}; // Pour compatibilité avec le code existant
    this.canvasID = canvasID;
    this.url = url;
  }

  /**
   * Obtient l'instance unique du singleton PDFTool.
   * Si l'instance n'existe pas, elle est créée avec les paramètres fournis.
   * Si l'instance existe déjà mais avec des paramètres différents, elle est réinitialisée.
   *
   * @param url URL du fichier PDF
   * @param canvasID ID du canvas HTML
   * @returns L'instance unique de PDFTool
   */
  public static getInstance(url: string, canvasID: string = "pdf-canvas"): PDFTool {
    if (!PDFTool.instance) {
      PDFTool.instance = new PDFTool(url, canvasID);
    }
    // Réinitialiser le contenu de l'instance à CHAQUE accès, même si url/canvasID
    // sont identiques : les données du contrat précédent (noms, emails, dates,
    // data-URL de signatures) ne doivent jamais survivre à une réouverture.
    // PDFEditor.initialize() repeuple PDFInputsFieldsMetadata/contractData juste après.
    PDFTool.instance.url = url;
    PDFTool.instance.canvasID = canvasID;
    PDFTool.instance.PDFInputsFieldsMetadata = [];
    PDFTool.instance.contractData = {};
    PDFTool.instance.pdfDoc = undefined;
    PDFTool.instance.pdfBlob = undefined;
    PDFTool.instance.pdfFile = undefined;
    PDFTool.instance.numPages = undefined;
    PDFTool.instance.currentPage = 1;
    PDFTool.instance.isRendering = false;
    return PDFTool.instance;
  }

  /**
   * Vérifie si une instance du singleton existe
   * @returns true si une instance existe, false sinon
   */
  public static hasInstance(): boolean {
    return PDFTool.instance !== undefined;
  }

  /**
   * Réinitialise l'instance du singleton (utile pour les tests ou le nettoyage)
   */
  public static resetInstance(): void {
    PDFTool.instance = undefined;
  }

  async initialize() {
    await this.loadPdf();

    if (loadContract()) {
      this.setContractDataToPDFInputsFields(loadContract() as ContractEntity);
    } else {
      this.updateField("replacedGender", GenderEnum.male);
      this.updateField("substituteGender", GenderEnum.male);
    }
  }

  setContractData(contract: Partial<ContractEntity>) {
    this.contractData = contract;
  }

  updateField(fieldName: keyof ContractEntity, value: any) {
    this.contractData[fieldName] = value;
  }

  /**
   * Récupère les données du contrat à jour depuis le store réactif
   * @returns Une copie des données du contrat synchronisées avec le store
   */
  getContractData(): Partial<ContractEntity> {
    // Synchroniser contractData avec le store avant de retourner
    return this.contractData;
  }

  /**
   * Met à jour les champs du PDF avec les données du contrat
   * @param contract Les données du contrat à mettre à jour
   */
  public setContractDataToPDFInputsFields(contract: Partial<ContractEntity>) {
    Object.keys(contract).forEach((key) => {
      const fieldName = key as keyof ContractEntity;
      const value = contract[fieldName];
      if (value !== undefined) {
        this.updateContractDataAndPDFFields(fieldName, value);
      }
    });
  }

  async loadPdf() {
    const response = await fetch(this.url!);
    if (!response.ok) throw new Error("Erreur de chargement du PDF");

    const arrayBuffer = await response.arrayBuffer();
    const pdfUint8Array = new Uint8Array(arrayBuffer);

    this.pdfBlob = new Blob([pdfUint8Array], { type: "application/pdf" });
    this.pdfFile = new File([this.pdfBlob], "document.pdf", { type: "application/pdf" });

    this.pdfDoc = await pdfjsLib.getDocument(pdfUint8Array).promise;
    this.numPages = this.pdfDoc.numPages;

    await this.getPagesFields();
  }

  async getPagesFields() {
    this.PDFInputsFieldsMetadata = [];
    if (!this.pdfDoc) throw new Error("PDF not loaded");

    const pages = this.pdfDoc!.numPages;
    const formFields = [];

    for (let i = 0; i != pages; i++) {
      const page = await this.pdfDoc!.getPage(i + 1);
      const dimensions = await this.getDimensions(this.pdfDoc, "pdf-canvas");
      const annotations = await page.getAnnotations();

      if (dimensions) {
        const { pdfWidth, pdfHeight, canvasDisplayWidth } = dimensions;
        const scale = canvasDisplayWidth / pdfWidth;
        const viewport = page.getViewport({ scale });


        const fields = annotations
          .filter((annotation) => annotation.subtype === "Widget")
          .map((annotation) => ({
            id: annotation.id as string,
            type: annotation.fieldType as string,
            name: annotation.fieldName as string,
            value: annotation.fieldValue || ("" as string),
            rect: annotation.rect,
            width: ((annotation.rect[2] - annotation.rect[0]) * scale) as number,
            height: ((annotation.rect[3] - annotation.rect[1]) * scale) as number,
            top: (viewport.height - annotation.rect[3] * scale) as number,
            left: (annotation.rect[0] * scale) as number,
          }));

        formFields.push({ page: i + 1, fields: fields });
      }
    }

    this.PDFInputsFieldsMetadata = [...this.PDFInputsFieldsMetadata, ...formFields];
  }

  /**
   * Récupère les dimensions du PDF
   * @param pdfDoc Le document PDF
   * @param canvasId L'ID du canvas HTML
   * @returns Les dimensions du PDF
   */
  async getDimensions(pdfDoc: any, canvasId: any) {
    // Récupère la première page du PDF pour obtenir la taille d'origine
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1 }); // Pas d'échelle pour obtenir la taille réelle

    const pdfWidth = viewport.width;
    const pdfHeight = viewport.height;

    // Récupère les dimensions du canvas en affichage (style CSS appliqué)
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const canvasDisplayWidth = canvas!.clientWidth;
      const canvasDisplayHeight = canvas!.clientHeight;
      const data = {
        pdfWidth,
        pdfHeight,
        canvasDisplayWidth,
        canvasDisplayHeight,
      }

      return data
    }
    return {
      canvasDisplayHeight: 299,
      canvasDisplayWidth: 598,
      pdfHeight: 841.68,
      pdfWidth: 595.2,
    }
  }

  /**
   * Rend la page numéro pageNum dans le canvasElement
   * @param pageNum Le numéro de la page à rendre
   * @param canvasElement Le canvas HTML dans lequel rendre la page
   */
  async renderPage(canvasElement: HTMLCanvasElement) {
    if (this.isRendering) return;
    this.isRendering = true;

    const page = await this.pdfDoc!.getPage(this.currentPage);
    const context = canvasElement!.getContext("2d");
    const dimensions = await this.getDimensions(this.pdfDoc, "pdf-canvas");


    if (dimensions) {
      const { pdfWidth, pdfHeight, canvasDisplayWidth } = dimensions;
      const scale = (canvasDisplayWidth / pdfWidth) * 2;

      const viewport = page.getViewport({ scale });
      if (canvasElement) {
        canvasElement.height = viewport.height;
        canvasElement.width = viewport.width;
      }

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext as RenderParameters).promise;
      this.isRendering = false;
    }
  }

  /**
   * Met à jour les valeurs des champs PDF correspondants dans le contractData
   * @param contractField Le nom du champ contractField à mettre à jour
   * @param newValue La nouvelle valeur à mettre à jour
   * @param gender Le genre du contrat
   */
  updateContractDataAndPDFFields(contractField: string, newValue: any, gender: GenderEnum = GenderEnum.male) {
    // Quand l'édition vient du canvas, on reçoit l'ID PDF (ex: "94R") au lieu du nom du champ.
    // Résoudre le vrai contractField et utiliser le genre du contrat pour n'actualiser que les champs du bon genre (Madame OU Monsieur, pas les deux).
    const resolvedContractField = getContractFieldForPDFId(contractField) ?? (contractField as keyof ContractEntity);
    const resolvedGender: GenderEnum =
      resolvedContractField === "replacedName"
        ? (this.contractData.replacedGender ?? GenderEnum.male)
        : resolvedContractField === "substituteName"
          ? (this.contractData.substituteGender ?? GenderEnum.male)
          : gender;

    const updateFieldOnGenderChange = (cleanNameFields: string[], copyNameFields: string[], contractField: keyof ContractEntity) => {
      this.PDFInputsFieldsMetadata = this.PDFInputsFieldsMetadata.map((page) => ({
        ...page,
        fields: page.fields.map((field) => {
          if (cleanNameFields.includes(field.id)) {
            return { ...field, value: "" }
          } else if (copyNameFields.includes(field.id)) {
            return { ...field, value: this.contractData[contractField] as string }
          }

          return { ...field }
        }),
      }));

      return
    }

    // * when update replacedGender or substituteGender, we need to update field name for replaced and substitute name in PDFInputsFieldsMetadata
    if (resolvedContractField === "replacedGender") {
      const previousGender = this.contractData.replacedGender ?? GenderEnum.male;
      const nextGender = (newValue as GenderEnum) ?? previousGender;

      if (nextGender !== previousGender) {
        const cleanNameFields = getPDFIdsForField("replacedName", previousGender);
        const copyNameFields = getPDFIdsForField("replacedName", nextGender);

        updateFieldOnGenderChange(cleanNameFields as string[], copyNameFields as string[], "replacedName");
      }

      this.updateField("replacedGender", nextGender);
      return
    } else if (resolvedContractField === "substituteGender") {
      const previousGender = this.contractData.substituteGender ?? GenderEnum.male;
      const nextGender = (newValue as GenderEnum) ?? previousGender;

      if (nextGender !== previousGender) {
        const cleanNameFields = getPDFIdsForField("substituteName", previousGender);
        const copyNameFields = getPDFIdsForField("substituteName", nextGender);

        updateFieldOnGenderChange(cleanNameFields as string[], copyNameFields as string[], "substituteName");
      }

      this.updateField("substituteGender", nextGender);
      return
    } else {
      // Récupère les IDs des champs PDF correspondant au champ contractField et au genre (un seul genre pour éviter de remplir Madame et Monsieur avec la même donnée)
      const pdfIds = getPDFIdsForField(resolvedContractField, resolvedGender);
      const pdfIdsArray = Array.isArray(pdfIds) ? pdfIds : [pdfIds];

      // Met à jour les valeurs des champs PDF correspondants
      this.PDFInputsFieldsMetadata = this.PDFInputsFieldsMetadata.map((page) => ({
        ...page,
        fields: page.fields.map((field) =>
          pdfIdsArray.includes(field.id) ? { ...field, value: String(newValue ?? "") } : field
        ),
      }));

      // Met à jour la valeur du champ contractField dans le contractData
      this.updateField(resolvedContractField, newValue);
    }
  }


  resetContractData() {
    this.contractData = {
      id: "",
      conciliationCDOMK: "",
      doneAt: "",
      doneAtLocation: "",
      endDate: "",
      nonInstallationRadius: 0,
      percentReturnToSubstitute: 0,
      percentReturnToSubstituteBeforeDate: "",
      replacedBirthday: "",
      replacedBirthdayLocation: "",
      replacedEmail: "",
      replacedGender: GenderEnum.male,
      replacedName: "",
      replacedOrderDepartement: "",
      replacedOrderDepartmentNumber: 0,
      replacedProfessionnalAddress: "",
      replacedSignatureDataUrl: "",
      startDate: "",
      substituteAdress: "",
      substituteBirthday: "",
      substituteBirthdayLocation: "",
      substituteEmail: "",
      substituteGender: GenderEnum.male,
      substituteName: "",
      substituteOrderDepartement: "",
      substituteOrderDepartmentNumber: 0
    };
  }

  /**
   * Met à jour les signatures dans le contractData
   * @param signatures Les signatures à mettre à jour
   */
  updateSignaturesInContract(signatures: Accessor<{ replaced?: string; substitute?: string } | undefined>) {
    const signatureData = signatures();

    if (signatureData?.replaced) {
      this.updateField("replacedSignatureDataUrl", signatureData.replaced);
    }

    if (signatureData?.substitute) {
      this.updateField("substituteSignatureDataUrl", signatureData.substitute);
    }
  }

  /**
   * Télécharge le PDF modifié avec les signatures stockées dans contractData
   * @param pdfFile Le fichier PDF à télécharger
   * @param download True si le PDF doit être téléchargé, false sinon
   */
  async downloadModifiedPdfWithStoredSignatures(pdfFile: File, download: boolean = true): Promise<void> {
    // F4 : le vrai travail vit dans reader.onload — l'ancienne version laissait
    // le `await` de l'appelant se résoudre avant la fin réelle (et chaque erreur
    // intérieure devenait une unhandled rejection : isLoading figé à true,
    // bouton gelé, aucune notification).
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        this.setFormAndSignaturesIntoPdf(reader.result as ArrayBufferLike, download).then(resolve, reject);
      };

      reader.onerror = () => reject(reader.error ?? new Error("Lecture du fichier PDF impossible"));
      reader.readAsArrayBuffer(pdfFile);
    });
  }

  /** Insère signatures + valeurs de champs dans le PDF et produit le blob final */
  private async setFormAndSignaturesIntoPdf(pdfData: ArrayBufferLike, download: boolean) {
      const pdfUint8Array = new Uint8Array(pdfData);
      const pdfDoc_ = await PDFDocument.load(pdfUint8Array);

      // Récupérer la dernière page du PDF
      const lastPageIndex = pdfDoc_.getPageCount() - 1;
      const page = pdfDoc_.getPage(lastPageIndex);

      // Utiliser les signatures stockées dans contractData
      const replacedSignatureUrl = this.contractData.replacedSignatureDataUrl;
      const substituteSignatureUrl = this.contractData.substituteSignatureDataUrl;

      // Vérifier si les signatures sont valides (commencent par "data:image")
      const isReplacedValid = replacedSignatureUrl && replacedSignatureUrl.startsWith("data:image");
      const isSubstituteValid = substituteSignatureUrl && substituteSignatureUrl.startsWith("data:image");



      const { width, height } = page.getSize();

      if (isReplacedValid) {
        try {
          const canvas1ImageBytes = await fetch(replacedSignatureUrl).then((res) => res.arrayBuffer());

          // Détecter le format de l'image et utiliser la méthode appropriée
          let canvas1ImageEmbed;
          if (replacedSignatureUrl.includes('data:image/png')) {
            canvas1ImageEmbed = await pdfDoc_.embedPng(canvas1ImageBytes);
          } else if (replacedSignatureUrl.includes('data:image/jpeg') || replacedSignatureUrl.includes('data:image/jpg')) {
            canvas1ImageEmbed = await pdfDoc_.embedJpg(canvas1ImageBytes);
          } else {
            // Par défaut, essayer PNG
            canvas1ImageEmbed = await pdfDoc_.embedPng(canvas1ImageBytes);
          }

          // Dessiner les images sur la page avec des positions ajustées
          page.drawImage(canvas1ImageEmbed, {
            x: width * 0.05, // 5% du côté gauche
            y: height * 0.10, // 5% du bas (plus haut que 0.15)
            width: width * 0.35, // 35% de la largeur de la page
            height: height * 0.15, // 15% de la hauteur de la page
          });
        } catch (error) {
          console.error('Erreur lors de l\'embedding de la signature remplacée:', error);
        }
      }

      if (isSubstituteValid) {
        try {
          const canvas2ImageBytes = await fetch(substituteSignatureUrl).then((res) => res.arrayBuffer());

          // Détecter le format de l'image et utiliser la méthode appropriée
          let canvas2ImageEmbed;
          if (substituteSignatureUrl.includes('data:image/png')) {
            canvas2ImageEmbed = await pdfDoc_.embedPng(canvas2ImageBytes);
          } else if (substituteSignatureUrl.includes('data:image/jpeg') || substituteSignatureUrl.includes('data:image/jpg')) {
            canvas2ImageEmbed = await pdfDoc_.embedJpg(canvas2ImageBytes);
          } else {
            // Par défaut, essayer PNG
            canvas2ImageEmbed = await pdfDoc_.embedPng(canvas2ImageBytes);
          }

          page.drawImage(canvas2ImageEmbed, {
            x: width * 0.6, // 60% du côté gauche
            y: height * 0.10, // 5% du bas (plus haut que 0.15)
            width: width * 0.35, // 35% de la largeur de la page
            height: height * 0.15, // 15% de la hauteur de la page
          });
        } catch (error) {
          console.error('Erreur lors de l\'embedding de la signature substitut:', error);
        }
      }

      // Mettre à jour les champs de formulaire
      const form = pdfDoc_.getForm();

      // Champs de date (IDs PDF) : ne pas appliquer le formatage aux autres champs
      // (sinon certains nombres comme le numéro d'ordre peuvent être interprétés comme des dates).
      const dateFieldIds = new Set(["96R", "102R", "122R", "123R", "131R", "138R"]);

      const formatDate_ = (value: string) => {
        try {
          const formatedDate = formatDate(value)
          return formatedDate == "Invalid Date" ? value : formatedDate
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("Erreur de formatage de date:", error);
          }
          return value
        }
      }

      for (const page of this.PDFInputsFieldsMetadata) {
        for (const field of page.fields) {
          const pdfField = form.getTextField(field.name)
          if (pdfField) {
            const rawValue = String(field.value ?? "");
            const valueToWrite = dateFieldIds.has(field.id) ? formatDate_(rawValue) : rawValue;
            pdfField.setText(valueToWrite);
          }
        }
      }

      // Générer et télécharger le PDF
      const modifiedPdfBytes = await pdfDoc_.save();
      const blob = new Blob([modifiedPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      if (download) {

        a.download = "contrat.pdf";
        a.click();

        URL.revokeObjectURL(url);
      } else {
        setToSendBlob(blob)
      }
  }

  setCurrentPage(page: number) {
    this.currentPage = page;
  }
}
