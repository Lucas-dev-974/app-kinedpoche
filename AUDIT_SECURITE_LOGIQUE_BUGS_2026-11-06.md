# Audit code — Frontend kinedpoche

> **Date** : 06/11/2026 · **Périmètre** : `src/**` + Dockerfile/nginx + CI + contrats d'API avec `api-kinedpoche`
> **Légende** : 🔴 critique · 🟠 majeur · 🟡 mineur · 🧪 **vérifié** (lecture directe du code ; plusieurs confirmés par `tsc --noEmit` — intégralement re-contrôlé le 06/11) · ⏱ signalé (non re-vérifié)
> Les bugs croisés API↔Front sont répétés ici ; le détail backend est dans `../api-kinedpoche/AUDIT_SECURITE_LOGIQUE_BUGS_2026-11-06.md`.

## ✅ Statut des correctifs — session du 06/11/2026 (critiques F1-F4 + appelants)

Vérification : `tsc --noEmit` — **21 erreurs avant = 21 après** (0 nouvelle ; les 2 `pdfHeight` de `PDFTool.ts` sont préexistantes, cf. 🟡) · `vite build` ✓.

| ID | Statut | Détails |
|---|---|---|
| F1 fuite de données patient (PDFTool singleton) | ✅ **patché** | `.resetContractData()` est désormais **appelé** dans `onCleanup` de PDFEditor + `PDFTool.resetInstance()` à la fermeture du dialog (PDFEditor **et** DialogWrapper) ; `getInstance` réinitialise contractData/métadonnées à **chaque** accès, même si url/canvasID sont identiques |
| F2 `clearUserData` cassé + JWT en localStorage | ✅ **patché** | neutralisation via le proxy avec persistance silencée puis `removeItem` (plus aucune écriture persistante entre les deux) ; code mort `this.data = {...}` supprimé ; le trap `set` ne sérialise plus les écritures sans changement (le `setGlobalIsLogin(false)` du logout ne recrée plus l'entrée `store`) ; **JWT de session déplacé en `sessionStorage`** (survit au rechargement d'onglet, purgé à la fermeture, exclu du JSON persisté) ; garde au boot : `isLogin=true` sans token → purge + retour déconnecté · *limite connue : le token n'est pas partagé entre onglets* |
| F3 401 → fake-succès `{}` | ✅ **patché** | le fetcher **lève** une ApiError dédiée (« Session expirée ou invalide », logout conservé) au lieu de `return {}` ; succès élargi à `response.ok` (202/206 acceptés) ; appelants blindés : `BottomMenuPageContract.onMount` (try/catch + fallback liste locale + **sync du store avec la liste serveur**), `confirmDeleteContract` (ligne gardée si le delete échoue), `useContractSearch` (séquence anti-race + fallback local), `CTAPDFViewer.saveContractInDB` (`isLoading` + `disable` + try/finally + garde outil) |
| F4 promesse non catchée (envoi PDF) | ✅ **patché** | `downloadModifiedPdfWithStoredSignatures` retourne une **vraie promesse** (wrappant `onload` + `reader.onerror`, corps extrait dans `setFormAndSignaturesIntoPdf`) ; `handleSubmit` : garde `currentPDFTool()?.pdfFile` **avant** `setIsLoading(true)`, `finally` → `setIsLoading(false)` ; blob global purgé après chaque envoi ; `downloadPDF` du viewer catche |
| 🟠 endpoint fantôme `/contract/signature` | ✅ **retiré** | méthode morte `contractService.signature` supprimée (0 appelant, plan item 5) |
| 🟠 token brut interpolé | ✅ **patché** | `encodeURIComponent` sur le query param de `getContractByToken` |
| 🟠 / 🟡 restants | ⏳ **non fait** | DialogWrapper (scoping des resets + `closeDialog` figé à 'registerInformations'), PageWrapper (signe-back écrase les contrats + non catché), store non réactif (`createStore`), bouton de déconnexion absent, signatures (pads `destroy()`/ratio/listener resize), pagination `PDFCanvas` codée en dur (6), `getTextField` qui lève (PDFTool:515 → try par champ), `isRendering` sans `finally`, `formatDate` `''` vs `'Invalid Date'`, `listFromIDSToken` double sérialisation, `DropdownWrapper` enfants doublés, purge des imports fantômes 🟡, CSP nginx, CI déploie les PR |

## Synthèse

