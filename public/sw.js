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

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// Offline SPA : navigation manquée → app pré-cachée (jamais pour l'API)
workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(
        workbox.precaching.createHandlerBoundToURL('/index.html'),
        { denylist: [/^\/api\//] }
    )
);

// Mise à jour automatique du Service Worker
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
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
