const CACHE_NAME = "pwa-cache-v17";
const AUDIO_CACHE_NAME = "audio-cache-v17";
const AUDIO_FILES_PATH = "/Jeu_fusionne/audios/";

// 📌 Fonction pour récupérer tous les fichiers audio dynamiquement
async function cacheAudioFiles() {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    try {
        const response = await fetch(AUDIO_FILES_PATH, { mode: 'no-cors' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const text = await response.text();
        const audioFiles = text.match(/href="([^"]+\.mpga)"/g)
            ?.map(match => match.replace('href="', '').replace('"', ''))
            .map(filename => new URL(filename, AUDIO_FILES_PATH).pathname) || [];

        console.log("🎵 Fichiers audio détectés :", audioFiles);

        await cache.addAll(audioFiles);
    } catch (err) {
        console.error("❌ Erreur lors de la mise en cache des fichiers audio :", err);
    }
}

// 📌 Installation du Service Worker avec mise en cache immédiate
self.addEventListener("install", event => {
    console.log("📥 Installation du Service Worker - Mise en cache automatique des fichiers audio...");
    event.waitUntil(cacheAudioFiles());
    self.skipWaiting(); // Force l'installation immédiate
});

// 📌 Activation du Service Worker et suppression des anciens caches
self.addEventListener("activate", event => {
    console.log("✅ Activation du Service Worker et suppression des anciens caches...");
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

// 📌 Interception des requêtes pour servir les fichiers depuis le cache
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(AUDIO_CACHE_NAME).then(cache => {
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