| | 🔴 | 🟠 | 🟡 |
|---|---|---|---|
| Total | **4** | **14** | **12** |

**Corrections de la passe de vérification** : 3 annonces du premier audit étaient inexactes et ont été corrigées — (1) le `TypeError: {} is not iterable` de F3 n'est pas constatable (Solid tolère un non-tableau dans `<For>`) : la vraie conséquence reste des **listes silencieusement vides** après 401 ; (2) le « throw si `contracts!` undefined » de CTAPDFViewer est faux (le store garde toujours la clé `contracts`, logout inclus) ; (3) le doublon d'id de notification : la boucle `while (ids.includes(newId))` l'empêche sauf cas d'appels simultanés. En contrepartie, le bug `DialogWrapper` a été **précisé et aggravé** (chaîne vérifiée de bout en bout).

**Priorité 1** : fuite de données patient entre contrats (PDFTool singleton). **Priorité 2** : 401 retourné comme succès (`{}`) qui masque les pertes de session. **Priorité 3** : store/logout cassé + JWT en localStorage. Détail en fin de fichier.

---

## 🔴 Critique

### F1. Fuite de données patient entre contrats — PDFTool singleton jamais réinitialisé 🧪
- **`src/components/ContractEditor/PDFEditor.tsx:18`** : `onCleanup(() => currentPDFTool()?.resetContractData)` — **parenthèses d'appel manquantes** : la fonction est passée à `onCleanup` mais **jamais invoquée**. Confirmé par lecture.
- **Pourquoi** : `PDFTool` est un singleton statique. À la fermeture du dialog (`DialogWrapper`), seul `setCurrentPDFTool(undefined)` est appelé — le reset prévu ne tourne jamais. À la réouverture (même URL/canvas), `getInstance` ne réinitialise rien : `contractData` du contrat précédent (noms, emails, dates et surtout **data-URL de signatures**) est conservé, puis peut être sauvegardé dans le **nouveau** contrat ou envoyé par mail. Incident de confidentialité concret entre patients.
- **Fix** : `?.resetContractData()` (appeler la fonction) **et** détruire l'instance (`PDFTool.resetInstance()`) à la fermeture du dialog ; dans `getInstance`, re-initialiser contractData/métadonnées même si les paramètres sont identiques.

### F2. `clearUserData` cassé + re-persistence du token avant effacement 🧪
- **`src/utils/store.service.ts:87-102`** : `clearUserData` réassigne `this.data = { isLogin: undefined, contracts: [] }` (l.98) alors que `this.proxy` (créé au constructeur) encapsule **l'objet original** — la réassignation est du **code mort**, les écritures suivantes continuent de muter l'ancien objet. Le trap `set` du proxy **sérialise tout le store à chaque écriture** : pendant le logout, l.89 (`isLogin = false`) re-persiste le store **avec le token encore valide** avant le `localStorage.removeItem` (l.95) — un crash entre les deux laisse le token et les données en localStorage.
- **Fix** : muter uniquement via le proxy ; `removeItem` **en premier** ; ne pas sérialiser depuis le trap `set` (flag interne ou `setState()` explicite/debouncé).
- **Vérifier aussi** : après `clearUserData()`, `authService.logout()` appelle `setGlobalIsLogin(false)` → nouvelle écriture via le proxy → le trap `set` **recrée l'entrée `store` dans localStorage** juste après le `removeItem` (données neutralisées, mais l'effacement est défait).
- **Conséquence sécurité** : le JWT de session, les tokens par contrat et les données personnelles/santé restent en **localStorage en clair** — toute XSS = vol de session + exfiltration ; les données survivent à la fermeture du navigateur sur une machine potentiellement partagée (cabinet). 🧪
- **Fix (sécurité)** : garder le token en mémoire variable à part du store sérialisé (ou session-scopé) ; à terme, envisager un cookie httpOnly côté backend + purge explicite des tokens de contrats au logout.

### F3. 401 → `return {}` en fake-succès 🧪
- **`src/services/fetch.service.ts:104-111`** : sur 401, logout silencieux puis **`return {}`** au lieu de lever. Les services castent la réponse (`as ContractEntity[]`, `as ContractEntity`) → les appelants croient à un succès.
- **Constaté** : `BottomMenuPageContract.tsx:36-48` / `CTAPDFViewer.tsx` — les appels reçoivent `{}` casté en tableau : les écrans affichent des **listes vides sans aucune erreur signalée** — pertes de session complètement masquées (Solid `<For>` tolère un non-tableau : pas de crash, pire encore — silence total).
- **Fix** : lever une `ApiError` dédiée (le logout reste), laisser les appelants ignorer explicitement ce cas ; sinon typer le retour `| null` et forcer la vérification.

