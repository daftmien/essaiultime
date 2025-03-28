const CACHE_NAME = "pwa-cache-v9";

// Liste des fichiers essentiels à mettre en cache
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/main.css",
    "/js/main.js",
    "/favicon.ico" // Ajout de l'icône pour éviter l'erreur 404
];

// Installation du Service Worker et mise en cache des fichiers essentiels
self.addEventListener("install", event => {
    console.log("📥 Installation du Service Worker...");
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("✅ Mise en cache des fichiers de base...");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activation du Service Worker et suppression des anciens caches
self.addEventListener("activate", event => {
    console.log("✅ Activation du Service Worker et suppression des anciens caches...");
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cache => cache !== CACHE_NAME)
                .map(cache => caches.delete(cache))
            );
        })
    );
    self.clients.claim();
});

// Interception des requêtes réseau et récupération depuis le cache
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => {
            if (event.request.destination === "document") {
                return caches.match("/index.html"); // Fallback sur la page d'accueil en mode hors-ligne
            }
        })
    );
});
