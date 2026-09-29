(function (g) {
  "use strict";
  if (g.__THRONE_SWARM__) return;
  g.__THRONE_SWARM__ = true;
  var NAMES = [
    { id: "FAMILY", file: "family-worker", interval: 4000, duty: "cover each House member in turn" },
    { id: "PRAYER", file: "prayer-worker", interval: 6000, duty: "rotate house prayer lines" },
    { id: "COVENANT", file: "covenant-worker", interval: 15000, duty: "Mwari ndi Mwari. Zvapera." },
    { id: "AUDIT", file: "audit-worker", interval: 8000, duty: "append integrity ticks" },
    { id: "WATCH", file: "watch-worker", interval: 5000, duty: "health pulse" },
    { id: "THREAT", file: "threat-worker", interval: 7000, duty: "modelled risk sample" },
    { id: "CLOAK", file: "cloak-worker", interval: 9000, duty: "reduce exposure score" },
    { id: "DECOY", file: "decoy-worker", interval: 11000, duty: "publish a harmless decoy state" },
    { id: "DISCOVERY", file: "discovery-worker", interval: 10000, duty: "scan local modules" },
    { id: "GRAPH", file: "graph-worker", interval: 12000, duty: "walk bloodline edges" },
    { id: "EVOLVE", file: "evolve-worker", interval: 14000, duty: "propose cover strategy only" },
    { id: "PULSE", file: "pulse-worker", interval: 3300, duty: "77-99-33 heartbeat" }
  ];
  var roster = {}, running = false, feed = [];
  function now() { return new Date().toLocaleTimeString(); }
  function familyNames() {
    var list = g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : [];
    return list.length ? list.map(function (m) { return m.name; }) : ["House of Masawi"];
  }
  function note(type, msg) {
    feed.unshift({ t: now(), type: type, msg: msg }); if (feed.length > 40) feed.pop();
    if (g.ChirombeThrone && g.ChirombeThrone.log) g.ChirombeThrone.log(type, msg);
    if (g.ChirombeThrone && g.ChirombeThrone.workers) {
      g.ChirombeThrone.workers.tasks += 1; g.ChirombeThrone.workers.done += 1;
      g.ChirombeThrone.workers.active = NAMES.filter(function (n) { return roster[n.id] && roster[n.id].status === "ONLINE"; }).length;
    }
    paint();
  }
  function tick(spec) {
    var slot = roster[spec.id]; if (!slot || slot.status !== "ONLINE") return;
    slot.ticks += 1; slot.last = now();
    var people = familyNames(); var person = people[slot.ticks % people.length]; var msg = spec.id + " tick " + slot.ticks;
    if (spec.id === "FAMILY") msg = "cover " + person;
    if (spec.id === "PRAYER") msg = "For " + person + " — Mwari ndi Mwari";
    if (spec.id === "COVENANT") msg = "Mwari ndi Mwari. Zvapera. · seam holds · tick " + slot.ticks;
    if (spec.id === "AUDIT") msg = "integrity ok · " + slot.ticks;
    if (spec.id === "WATCH") msg = "watchdog pulse · matrix 77-99-33";
    if (spec.id === "THREAT") msg = "modelled risk " + (0.08 + (slot.ticks % 7) / 100).toFixed(2);
    if (spec.id === "CLOAK") msg = "exposure damped for " + person;
    if (spec.id === "DECOY") msg = "decoy state published";
    if (spec.id === "DISCOVERY") msg = "modules: bus, protect, liturgy, swarm";
    if (spec.id === "GRAPH") msg = "edge " + person;
    if (spec.id === "EVOLVE") msg = "propose REINFORCE — no blind deploy";
    if (spec.id === "PULSE") msg = "77 · 99 · 33";
    slot.msg = msg; note(spec.id, msg);
  }
  function start() {
    running = true;
    NAMES.forEach(function (spec) {
      if (roster[spec.id] && roster[spec.id].timer) clearInterval(roster[spec.id].timer);
      roster[spec.id] = { id: spec.id, file: spec.file, duty: spec.duty, status: "ONLINE", ticks: 0, last: now(), msg: "armed", timer: setInterval(function () { tick(spec); }, spec.interval) };
      tick(spec);
    });
    if (g.ChirombeThrone && g.ChirombeThrone.workers) g.ChirombeThrone.workers.active = 12;
    paint();
  }
  function stop() {
    running = false;
    NAMES.forEach(function (spec) {
      var slot = roster[spec.id];
      if (slot && slot.timer) clearInterval(slot.timer);
      if (slot) { slot.status = "IDLE"; slot.timer = null; }
    });
    if (g.ChirombeThrone && g.ChirombeThrone.workers) g.ChirombeThrone.workers.active = 0;
    paint();
  }
  function pulse() { NAMES.forEach(tick); }
  function paint() {
    var box = document.getElementById("swarm-grid");
    var live = document.getElementById("swarm-live");
    var count = document.getElementById("swarm-count");
    var online = NAMES.filter(function (n) { return roster[n.id] && roster[n.id].status === "ONLINE"; }).length;
    if (count) count.textContent = online + " / 12";
    if (box) {
      box.innerHTML = "";
      NAMES.forEach(function (spec) {
        var slot = roster[spec.id] || { status: "IDLE", ticks: 0, msg: spec.duty };
        var card = document.createElement("div"); card.className = "stat";
        card.innerHTML = "<span>" + spec.id + " · " + slot.status + "</span><strong>" + slot.ticks + "</strong><div class=\"muted\">" + (slot.msg || spec.duty) + "</div>";
        box.appendChild(card);
      });
    }
    if (live) {
      live.innerHTML = "";
      feed.slice(0, 16).forEach(function (row) {
        var el = document.createElement("div"); el.textContent = row.t + "  " + row.type + "  " + row.msg; live.appendChild(el);
      });
    }
  }
  g.CHIROMBE_SWARM = { start: start, stop: stop, pulse: pulse, status: function () { return { running: running, online: NAMES.filter(function (n) { return roster[n.id] && roster[n.id].status === "ONLINE"; }).length }; } };
  if (g.ChirombeBus) {
    g.ChirombeBus.registerCommand("swarm.start", start, { subsystem: "swarm" });
    g.ChirombeBus.registerCommand("swarm.stop", stop, { subsystem: "swarm" });
    g.ChirombeBus.registerCommand("swarm.pulse", pulse, { subsystem: "swarm" });
  }
  function bind() {
    var go = document.getElementById("swarm-go"); var halt = document.getElementById("swarm-stop"); var once = document.getElementById("swarm-pulse");
    if (go) go.onclick = start; if (halt) halt.onclick = stop; if (once) once.onclick = pulse; paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