### F4. Chaîne d'envoi du contrat sans filet (promesse non catchée) 🧪
- **`src/components/ContractDialog/PDFPrevisualisation/SendContractTo.tsx:70-88`** + **`src/utils/PDFTool.ts:418-543`** : le vrai travail asynchrone vit dans `reader.onload` (FileReader) **sans promesse wrapper** — `await` (l.77) résout avant la fin réelle ; toute erreur dans `onload` (`PDFDocument.load` invalide, `getTextField` qui lève, `embedPng` en échec) devient une **unhandled rejection** que le `try/catch` de `handleSubmit` ne voit jamais.
- **Effets** : `isLoading` reste `true` (aucun `finally` sur le chemin de succès — confirmé), bouton gelé, aucune notification ; si `currentPDFTool()` est `_undefined_`, le `?.` (l.77) **saute silencieusement** la génération ; le blob global `toSendBlob` peut contenir le PDF d'un envoi précédent.
- **Fix** : `downloadModifiedPdfWithStoredSignatures` doit retourner une Promesse (`new Promise` wrappant `onload` + `reader.onerror`), `setIsLoading(false)` dans un `finally`, garde sur `currentPDFTool()` avant `setIsLoading(true)`, `toSendBlob = undefined` après envoi.

---

## 🟠 Majeur

