const CACHE_NAME = "pwa-cache-v12";
const AUDIO_CACHE_NAME = "audio-cache-v12";
const AUDIO_FILES_PATH = "/Jeu_fusionne/audios/";

// Liste des fichiers essentiels à mettre en cache
const FILES_TO_CACHE = [
    "/Jeu_fusionne/",
    "/Jeu_fusionne/index.html",
    "/Jeu_fusionne/manifest.json",
    "/Jeu_fusionne/css/main.css",
    "/Jeu_fusionne/js/main.js",
    "/Jeu_fusionne/favicon.ico"
];

// Installation du Service Worker et mise en cache automatique des fichiers audio
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("📥 Mise en cache des fichiers essentiels...");
            return cache.addAll(FILES_TO_CACHE);
        }).then(() => {
            return fetch(AUDIO_FILES_PATH).then(response => response.text()).then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const audioFiles = Array.from(doc.querySelectorAll("a"))
                    .map(a => a.href)
                    .filter(href => href.endsWith(".mpga"))
                    .map(href => new URL(href).pathname);
                return caches.open(AUDIO_CACHE_NAME).then(cache => {
                    console.log("🎵 Mise en cache des fichiers audio...");
                    return cache.addAll(audioFiles);
                });
            }).catch(err => console.error("❌ Erreur lors de la récupération des fichiers audio :", err));
        })
    );
    self.skipWaiting();
});

// Activation et suppression des anciens caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cache => cache !== CACHE_NAME && cache !== AUDIO_CACHE_NAME)
                .map(cache => caches.delete(cache))
            );
        })
    );
    self.clients.claim();
});

// Interception des requêtes et récupération depuis le cache
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
                return caches.match("/Jeu_fusionne/index.html");
            } else if (event.request.destination === "audio") {
                console.warn("🎵 Fichier audio non trouvé en ligne, tentative depuis le cache...");
                return caches.match(event.request);
            }
        })
    );
});
