// 오프라인 지원 + 설치용 서비스워커
const CACHE = "translator-v14";
const ASSETS = ["./", "./index.html", "./install.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 번역 API 등 외부 요청은 그대로 통과

  if (req.mode === "navigate") {
    // HTML 화면은 네트워크 우선(항상 최신), 오프라인이면 캐시 사용
    e.respondWith(
      fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((ca) => ca.put(req, c)); return r; })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
  } else {
    // 그 외 파일(아이콘 등)은 캐시 우선
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
});