### État & logique
- **🧪 `PageWrapper.tsx:32-43`** : `storeService.proxy.user == {} as UserEntity` — comparaison de deux références d'objets distinctes, **toujours fausse** (branche morte). Le lien `?signe-back=` **écrase** tous les contrats locaux (`proxy.contracts = [contract]`) au lieu de fusionner ; l'`await getContractByToken` (l.36) n'est pas catché → unhandled rejection si l'API échoue. **Fix** : tester les propriétés, fusionner par id, try/catch.
- **🧪 Le "store" n'est pas réactif (anti-pattern Solid)** : Proxy+localStorage maison — les lectures `storeService.data.user` / `proxy.user` dans le JSX ne se **mettent pas à jour** après login/logout (évaluées une fois à la création, le re-render repose sur le remontage de composants). Deux sources de vérité désynchronisées (`proxy.isLogin` vs signal `loggedIn()`). Exemples : `ReplacedFields.tsx:96/171`, `SubstituteFields.tsx:98/175`, `ContractInformationsFields.tsx:138`. **Fix** : `createStore` Solid (ou signals) et abandonner la double source de vérité.
- **🧪 `BottomMenuPageContract.tsx` (l.31-100)** : (1) à l'ouverture, la liste serveur (`contractService.list()`) n'est **jamais synchronisée** dans le store — `setContracts()` seulement ; (2) après suppression, le `.filter` opère sur ce store **périmé** puis `setContracts(store)` réaffiche le contenu obsolète → ligne supprimée qui réapparaît / liste serveur remplacée par l'ancienne liste locale (code lu) ; (3) l'API `delete` répondant toujours 401 (bug API croisé), le front **enlève la ligne localement** alors que le contrat existe toujours en base → il **réapparaît au rechargement** ; (4) `onMount` async sans try/catch → unhandled rejection hors-ligne ; (5) re-mount systématique à chaque bascule de vue (`Switch/Match` démonte le composant, vérifié) → requêtes répétées. **Fix** : synchroniser le store après list(), try/catch, garder l'état entre toggles. ~~comparaison d'ids string vs number~~ — *retirée : les deux côtés renvoient des ids numériques.*
- **🧪 `CTAPDFViewer.tsx:14-39`** : double-clic « Sauvegarder » = **deux contrats créés** (aucun garde ni `isLoading`, code lu) ; **aucun try/catch du tout** → une erreur API devient un unhandled rejection **sans la moindre notification** (contrairement à ce qu'annonçait le premier audit) ; assertions `currentPDFTool()!` non gardées (`getContractData`, `downloadModifiedPdfWithStoredSignatures`) → TypeError si l'outil n'est pas prêt ; de plus `!loadContract() || loadContract() == undefined` : seconde condition morte (si la première est fausse, la fonction est truthy). ~~throw sur `contracts!` après logout~~ — *retiré : le store garde toujours la clé `contracts` (valeur `[]`).* **Fix** : `isLoading` + disable, try/catch + notification, gardes `?.`.
- **🧪 `useContractSearch.ts:10-40`** : race condition — les réponses concurrentes arrivent dans un ordre quelconque, la plus **lente** du plus ancien écrase la plus récente ; pas de catch → unhandled rejection hors-ligne, liste figée. **Fix** : séquence d'id ou `AbortController`, try/catch avec fallback local.
- **🧪 `DialogWrapper.tsx:51-79` — ré-écrit après vérification, plus grave que prévu** : le `closeDialogTool` **local** de chaque instance (l.68-75) reset **sans condition** `setLoadContrat(undefined)`, `setCurrentPDFTool(undefined)`, `setOpenDialogs('none')` — et ce reset est déclenché par l'effet global (l.77-79) dès que `closeDialog() === props.name`. Or la chaîne réelle : l'unique appelant du `closeDialogTool` **exporté** est `RegisterInformationsInLocal.tsx:59` (`saveInformations`) → le signal `closeDialog` vaut `'registerInformations'` **pour toujours** (jamais remis à `'none'`, vérifié) → l'instance registerInformations (montée en permanence dans la Navbar, vérifié) ré-exécute son reset **à chaque changement d'`openDialogs`**. Conséquences vérifiées par traçage : (a) après une première sauvegarde d'informations, toute ouverture du dialog « Enregistrer vos Informations » s'**ouvre puis se referme instantanément** (setOpen(true) puis setOpen(false) dans le même flush) ; (b) l'ouverture de `editContract` **wipe `loadContract` + `currentPDFTool` pendant l'ouverture** — le PDFEditor se re-montera ensuite avec `loadContract()` vide : un contrat ouvert pour édition/signe-back apparaît en « nouveau contrat » → sauvegarder **crée un doublon au lieu de mettre à jour** (cf. `CTAPDFViewer`: `!loadContract()` → `createContract`). **Fix** : scoper le reset à l'instance (ne détruire loadContract/currentPDFTool que lors de la fermeture effective d'editContract) et remettre le signal `closeDialog` à `'none'` après traitement.
- **🧪 `DropdownWrapper.tsx:24-34`** : les `children` sont instanciés **deux fois** (`props.children(()=>{},()=>[])` juste pour compter) → chaque accordion tourne deux fois (onMount/effects dupliqués qui peuplent PDFTool, fuites d'ownership Solid). **Fix** : passer une config explicite (ids/titres) au lieu d'introspecter les children.

### PDF & signatures
- **🧪 `PDFTool.ts:257-284`** : `isRendering` sans `try/finally` — un `page.render` qui échoue le laisse `true` à jamais, **plus aucune pagination ne fonctionne** (le guard avale les clics en silence).
- **🧪 `PDFTool.ts:513-522`** : `form.getTextField(field.name)` — **vérifié dans le source pdf-lib** (`cjs/api/form/PDFForm.js:263-274` : « An error will be thrown if no field exists with the provided name, or if the field exists but is not a text field ») : il **lève** (`UnexpectedFieldTypeError` / champ introuvable), ne retourne jamais null → le `if (pdfField)` est du code mort ; un seul nom de champ absent ou non-texte du AcroForm de `contrat.pdf` **abort toute la génération** (et ce throw survient dans le `reader.onload` non catché — cf. F4). **Fix** : `try` par champ ou filtrage via `getFields()`.
- **🧪 `PDFTool.ts:501-504`** : `formatDate()` retourne `''` pour une date invalide (pas `'Invalid Date'`) → le test `formatedDate == "Invalid Date"` est toujours faux : les dates illisibles sont **effacées** au lieu d'être conservées. Idem `PDFInputsOnCanvas.parseDisplayData`.
- **🧪 `PDFCanvas.tsx:16-46`** : pagination codée en dur (**6 pages**) vs `numPages` dynamique ; `PDFInputsFieldsMetadata?.filter(...)[0].fields` → `TypeError` si aucune page ne matche (et `...fields` throw si undefined) ; `onMount` lance `currentPDFTool()!.renderPage` sans garantie que l'outil soit prêt. **Fix** : `numPages`, retours précoces, gardes `?.`.
- **🧪 `SignatureEditor.tsx:41-52` + `Singatures.tsx:44-47,58-62` + `SignatureManager.ts:25-37` + `PDFCanvas.drawSig`** — mécanisme corrigé après vérification : (1) **listener `resize` jamais retiré si le dialog est démonté ouvert** (le `removeEventListener` n'existe que dans la transition open→false, l.44-46 ; aucun `onCleanup` — code lu) ; (2) instances `SignaturePad` créées à chaque ouverture, jamais `destroy()`/`off()` → pads fantômes toujours câblés sur le même canvas ; (3) un premier resize a lieu **avant** la création du pad, mais le `requestAnimationFrame` (l.49) re-redimensionne **après** la création du pad **et après** le `fromDataURL` de l'effet de restauration — et assigner `canvas.width` **efface le bitmap** → **la signature restaurée est invisible à la réouverture de l'éditeur** (effacée juste après son dessin) ; (4) le cleanup `Singatures.onCleanup` remet les signatures à `''` (falsy) → `getExistingSignature()` renvoie `''` et la restauration est skippée ; (5) `drawSignatureOnCanvas` (SignatureManager + `drawSig` de PDFCanvas) dessine `ctx.drawImage(img, 0, 0, canvas.width, canvas.height)` **sans conserver le ratio** → signatures étirées/déformées. **Fix** : listener via le return de l'effet, `off()`/recréation propre du pad, resize de fin AVANT tout dessin (ou ne pas re-resizer si taille inchangée), `setSignatures(undefined)`, ratio préservé.

### Services / auth
- **🧪 Aucun bouton de déconnexion** : `authService.logout()` n'est appelé **que** par le 401 du fetcher — `UserMenuDialog.tsx:42` n'a qu'un TODO pour le rapport de bug. Un kiné connecté ne peut pas se déconnecter volontairement. **Fix** : bouton « Se déconnecter » branché sur `logout()`.
- **🧪 `contract.service.ts:45`** : token brut interpolé sans `encodeURIComponent` (un token contenant `?`/`#` casse le query param). **Fix** : encoder.

---

## 🟡 Mineur

- **🧪 Imports fantômes — chaîne Announcements morte** : `AnnouncementCard.tsx` importe des icônes inexistantes (`CalendarIcon`, `HouseIcon`, `PeopleIcon`, `PercentIcon`) — **4 erreurs TS2307 confirmées par `tsc --noEmit`** (les fichiers sont absents de `src/icons/`, seul `ContractIcon.tsx` existe) ; la chaîne (`Home.tsx:10` → `Annoucements.tsx` → `AnnouncementCard`) est bien morte (appel commenté, vérifié). Autres morts listées par tsc (TS6133) : `ContractInformationsFields` (Button, loggedIn, **fillWithMyInformations**), `SignatureCanvas` (isHovered, getSignatureTypeLabel), `RegisterCard` (createEffect, LabeledSelect), `HeroSection` (Button, navigate), `formFillMode` (Accessor), `BottomSlideDialog` (Show), `DialogToInputRadio` (createEffect). **Nouveau type-check** : `auth.service.ts:23` — TS2322, `Partial<UserEntity>` assigné à `UserEntity` (les champs du user sauvegardé sont potentiellement undefined). **Fix** : supprimer la chaîne/les variables, corriger le type du store.
- **🧪 `ContractInformationsFields.tsx`** : `Number(value)` sans validation (`'abc'` → NaN envoyé à l'API) ; `isValid()` (l.123) traite `0` comme vide → un pourcentage **0 %** bloque la validation ; `fillWithMyInformations` (l.85-104) jamais référencée + `setCurrentPDFTool` no-op.
- **🧪 Duplication de listes** : IDs de champs date (`'96R'…'138R'`) dupliqués `PDFInputsOnCanvas.tsx:12` ↔ `PDFTool.ts:499` ; constantes A4 dupliquées (fallbacks 598/299/595.2/841.68) sur **3 sources**. **Vérifié toutefois** : le mapping config↔PDFTool est correct (pas de décalage de champs). **Fix** : exporter depuis `pdf-field-mapping.config.ts`.
- **🧪 `PDFTool.ts:184`** : `for (i = 0; i != pages; i++)` (au lieu de `<`) fonctionne par accident ; `getDimensions` re-télécharge la page 1 **pour chaque page** et applique le scale de la page 1 partout (hypothèse « pages identiques » silencieuse).
- **🧪 `PDFActions.tsx:10-21`** : `currentPage` initialisé `as number` (→ « undefined sur undefined » si l'outil n'est pas prêt) et jamais synchronisé si la page change ailleurs.
- **🧪 `notification.service.ts:14-21`** — justification corrigée après vérification : la boucle `while (ids.includes(newId))` **empêche** le doublon issu d'une simple rétraction ; la vraie faille est que `lastId` est calculé **hors du setter** (`setNotifications(prev => ...)`) — deux `push` dans le même tick partagent le même snapshot d'`ids` et produisent le **même id** (remove peut alors fermer la mauvaise notification). **Fix** : calculer l'id dans l'updater ou compteur monotone module-level.
- **🧪 `DialogWrapper.tsx:62-66`** : `removeSigneBackQuery` reconstruit `'?' + queryParams.toString()` même si la query devient vide → `?` orphelin ; `replaceState` ne réagit pas côté router.
- **🧪 `auth.service.ts` / `fetch.service.ts`** : `navigateFn` global module remplacé à chaque mount → pointe vers un composant mort après démontage ; timeout AbortController ne couvre pas `response.json()`/`text()` (peut pendre indéfiniment) ; seuls 200/201/204 sont « ok » → **202/206 traités comme erreurs** ; `error.message.includes("fetch")` rate les TypeError d'autres libellés. **Fix** : onCleanup pour navigateFn, signal global, `response.ok`, matcher `error.name === 'TypeError'`.
- **🧪 `RegisterInformationsInLocal.tsx:40-53`** : enregistre `new Date(birthday())` → champ vide = « Invalid Date » sérialisé (null en localStorage) qui se retrouve dans le flux PDF ; aucune validation email. **Fix** : valider avant d'écrire.
- **🧪 `listFromIDSToken` (contract.service.ts:22)** — requalifié après vérification : ce n'est pas une « double sérialisation » cassée mais une **string JSON dans un champ JSON** (`{ ids: JSON.stringify(...) }`) — le backend fait `JSON.parse(req.body.ids)` : fonctionne, mais fragile (pas de schéma) et type annoncé `[number,string]` vs `[string,string]` réels (ids numériques à l'exécution, le cast ne correspond pas). **Fix** : poster le tableau directement (`{ ids: [[id, token], ...] }`) et aligner le type.
- **🧪 nginx (`nginx-spa.conf`)** — lu : pas de CSP / `X-Content-Type-Options` / `HSTS` ; healthcheck wget OK ; SPA fallback correct.
- **🧪 CI front (`.github/workflows/action.yml`)** — lu : déployé sur les pushes **et les PR** → un simple PR déclenche un déploiement FTP avec la branche courante ; pas d'étape de lint/test.

---

## Ce qui est sain

- Le mapping des champs PDF (`pdf-field-mapping.config.ts` ↔ `PDFTool` ↔ AcroForm `contrat.pdf`) est cohérent — pas de décalage constaté.
- Le fetcher tente un bon socle (timeout AbortController, FormData, encodage de la recherche) — il a juste besoin de ne plus masquer les 401.
- Aucun `innerHTML`/XSS sink dangereux constaté dans les composants.

---

## Plan de correction recommandé (rayon d'impact décroissant)

1. **F1** : reset/détruire PDFTool à la fermeture du dialog (une ligne + hardening `getInstance`).
2. **F3** : lever au lieu de `return {}` sur 401 (et corriger l'itération `{}` à la source).
3. **F2** : réparer `clearUserData` + sortir le token du localStorage.
4. **F4** : promettre le flux PDF + `finally` sur isLoading.
5. **API↔Front** (dans le même pass) : supprimer le fantôme `/contract/signature`, réparer la suppression (`delete` + token/autorisation côté API), encoder le token, aligner `list-ids` (fin de la double sérialisation + types).
6. **🟠** : réactivité du store (createStore), gardes `currentPDFTool()!`, races, signatures (liste/pad/ratio), bouton logout, scoping des resets de dialogs.
7. **🟡** : purge du code mort et des duplications.

*Généré par audit agent — chaque finding re-contrôlé ligne par ligne contre le code le 06/11/2026 (sources des dépendances pdf-lib/jsonwebtoken incluses, `tsc --noEmit` exécuté). Trois annonces du premier audit ont été corrigées et deux ont été aggravées/précisées (F2, DialogWrapper ; voir la synthèse).*
