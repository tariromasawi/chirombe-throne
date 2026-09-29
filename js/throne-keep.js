(function (g) {
  "use strict";
  if (g.__THRONE_KEEP__) return;
  g.__THRONE_KEEP__ = true;
  var state = { registered: false, scope: "", online: navigator.onLine, cached: 0, error: "" };
  function paint() {
    var pill = document.getElementById("keep-pill");
    var st = document.getElementById("keep-state");
    var net = document.getElementById("keep-net");
    var n = document.getElementById("keep-cached");
    var sc = document.getElementById("keep-scope");
    var note = document.getElementById("keep-note");
    if (pill) pill.textContent = state.registered ? (state.online ? "CACHED" : "OFFLINE") : "NONE";
    if (st) st.textContent = state.registered ? "KEEP ARMED" : "NO WORKER";
    if (net) net.textContent = state.online ? "ONLINE" : "OFFLINE";
    if (n) n.textContent = String(state.cached);
    if (sc) sc.textContent = state.scope || "—";
    if (note) note.textContent = state.error ? state.error : (state.registered ? "House page is cached in this browser. Close the net and reload — the Throne should still open." : "Service worker not registered yet. Use HTTPS (GitHub Pages) and tap Arm keep.");
  }
  function countCache() {
    if (!("caches" in g)) return Promise.resolve();
    return caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.open(k).then(function (c) { return c.keys(); }); }));
    }).then(function (lists) {
      state.cached = lists.reduce(function (sum, list) { return sum + list.length; }, 0);
      paint();
    }).catch(function () {});
  }
  function register() {
    if (!("serviceWorker" in navigator)) { state.error = "This browser does not support service workers."; paint(); return Promise.resolve(false); }
    return navigator.serviceWorker.register("sw.js").then(function (reg) {
      state.registered = true; state.scope = reg.scope; state.error = "";
      if (g.ChirombeThrone) g.ChirombeThrone.log("KEEP", "offline keep registered · " + reg.scope);
      paint(); return countCache();
    }).catch(function (err) {
      state.error = String(err && err.message || err);
      if (g.ChirombeThrone) g.ChirombeThrone.log("KEEP", "register failed · " + state.error);
      paint(); return false;
    });
  }
  function drop() {
    var jobs = [];
    if ("serviceWorker" in navigator) jobs.push(navigator.serviceWorker.getRegistrations().then(function (regs) { return Promise.all(regs.map(function (r) { return r.unregister(); })); }));
    if ("caches" in g) jobs.push(caches.keys().then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); }));
    return Promise.all(jobs).then(function () {
      state.registered = false; state.cached = 0; state.scope = "";
      if (g.ChirombeThrone) g.ChirombeThrone.log("KEEP", "offline keep cleared");
      paint();
    });
  }
  g.CHIROMBE_KEEP = { register: register, drop: drop, status: function () { return state; } };
  if (g.ChirombeBus) {
    g.ChirombeBus.registerCommand("keep.arm", register, { subsystem: "keep" });
    g.ChirombeBus.registerCommand("keep.drop", drop, { subsystem: "keep" });
  }
  window.addEventListener("online", function () { state.online = true; paint(); });
  window.addEventListener("offline", function () { state.online = false; paint(); });
  function bind() {
    var go = document.getElementById("keep-go"); var halt = document.getElementById("keep-drop");
    if (go) go.onclick = register; if (halt) halt.onclick = drop;
    paint(); register();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
