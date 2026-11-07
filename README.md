# Kiné de poche — app web (app-kinedpoche)

SPA **SolidJS + Vite** pour la création et la signature de contrats entre kinésithérapeutes : PDF AcroForm pré-rempli, signatures au doigt/crayon, envoi par email, persistance locale des contrats (invités) et en base (comptes).

> Ce repo fait partie du monorepo kinedpoche : l'API vit dans `../api-kinedpoche`, l'orchestration Docker dans `../docker-compose.yml`.

## Stack

- **SolidJS 1.9** + `@solidjs/router`, TypeScript
- **Vite 5** + `vite-plugin-pwa` (service worker `injectManifest`, workbox)
- **Tailwind CSS** en build-time (`tailwind.config.js` + `postcss.config.js`, contenu scanné dans `src/**`) — l'ancien script CDN runtime a été retiré le 07/11/2026 (prod non supportée par le Play CDN, styles perdus hors-ligne)
- **pdfjs-dist** (rendu canvas + extraction des champs AcroForm), **pdf-lib** (génération du PDF signé), **signature_pad** (capture des signatures)

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur Vite (http://localhost:5173) |
| `npm run build` | build de prod (vite build + génération du SW + precache) |

Le stack complet (api + web + postgres) se lance depuis la racine du monorepo :

```bash
docker compose up -d          # dev (web:5173, api:3001)
docker compose --profile prod up -d --build   # images de prod (web:3000, api:3002)
```

## Configuration

Variables d'environnement (`.env`, surchargées par le compose racine) :

```env
# URL complète de l'API backend (optionnel)
# Si non défini, l'application utilise automatiquement: http://api.{host}/api
VITE_HOST=http://localhost:3001/api
```

> **Note de sécurité (à jour 07/11/2026)** : le JWT de session vit en **sessionStorage**
> (purge à la fermeture de l'onglet, jamais dans le JSON persisté) — la note précédente
> qui le plaçait en localStorage est obsolète depuis le correctif F2 du 06/11.

## Architecture rapide

```
src/
├── pages/          Home, Login, Register + PageWrapper (layout + ?signe-back=)
├── components/
│   ├── ContractDialog/     dialog d'édition : accordéons (KineFields fusionné),
│   │                       prévisualisation PDF, envoi email, Signatures/
│   ├── ContractEditor/     rendu canvas (PDFCanvas), champs overlay, CTA save/download
│   ├── dialog/            DialogWrapper générique + Overlay/Confirmation/ReportBug
│   ├── table/ dialog/ inputs/ buttons/ notification/ navbar/   (bibliothèque réutilisable)
├── services/       fetcher typé (auth, contract, mail) — 401 → ApiError + logout
├── utils/          store réactif Solid (store.service), PDFTool (singleton PDF),
│                   notifications, mapping champs PDF (pdf-field-mapping.config.ts)
└── const.data.ts   signaux globaux (loggedIn dérivé, loadContract, signeBack)
public/sw.js        service worker workbox : precache + NavigationRoute SPA offline
```

## Déploiement

CI GitHub (`.github/workflows/action.yml`) : build + déploiement FTP **sur push main uniquement** (`local-dir: dist/` ; les PR ne déclenchent que le build de validation).
