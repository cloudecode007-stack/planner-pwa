const CACHE_NAME = 'planner-v2';
const BASE_PATH = '/planner-pwa';

const urlsToCache = [
    `${BASE_PATH}/`,
    `${BASE_PATH}/index.html`,
    `${BASE_PATH}/style.css`,
    `${BASE_PATH}/script.js`,
    `${BASE_PATH}/manifest.json`,
    `${BASE_PATH}/icons/icon-192x192.png`,
    `${BASE_PATH}/icons/icon-512x512.png`
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('SW: Открыт кэш');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('SW: Ошибка кэширования:', err))
    );
    self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW: Активирован');
            return self.clients.claim();
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    // Игнорируем кросс-origin запросы
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request)
                    .then(response => {
                        // Проверяем валидность ответа
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('SW: Ошибка fetch:', error);
                        // Для навигации возвращаем index.html
                        if (event.request.mode === 'navigate') {
                            return caches.match(`${BASE_PATH}/index.html`);
                        }
                    });
            })
    );
});
