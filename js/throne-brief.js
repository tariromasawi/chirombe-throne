(function (g) {
  "use strict";
  if (g.__THRONE_BRIEF__) return;
  g.__THRONE_BRIEF__ = true;
  var CAPS = [
    { id: "index", phase: "1", name: "Clean index", test: function () { return document.querySelectorAll("html").length === 1 && !document.getElementById("hidden-boot"); } },
    { id: "liturgy", phase: "2", name: "Living liturgy", test: function () { return !!(g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.status); } },
    { id: "swarm", phase: "3", name: "Worker swarm", test: function () { return !!(g.CHIROMBE_SWARM && g.CHIROMBE_SWARM.status); } },
    { id: "graph", phase: "4", name: "Lineage graph", test: function () { return !!(g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.status); } },
    { id: "join", phase: "5", name: "Liturgy ↔ graph", test: function () { return !!(g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulseName && g.CHIROMBE_LITURGY); } },
    { id: "watch", phase: "6", name: "Night Watch", test: function () { return !!(g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.status); } },
    { id: "keep", phase: "7", name: "Offline keep", test: function () { return !!(g.CHIROMBE_KEEP && g.CHIROMBE_KEEP.status); } },
    { id: "seal", phase: "8", name: "House Seal", test: function () { return !!(g.CHIROMBE_SEAL && g.CHIROMBE_SEAL.issue); } }
  ];
  function live() {
    var family = g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : [];
    var liturgy = g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.status ? g.CHIROMBE_LITURGY.status() : {};
    var swarm = g.CHIROMBE_SWARM && g.CHIROMBE_SWARM.status ? g.CHIROMBE_SWARM.status() : {};
    var watch = g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.status ? g.CHIROMBE_WATCH.status() : {};
    var graph = g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.status ? g.CHIROMBE_GRAPH.status() : {};
    var keep = g.CHIROMBE_KEEP && g.CHIROMBE_KEEP.status ? g.CHIROMBE_KEEP.status() : {};
    var seal = g.CHIROMBE_SEAL && g.CHIROMBE_SEAL.last ? g.CHIROMBE_SEAL.last() : null;
    return { family: family.length, liturgy: liturgy.completed || 0, swarm: swarm.online || 0, watch: watch.armed ? "ARMED" : "SLEEP", graph: graph.nodes || 0, keep: keep.registered ? "CACHED" : "NONE", seal: seal ? "ISSUED" : "NONE" };
  }
  function paint() {
    var grid = document.getElementById("brief-caps"); var stats = live(); var pass = 0;
    if (grid) {
      grid.innerHTML = "";
      CAPS.forEach(function (cap) {
        var ok = false; try { ok = !!cap.test(); } catch (e) { ok = false; } if (ok) pass += 1;
        var card = document.createElement("div"); card.className = "stat";
        card.innerHTML = "<span>PHASE " + cap.phase + " · " + (ok ? "LIVE" : "MISSING") + "</span><strong>" + cap.name + "</strong>";
        grid.appendChild(card);
      });
    }
    var map = { "brief-pass": pass + " / 8", "brief-family": String(stats.family), "brief-liturgy": String(stats.liturgy), "brief-swarm": String(stats.swarm), "brief-watch": stats.watch, "brief-graph": String(stats.graph), "brief-keep": stats.keep, "brief-seal": stats.seal };
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = map[id]; });
    var story = document.getElementById("brief-story");
    if (story) story.textContent = "CHIROMBE-THRONE House Briefing\nMwari ndi Mwari · 77-99-33\n\nThis working copy was built so the glued Chirombe index would not have to be fought.\nThe original repo remains the archive. This page is the live House.\n\nCapabilities live: " + pass + " of 8\nHouse members loaded: " + stats.family + "\nLiturgy spoken: " + stats.liturgy + "\nSwarm online: " + stats.swarm + "\nNight Watch: " + stats.watch + "\nGraph nodes: " + stats.graph + "\nOffline keep: " + stats.keep + "\nHouse Seal: " + stats.seal + "\n\nProtection here is computational cover and remembrance.\nIt is not a physical guarantee.";
  }
  g.CHIROMBE_BRIEF = { paint: paint, caps: CAPS };
  if (g.ChirombeBus) g.ChirombeBus.registerCommand("briefing", paint, { subsystem: "brief" });
  function bind() { var go = document.getElementById("brief-go"); if (go) go.onclick = paint; paint(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
