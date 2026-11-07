importScripts(
    'https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js'
);

// Service Worker kinedpoche — nettoyé (audit propreté 07/11, P3) :
// - retrait du boilerplate « widget PWABuilder » (updateWidget/updateName,
//   sans rapport avec l'app) ;
// - retrait du listener fetch custom qui DOUBLAIT les routes workbox :
//   pour chaque navigation/asset, respondWith était appelé deux fois →
//   InvalidStateError dans les logs SW, et le cache du bloc custom ne
//   s'écrivait jamais ;
// - retrait du handler activate qui supprimait TOUTES les caches sauf
//   pages/assets — y compris la cache workbox-precache, cassant le mode
//   offline juste après chaque activation ;
// - ajout du NavigationRoute SPA : offline, toute navigation manquée sert
//   l'app pré-cachée (les routes Solid /, /login, /register n'existent pas
//   côté serveur).

// NB : workbox injectManifest exige EXACTEMENT UNE occurrence de
// self.__WB_MANIFEST dans ce fichier — d'où la const unique.
const precacheManifest = self.__WB_MANIFEST || [];
workbox.precaching.precacheAndRoute(precacheManifest);

// Offline SPA : navigation manquée → app pré-cachée (jamais pour l'API).
// ⚠️ En DEV, vite sert ce fichier TEL QUEL : precacheManifest est alors vide
// et createHandlerBoundToURL('/index.html') LÈVERAIT (« URL not part of the
// precache manifest »), faisant crasher TOUT le service worker à
// l'installation — le navigateur gardait alors l'ancien SW et ses caches
// périmées (CSS d'avant la migration Tailwind resservi = app sans styles).
// Le NavigationRoute n'est posé qu'en présence du manifest injecté (build).
const precachedUrls = precacheManifest.map((entry) =>
    (typeof entry === 'string' ? entry : entry.url).replace(/^\//, '')
);
if (precachedUrls.includes('index.html')) {
    workbox.routing.registerRoute(
        new workbox.routing.NavigationRoute(
            workbox.precaching.createHandlerBoundToURL('/index.html'),
            { denylist: [/^\/api\//] }
        )
    );
}

// Mise à jour automatique du Service Worker
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Activation : purge des caches de l'ANCIEN SW (pages-cache / assets-cache
// peuvent contenir des assets d'avant la migration Tailwind du 07/11 — une
// requête en échec pouvait resservir le vieux CSS = app sans styles). Elles
// se repeuplent à la demande ; la cache precache (app shell) est préservée.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName === 'pages-cache' || cacheName === 'assets-cache') {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Stratégies de cache : assets statiques en NetworkFirst (priorité réseau)
workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' ||
                    request.destination === 'style' ||
                    request.destination === 'image',
    new workbox.strategies.NetworkFirst({
        cacheName: 'assets-cache',
        networkTimeoutSeconds: 2, // Timeout court pour les assets
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 heure
            }),
        ],
    })
);
