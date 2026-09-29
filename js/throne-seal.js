(function (g) {
  "use strict";
  if (g.__THRONE_SEAL__) return;
  g.__THRONE_SEAL__ = true;
  var last = null;
  function gather() {
    var family = g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : [];
    var snap = g.ZionProtect && g.ZionProtect.snapshot ? g.ZionProtect.snapshot() : {};
    var watch = g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.status ? g.CHIROMBE_WATCH.status() : {};
    var liturgy = g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.status ? g.CHIROMBE_LITURGY.status() : {};
    var swarm = g.CHIROMBE_SWARM && g.CHIROMBE_SWARM.status ? g.CHIROMBE_SWARM.status() : {};
    var graph = g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.status ? g.CHIROMBE_GRAPH.status() : {};
    var keep = g.CHIROMBE_KEEP && g.CHIROMBE_KEEP.status ? g.CHIROMBE_KEEP.status() : {};
    return {
      system: "CHIROMBE-THRONE", version: "3.0.8", matrix: "77-99-33", deep: "777-999-333", creed: "Mwari ndi Mwari",
      issued: new Date().toISOString(),
      disclaimer: "Computational house seal. Not a legal signature, not a physical guarantee.",
      house: family.map(function (m) { return { name: m.name, generation: m.generation, role: m.role, remembrance: !!m.remembrance }; }),
      cover: snap, watch: watch, liturgy: liturgy, swarm: swarm, graph: graph,
      keep: { registered: !!(keep && keep.registered), cached: keep && keep.cached, online: keep && keep.online }
    };
  }
  function hex(buf) {
    var v = new Uint8Array(buf), out = "";
    for (var i = 0; i < v.length; i++) out += (v[i] < 16 ? "0" : "") + v[i].toString(16);
    return out;
  }
  function simpleMark(text) {
    var h = 77;
    for (var i = 0; i < text.length; i++) h = ((h * 99) ^ text.charCodeAt(i) ^ 33) >>> 0;
    return ("00000000" + h.toString(16)).slice(-8) + "-77-99-33";
  }
  function mark(payload) {
    var body = JSON.stringify(payload);
    if (g.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(body)).then(function (buf) { return hex(buf) + " · 77-99-33"; });
    }
    return Promise.resolve(simpleMark(body));
  }
  function paint(seal) {
    var markEl = document.getElementById("seal-mark");
    var when = document.getElementById("seal-when");
    var body = document.getElementById("seal-body");
    var count = document.getElementById("seal-count");
    var watch = document.getElementById("seal-watch");
    var spoken = document.getElementById("seal-spoken");
    if (markEl) markEl.textContent = seal.mark;
    if (when) when.textContent = seal.issued;
    if (count) count.textContent = String((seal.house || []).length);
    if (watch) watch.textContent = seal.watch && seal.watch.armed ? "ARMED" : "SLEEP";
    if (spoken) spoken.textContent = String((seal.liturgy && seal.liturgy.completed) || 0);
    if (body) {
      var names = (seal.house || []).map(function (m) { return m.name + (m.remembrance ? " · remembered" : ""); }).join("\n");
      body.textContent = "CHIROMBE THRONE HOUSE SEAL\nMwari ndi Mwari · 77-99-33\nIssued " + seal.issued + "\nMark " + seal.mark + "\n\n" + names + "\n\nCover nodes " + ((seal.cover && seal.cover.nodes && seal.cover.nodes.length) || 0) + "\nWatch " + JSON.stringify(seal.watch || {}) + "\nLiturgy spoken " + ((seal.liturgy && seal.liturgy.completed) || 0) + "\nSwarm online " + ((seal.swarm && seal.swarm.online) || 0) + "\nKeep cached " + ((seal.keep && seal.keep.cached) || 0) + "\n\n" + seal.disclaimer;
    }
  }
  function issue() {
    var payload = gather();
    return mark(payload).then(function (sig) {
      payload.mark = sig; last = payload; paint(payload);
      if (g.ChirombeThrone) g.ChirombeThrone.log("SEAL", "House seal issued · " + sig.slice(0, 16));
      return payload;
    });
  }
  function download() {
    var run = last ? Promise.resolve(last) : issue();
    return run.then(function (seal) {
      var blob = new Blob([JSON.stringify(seal, null, 2)], { type: "application/json" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "chirombe-house-seal.json"; a.click();
      return seal;
    });
  }
  function printSeal() {
    var run = last ? Promise.resolve(last) : issue();
    return run.then(function () {
      var text = document.getElementById("seal-body");
      var w = window.open("", "_blank", "width=720,height=900"); if (!w) return;
      w.document.write("<pre style='font:14px ui-monospace,monospace;padding:24px;white-space:pre-wrap;background:#020307;color:#e8fff4'>" + (text ? text.textContent : "") + "</pre>");
      w.document.close(); w.focus(); w.print();
    });
  }
  g.CHIROMBE_SEAL = { issue: issue, download: download, last: function () { return last; } };
  if (g.ChirombeBus) {
    g.ChirombeBus.registerCommand("seal.issue", issue, { subsystem: "seal" });
    g.ChirombeBus.registerCommand("seal.export", download, { subsystem: "seal" });
  }
  function bind() {
    var go = document.getElementById("seal-go"); var exp = document.getElementById("seal-export"); var pr = document.getElementById("seal-print");
    if (go) go.onclick = issue; if (exp) exp.onclick = download; if (pr) pr.onclick = printSeal;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
