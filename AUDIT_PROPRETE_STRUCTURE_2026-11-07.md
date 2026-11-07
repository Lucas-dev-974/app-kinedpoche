# Audit propreté & structure — Frontend kinedpoche

> **Date** : 07/11/2026 · **Périmètre** : `src/**` + sw.js + index.html + package.json + README + nginx/compose (côté front uniquement — l'API fait l'objet d'un audit séparé)
> **Nature** : propreté du code, découpage en composants TSX, reste-à-faire. **PAS un audit sécurité** (cf. `AUDIT_SECURITE_LOGIQUE_BUGS_2026-11-06.md` — correctifs appliqués et vérifiés).
> **Légende** : 🧪 vérifié par lecture directe / commande exécutée. `tsc --noEmit` : **0 erreur** · `vite build` ✓ (24 entrées precache).

---

## ✅ Statut des correctifs — vague de remédiation du 07/11/2026

Vérification : `tsc --noEmit` **0 erreur** · `vite build` ✓ (classes vérifiées dans le CSS généré, safelist incluse) · **QA cliquée** contre la stack docker (web:5173, api:3001). Commits : `9576164` (refactor), `12dba74` (build/deps), `fdeccc1` (docs).

| Finding | Statut | Détails |
|---|---|---|
| 🔴 P1 Tailwind CDN en prod | ✅ **patché** (`12dba74`) | Tailwind v3 build-time (`tailwind.config.js` + `postcss.config.js`, portage exact : couleurs, `preflight: false`, safelist `text-left/center/right`) ; CDN + inline config retirés d'`index.html` ; le compose monte les configs dans le conteneur dev |
| 🔴 P2 duplication Replaced/Substitute | ✅ **patché** (`9576164`) | `KineFields.tsx` paramétré par rôle ; ids DOM dupliqués corrigés ; divergences préservées et commentées (genre, source d'adresse) |
| 🟠 P3 sw.js (CDN workbox, double-routage, activate destructif, boilerplate widget) | ✅ **patché** (`12dba74`) | 205 → 51 lignes ; NavigationRoute SPA offline ajouté ; le handler activate qui **supprimait la cache precache** (offline cassé après chaque activation) retiré |
| 🟠 P4 signaux module-level | 🟡 **partiel** | `toSendBlob` (P5) et `toggleItemEvent` supprimés ; les autres signaux module-level restent (pattern assumé — une instance par écran) |
| 🟠 P5 flux d'envoi à double détente | ✅ **patché** (`9576164`) | `downloadModifiedPdfWithStoredSignatures` retourne le Blob ; chaîne directe dans `handleSubmit` ; fin du `createEffect` global |
| 🟠 P6 deps mortes | ✅ **patché** (`12dba74`) | lit, shoelace, app-tools, multer, @types/multer, workbox-core/precaching supprimés (grep zéro import) ; **conservés** : `workbox-build` (peer de vite-plugin-pwa), `solid-meta`/`urlpattern-polyfill`/`@types/pdfjs-dist` (usage non vérifié, non retirés) |
| 🟠 P7 commentaire mensonger PDFTool | ✅ **patché** (`fdeccc1`) | Doc `getContractData` corrigée ; le typage `any` de `updateField`/`getDimensions` reste ⏳ (à reprendre avec une vague de typage PDFTool) |
| 🟡 cosmétique | ✅ **patché** (`9576164`) | `type="email"`, labels FR, classes cassées, code mort, birthday optionnel, OulinedButton icon+texte |

**QA naviguée (07/11)** : boot sans erreur · 4 accordéons avec ids préfixés · remplissage « Le remplacé » depuis profil (`officeAdress` ✓) · remplissage « Le remplaçant » → **vidage croisé du remplacé** ✓ + `personalAdress` ✓ · save → create (id+token, « Contrat sauvegardé ») · re-save → update (1 seul id, « Contrat mis à jour ») · envoi → POST → **503 attendu** (SMTP non configuré) → notifications + bouton relâché, dialog ouvert · reload → persistance + liste serveur ✓.
**Environnement** : `localhost` (IPv6) ne traverse pas toujours le port-forwarding Docker sur ce poste — QA passée sur `127.0.0.1` ; CORS `http://127.0.0.1:5173` ajouté au défaut du compose racine (fichier non versionné, hors repos git).
**Restent ⏳** : commit CI `6aa4ef1` non poussé (PAT scope workflow), « Fiches clients » (stub), « mot de passe oublié » (lien mort), remount liste contrats, CSP/HSTS nginx (différé), typos de noms de fichiers (OulinedButton, Singatures… : renommages cassables à faire en une passe dédiée).

### 🩹 Correctif post-QA utilisateur — style cassé chez l'utilisateur (07/11, après-midi)

Le passage à Tailwind build-time a **cassé le style dans le navigateur de l'utilisateur quotidien** : la cause n'était pas le CSS compilé (vérifié : le dev sert bien les utilitaires), mais le **service worker** — en DEV, vite sert `public/sw.js` tel quel (`self.__WB_MANIFEST` non injecté, vide) et le `createHandlerBoundToURL('/index.html')` du NavigationRoute **levait à l'évaluation** → le nouveau SW ne s'installait **jamais** → le navigateur gardait l'**ancien SW** et ses caches `pages-cache`/`assets-cache` du CDN, qui resservaient le **CSS d'avant Tailwind** dès qu'une requête bronchait (et `localhost`/IPv6 est instable vers Docker sur ce poste : fallbacks de cache fréquents). Résultat : DOM chargé, zéro style.
**Fix** (`public/sw.js`) : NavigationRoute posé **sous garde** (seulement si `index.html` est dans le manifest — en build il l'est, en dev non) ; `self.__WB_MANIFEST` apparaît **exactement une fois** (contrainte dure de workbox injectManifest, sinon `AssertionError` au build) ; l'activation **purge les caches héritées** `pages-cache`/`assets-cache` (repeuplées à la demande, precache préservée) + `clients.claim()`. Vérifié en navigateur : SW enregistré → activé → contrôleur actif, caches propres, styles appliqués (`.flex` → flex).

---

**La bibliothèque de composants réutilisables est bien découpée.** Chaque famille est décomposée en petits composants à responsabilités séparées :

| Famille | Découpage | Verdict |
|---|---|---|
| `table/` | `DataTable` (générique + `render` prop) → `TableContainer` / `TableHeader` / `TableBody` / `TableEmptyState` / `TableTypes` | ✅ exemplaire |
| `dialog/` | `DialogWrapper` (controlled + uncontrolled) + `Overlay` + `DialogContainer` + `DialgoHeader` + `ConfirmationDialog` + `BottomSlideDialog` + `ReportBugDialog` | ✅ bonne hiérarchie |
| `inputs/` | `LabeledInput`, `LabeledSelect`, `LabeledTextarea`, `SearchInput`, `DialogToInputRadio` — réutilisés dans ~6 écrans | ✅ |
| `buttons/` | `Button`, `OulinedButton`, `ButtonIcon` | ✅ (réserves 🟡 : duplication de la logique size, `OulinedButton` perd le texte si `icon`) |
| `notification/` | `Notification` (Portal) → `NotifcationItem` (barre de progression + cleanup) | ✅ |
| `navbar/` | `Navbar` → `NavbarTitle` + `UserMenu` → `UserMenuButton` / `UserMenuDialog` | ✅ |
| `FloattingMenu/` | `FloatingMenu` → `FloatingMenuItems` ; `BottomMenuDialog` → `BottomMenuHeader` / `PageRouter` / `PageBtnGroups` / `pages/` / `ContractTableRow` | ✅ |
| `Signatures/` | `Singatures` → `SignatureCanvas` + `SignatureEditor` + `SignatureManager` + `types` + `constants` + `index` | ✅ (post-fix audit, propre) |
| `services/` + `utils/hooks/` | fetcher typé, `useContractSearch` (hook anti-race) | ✅ |

**Le découpage manque à trois endroits** — ce sont les chantiers prioritaires si on veut progresser :

1. 🔴 **`ReplacedFields.tsx` (286 l.) ≈ `SubstituteFields.tsx` (270 l.) à ~95 %** (diff vérifié après normalisation replaced/substitute) : mêmes signaux, même `isValid`, même switch-handler, même JSX à 8 champs. Un composant unique paramétré (`role: "replaced" | "substitute"`, mapping de champs, source d'adresse, radio ids) supprimerait ~250 lignes et éliminerait les **divergences déjà présentes** : le remplacé se remplit avec `officeAdress`, le substitut avec `personalAdress` (à valider métier — l'inverse paraît attendu), et la gestion du genre diverge (`setGender(userDatas.gender)` vs relecture depuis `contractData`).
2. 🟠 **`PDFTool.ts` : 576 lignes, 5 responsabilités dans une classe** : extraction des champs AcroForm (`getPagesFields`), rendu canvas (`renderPage`), logique métier genre (`updateContractDataAndPDFFields`), génération pdf-lib (`setFormAndSignaturesIntoPdf`, 128 l. seul), et **DOM/téléchargement** (`a.click()` + signal global `toSendBlob`). Découpage naturel : `PdfFieldExtractor` / `PdfRenderer` / `PdfGenerator`. Les enums `GenderEnum`/`AuthorsEnum` (domaine métier) vivent dans un utilitaire PDF alors que `models/*.entity` les importent — dépendance inversée à corriger.
3. 🟠 **`PDFCanvas.tsx` — `displaySigsLastPage` (68 l.) : DOM impératif dans un composant TSX** : `document.createElement("canvas")`, styles inline, positions magiques (`{left: 80, top: 620}`). À extraire en composant `<SignatureOverlays>`. Plus largement `getElementById("pdf-canvas")` × 7 sur 4 fichiers (`PDFCanvas`, `PDFInputsOnCanvas`, `PDFTool`, `main`) — des refs Solid (`ref=`) supprimeraient le couplage par ID magique partagé.

---

## 🔴 Structurant

### P1. Tailwind chargé par CDN en production 🧪
- **`index.html:37`** : `<script src="https://cdn.tailwindcss.com">` — le Play CDN officiellement « not for production » : ~110 KB de JS exécutés à chaque chargement, génération des styles **au runtime** (FOUC), warning visible en console.
- **PWA cassée hors-ligne** : le SW ne precache que `dist/**` (globPatterns du vite-plugin-pwa) ; `cdn.tailwindcss.com` n'est ni precaché ni runtime-caché → **en offline l'application perd tout son style**.
- **Piège de migration masqué** : les classes dynamiques `text-${column.align}` (`TableBody.tsx:33`) ne fonctionnent que parce que le CDN observe le DOM. Une migration vers Tailwind build-time sans safelist cassera silencieusement les alignements de tableau.
- **Fix** : installer Tailwind en dépendance build (`@tailwindcss/vite` ou postcss), purger le script CDN, safelister `text-left/center/right` (ou remplacer par un objet de correspondance).

### P2. Duplication Replaced/Substitute (cf. verdict ci-dessus) 🧪

---

## 🟠 Notable

### P3. Service worker : CDN + double-routage + boilerplate mort 🧪
- **`public/sw.js:1-3`** : workbox importé depuis `storage.googleapis.com` — SW **indisponible si ce CDN l'est** (install offline impossible) alors que `workbox-build/core/precaching` sont déjà dans `package.json`.
- **`sw.js:118-205`** : listener `fetch` custom qui **double** les routes workbox (`registerRoute` document/assets NetworkFirst, l.86-115) — pour chaque navigation/asset, `respondWith` est appelé deux fois (workbox a répondu en premier) → `InvalidStateError` dans les logs SW et le cache du bloc custom ne s'écrit jamais. Le bloc entier est redondant avec les routes workbox.
- **`sw.js:8-58` + `public/widget/`** : boilerplate « widget PWABuilder » (msAcTemplate, `self.widgets`) sans rapport avec l'app — code mort à purger.
- `isLocalhost` par `url.includes('dev')` (l.137) — toute URL contenant "dev" est traitée comme du dev.

### P4. État global via signaux module-level 🧪
Pattern récurrent — fonctionne car une seule instance de chaque écran existe, mais fragile et non testable :
- `ReplacedFields.tsx:20-30` / `SubstituteFields.tsx:21-31` (signaux hors composant),
- `BottomMenuDialog.tsx` (`isBottomMenuVisible`, `bottomMenuPage`), `PDFInputsOnCanvas.tsx` (`canvasInputs`), `notification.service.ts`, `ContratInformationsDropdowns.tsx` (`toggleItemEvent` — déclaré, **jamais consommé** : grep vérifié),
- `PDFTool.ts:14` `toSendBlob` (blob de l'envoi en cours comme signal global).
**Fix proposé** : regrouper l'état partagé dans le store `store.service` (déjà réactif) ou des contexts Solid dédiés ; garder les signaux locaux **dans** les composants.

### P5. Flux d'envoi de contrat à double détente 🧪
**`SendContractTo.tsx:70-146`** : `handleSubmit` génère le PDF → écrit le signal global `toSendBlob` → un `createEffect(on(toSendBlob, …))` envoie réellement le mail. Chaîne cachée : l'effet se déclenche sur **toute** écriture de `toSendBlob`, revalide le formulaire (double validation, notifications dupliquées possibles), et si ses conditions sont fausses le `finally` (l.139-144, **dans** le `if`) ne purge pas le blob → un blob périmé peut survivre.
**Fix** : `const blob = await pdfTool.download…` puis envoi direct dans `handleSubmit` ; supprimer le signal global.

### P6. Dépendances mortes + fichiers morts 🧪 (grep : zéro importateur)
- **`package.json` deps inutilisées** : `lit` (importé seulement par `shared-styles.ts`… lui-même jamais importé), `@shoelace-style/shoelace`, `@thepassle/app-tools`, **`multer` + `@types/multer`** (middleware Express dans un package front !), `workbox-core`/`workbox-precaching` (le SW utilise le CDN).
- **Fichiers morts** : `src/styles/shared-styles.ts`, `src/models/announcement.entity.ts` (62 l. — la chaîne Annoucements a été supprimée hier, le modèle est resté).
- `package.json` : `description: "A starter kit for building PWAs!"`, `name: kine-d-poche` — identité template à remplacer.

### P7. Commentaire mensonger + `any` dans PDFTool 🧪
- **`PDFTool.ts:140-147`** : `getContractData()` — doc « Synchroniser contractData avec le store avant de retourner » alors que le corps fait `return this.contractData`. Reste d'un refactor ; à corriger.
- `updateField(..., value: any)` (l.136), `getDimensions(pdfDoc: any, canvasId: any)` (l.224) — typage à reprendre. `resetContractData()` (l.373) initialise 21 champs à la main alors que `getInstance` reset à `{}` — deux resets divergents.

---

## 🟡 Cosmétique

- **Typos de fichiers/identifiants** (cassables au rename, grep vérifié) : `OulinedButton.tsx`, `Singatures.tsx` (exporte `Signatures`), `FloattingMenu/`, `NotifcationItem.tsx`, `DialgoHeader.tsx`, `DorpdownItemType`, `openDialogTool_`, `AuthorsEnum.professional = "professionnal"` (valeur avec faute), `Adress`, `Departement`, `profesionnel` (label).
- **Français des labels** 🧪 : « Je rejoin la platform » (RegisterCard), « Contrat sauvegarder » (CTAPDFViewer), « Edité un nouveau contrat » (EditContractDialog), « Signalement envoye avec succes » (ReportBugDialog), « Corp de l'email » (SendContractTo), « Née le / Née à » accordé au féminin par défaut (Replaced/Substitute/RegisterCard), « Piece jointe ».
- **`type="mail"` invalide ×3** 🧪 (`Login.tsx:47`, `SendContractTo.tsx:161,169`) → `type="email"` (bascule clavier mobile + validation navigateur gratuites).
- **Classes Tailwind cassées** 🧪 : `min-h-[25 0px]` (ReportBugDialog, textarea description), `min-h-[px]` (LabeledInput), `bgz-blue-500` (PDFInputsOnCanvas) — aucune ne génère de style.
- **`Button`/`OulinedButton`** 🧪 : tailles `"responsive"`/`"full-mobile"` déclarées dans le type mais **non gérées** (aucune branche) ; logique de taille copiée-collée entre les deux ; `OulinedButton` rend `icon ? icon : text` — le bug « texte perdu avec icône » corrigé hier dans `Button` (QA Q3) y subsiste (aucun appelant actuel ne passe d'icône — latent).
- **Code mort divers** 🧪 : bloc boutons commenté + `window.innerWidth` non réactif (`HeroSection`), bloc `SynchronizeContracts` commenté (`BottomMenuPageContract.tsx:28-32`), `RouterTypes.onPage` lu par `FloatingMenu` mais `setPage` jamais appelé → condition toujours vraie (et `FloatingMenu` n'est monté que dans `PageWrapper` : doublement mort), « mot de passe oublié ? » (`Login.tsx`) sans handler ni route.
- **Contrats de types fragiles** 🧪 : `RegisterCard` collecte les champs par nom DOM (`data["phoneNumber"]`) castés en `Partial<UserEntity>` — or `UserEntity` front **n'a pas** `phoneNumber` que l'API exige (`required`, `AuthController`) ; `orderNumber: number` (front) vs `string` (API `User.ts`) ; `birthday: Date` en type mais string après relecture localStorage ; `ContractEntity.logoutCreate`/`deleted` jamais utilisés (grep vérifié). Un seul renommage de champ API casse le register silencieusement.
- **`index.html`** : `lang="en"` pour une app 100 % française, meta description placeholder, meta `pwa-starter-template-identity` à retirer.
- **README.md** : ~90 % boilerplate PWABuilder ; note sécurité **obsolète** (« token dans le localStorage » — corrigé en sessionStorage hier) ; `VITE_HOST` documenté sur `:3000` alors que le compose par défaut est `:3001`.
- **`.env` tracké dans git** 🧪 (`git ls-files` — contient uniquement `VITE_HOST`, pas de secret) : convention `.gitignore` + `.env.example` recommandée.
- **`RegisterInformationsInLocal`** : `birthday: birthdayDate ?? new Date(0)` — sérialise le 01/01/1970 quand le champ est vide plutôt que `undefined`.

---

## 📋 Reste à faire (consolidé, statut vérifié aujourd'hui)

| # | Item | Statut |
|---|---|---|
| 1 | **Fiches clients** : vue stub `<div>Fiche clients</div>` (`BottomMenuPageRouter`) | ⏳ fonctionnalité entière à implémenter |
| 2 | **« Mot de passe oublié ? »** : lien mort (aucun handler, aucune route API) | ⏳ à implémenter ou retirer |
| 3 | **Commit CI non poussé** 🧪 : `6aa4ef1` (deploy FTP sur push main uniquement) **local seulement** — le fix n'est pas live sur GitHub ; nécessite un PAT avec scope `workflow` | ⏳ bloqué sur le PAT |
| 4 | Remount `BottomMenuPageContract` à chaque bascule Switch/Match (état perdu + refetch) — ⏳ de l'audit précédent, **confirmé ouvert** | ⏳ restructure UI |
| 5 | Tailwind build-time (P1), purge SW/deps mortes (P3/P6), refonte README/index.html | ⏳ propreté |
| 6 | CSP stricte + HSTS nginx | ⏳ différé volontairement (documenté dans `nginx-spa.conf`) |
| 7 | Hérité de l'audit API : index unique `token` (C6), helmet, décision JWT/CAPTCHA sur `send-contract` (C5) | ⏳ côté API — cf. audit séparé |

## Ce qui est sain (constat global)

- **Zéro marqueur TODO/FIXME** laissé en vrac (grep sur les deux repos) ; les corrections d'hier sont **commentées avec leur motivation** — la base de code se lit comme un journal de remédiation, rare et précieux.
- `tsc --noEmit` **0 erreur**, `vite build` ✓, arbres git propres.
- Store réactif, fetcher typé avec gestion d'erreurs centralisée, notifications avec cleanup, dialogs composés — le socle est sain.
- docker-compose racine : dev/prod séparés, secrets obligatoires (`:?`), healthcheck DB.

*Généré par audit agent — chaque finding vérifié par lecture directe ou commande exécutée le 07/11/2026. Fichier non committé — à relire avant commit.*
