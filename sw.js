const KEEP = "chirombe-throne-keep-v7";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./css/throne.css",
  "./data/family.json",
  "./data/capabilities.json",
  "./js/throne-core.js",
  "./js/throne-audio.js",
  "./js/throne-liturgy.js",
  "./js/throne-swarm.js",
  "./js/throne-graph.js",
  "./js/throne-watch.js",
  "./js/throne-keep.js",
  "./js/throne-matrix.js",
  "./js/throne-ui.js"
];
self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(KEEP).then(function (cache) { return cache.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== KEEP; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(function (hit) {
    if (hit) return hit;
    return fetch(event.request).then(function (res) {
      if (!res || res.status !== 200 || res.type === "opaque") return res;
      var copy = res.clone();
      caches.open(KEEP).then(function (cache) { cache.put(event.request, copy); });
      return res;
    }).catch(function () {
      if (event.request.mode === "navigate") return caches.match("./index.html");
      return new Response("offline", { status: 503, statusText: "Offline keep" });
    });
  }));
});
