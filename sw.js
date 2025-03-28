<<<<<<< HEAD
const CACHE_NAME = "pwa-cache-v8";

// Liste des fichiers essentiels à mettre en cache
const ASSETS_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/main.css",
    "/js/main.js",
    "/favicon.ico" // Ajoute l'icône pour éviter l'erreur 404
];

// Fonction de mise en cache sécurisée
async function cacheAssets(cache, assets) {
    for (const asset of assets) {
        try {
            const response = await fetch(asset, { cache: "no-store" }); // Empêche la mise en cache navigateur
            if (!response.ok) throw new Error(`❌ Échec du chargement : ${asset} (${response.status})`);
            await cache.put(asset, response);
            console.log(`✅ Fichier mis en cache : ${asset}`);
        } catch (error) {
            console.warn(error.message); // Affiche seulement un warning et continue
        }
    }
}

// Installation du Service Worker
self.addEventListener("install", (event) => {
    console.log("🔹 Installation du Service Worker...");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("📥 Mise en cache des fichiers...");
            return cacheAssets(cache, ASSETS_TO_CACHE);
        })
    );
});

// Activation du Service Worker et suppression des anciens caches
self.addEventListener("activate", (event) => {
    console.log("✅ Service Worker activé !");
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cache) => cache !== CACHE_NAME)
                    .map((cache) => caches.delete(cache))
            );
        })
    );
});

// Interception des requêtes réseau et récupération depuis le cache
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => {
            return caches.match("/index.html"); // Renvoie la page d'accueil en cas d'erreur réseau
        })
    );
});
=======
 
// Nom du cache
const CACHE_NAME = "pwa-cache-v3";

// Installation du Service Worker et pré-chargement en cache
self.addEventListener("install", event => {
    console.log("📥 Service Worker installé - Prêt pour la mise en cache dynamique !");
    self.skipWaiting();
});

// Activation et suppression des anciens caches (mais conservation des fichiers déjà en cache)
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log("🗑 Suppression de l'ancien cache :", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interception des requêtes et mise en cache dynamique + conservation après fermeture
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request).then(networkResponse => {
                    if (networkResponse && networkResponse.ok) {
                        cache.put(event.request, networkResponse.clone());
                        console.log(`✅ Fichier ajouté au cache : ${event.request.url}`);
                    }
                    return networkResponse;
                });
            });
        }).catch(() => {
            // Fallback pour assurer le mode hors-ligne total
            if (event.request.destination === "document" || event.request.mode === "navigate") {
                console.warn("📄 Fallback : Chargement de index.html hors-ligne");
                return caches.match("/index.html");
            } else if (event.request.destination === "image") {
                console.warn("🖼 Fallback : Chargement d'une image depuis le cache :", event.request.url);
                return caches.match(event.request.url);
            } else if (event.request.destination === "audio") {
                console.warn("🎵 Fallback : Chargement d'un fichier audio depuis le cache :", event.request.url);
                return caches.match(event.request.url);
            } else if (event.request.destination === "script") {
                console.warn("📜 Fallback : Chargement d'un script JS depuis le cache :", event.request.url);
                return caches.match(event.request.url);
            }
        })
    );
});

// Vérification après installation pour voir les fichiers réellement en cache
self.addEventListener("message", event => {
    if (event.data && event.data.type === "CHECK_CACHE") {
        caches.open(CACHE_NAME).then(cache => {
            cache.keys().then(keys => {
                console.log("🔍 Fichiers actuellement en cache :", keys.map(request => request.url));
            });
        });
    }
});
>>>>>>> c9d5837 (Initialisation du dépôt avec les fichiers mis à jour)
