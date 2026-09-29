(function (g) {
  "use strict";
  if (g.__THRONE_GRAPH__) return;
  g.__THRONE_GRAPH__ = true;
  var canvas, ctx, nodes = [], edges = [], packets = [], selected = null;
  function family() { return (g.ChirombeThrone && g.ChirombeThrone.getFamily) ? g.ChirombeThrone.getFamily() : []; }
  function shortName(name) { return String(name || "").replace(/^HRH\s+(Saint\s+)?/, "").replace(/\s+Masawi$/, "").split(" ")[0]; }
  function ringFor(m) {
    if (m.generation === "great-great-grandfather") return 0;
    if (m.generation === "great-grandfather") return 1;
    if (m.generation === "grandfather" || m.generation === "grandmother") return 2;
    if (m.generation === "father" || m.generation === "mother") return 3;
    if (m.generation === "self") return 4;
    if (m.generation === "son" || m.generation === "adopted-nephew-son" || m.generation === "sibling") return 5;
    if (m.generation === "house") return 6;
    return 7;
  }
  function colorFor(m) {
    if (m.role === "CORE") return "#e5c46a";
    if (m.role === "HEIR") return "#6dffb2";
    if (m.remembrance || m.role === "SPIRIT") return "#b9f7ff";
    if (m.role === "PARENT") return "#9be7c4";
    return "#7ea89a";
  }
  function build() {
    var list = family(); if (!list.length) return;
    nodes = list.map(function (m) {
      return { id: m.id, name: m.name, label: shortName(m.name), role: m.role, gen: m.generation, remembrance: !!m.remembrance, ring: ringFor(m), angle: 0, x: 0, y: 0, r: m.role === "CORE" ? 18 : 11, color: colorFor(m), pulse: 0 };
    });
    var buckets = {};
    nodes.forEach(function (n) { buckets[n.ring] = buckets[n.ring] || []; buckets[n.ring].push(n); });
    Object.keys(buckets).forEach(function (rk) { buckets[rk].forEach(function (n, i) { n.angle = (Math.PI * 2 * i) / buckets[rk].length - Math.PI / 2; }); });
    function find(part) { return nodes.filter(function (n) { return (n.id || "").indexOf(part) !== -1; })[0]; }
    edges = [];
    function link(a, b, kind) { if (a && b) edges.push({ a: a, b: b, kind: kind || "blood" }); }
    link(find("CHIROMBE"), find("MAKWENGURA"), "line");
    link(find("MAKWENGURA"), find("GF-MASAWI"), "line");
    link(find("GF-MASAWI"), find("GM-MASARURA"), "union");
    link(find("GF-MASAWI"), find("F-SABASTIAN"), "line");
    link(find("GM-MASARURA"), find("M-RISTO"), "line");
    link(find("F-SABASTIAN"), find("M-RISTO"), "union");
    link(find("F-SABASTIAN"), find("SELF-TARIRO"), "line");
    link(find("M-RISTO"), find("SELF-TARIRO"), "line");
    var core = find("SELF-TARIRO");
    nodes.forEach(function (n) {
      if (!core) return;
      if (n.role === "HEIR" || n.role === "SIBLING" || n.role === "SPIRIT") link(core, n, n.role === "SPIRIT" ? "remembrance" : "cover");
      if (n.role === "HOUSE" || n.role === "DESCENDANT") link(core, n, "house");
    });
  }
  function layout() {
    if (!canvas) return;
    var cx = canvas.width / 2, cy = canvas.height / 2, maxR = Math.min(cx, cy) - 36;
    nodes.forEach(function (n) {
      if (n.role === "CORE") { n.x = cx; n.y = cy; return; }
      var rad = ((n.ring + 1) / 8) * maxR;
      n.x = cx + Math.cos(n.angle) * rad; n.y = cy + Math.sin(n.angle) * rad;
    });
  }
  function emitCover(fromId) {
    var starts = fromId ? nodes.filter(function (n) { return n.id === fromId; }) : nodes.filter(function (n) { return n.role === "CORE"; });
    if (!starts.length) starts = nodes.slice(0, 1);
    starts.forEach(function (start) {
      edges.forEach(function (e) { if (e.a === start || e.b === start) packets.push({ e: e, p: e.a === start ? 0 : 1, dir: e.a === start ? 1 : -1, life: 1 }); });
      start.pulse = 1;
    });
  }
  function draw() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(2,6,8,0.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    edges.forEach(function (e) {
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y);
      ctx.strokeStyle = e.kind === "remembrance" ? "rgba(185,247,255,0.28)" : e.kind === "union" ? "rgba(229,196,106,0.35)" : "rgba(109,255,178,0.28)";
      ctx.lineWidth = e.kind === "line" ? 1.6 : 1.1; ctx.stroke();
    });
    packets = packets.filter(function (pk) { return pk.life > 0; });
    packets.forEach(function (pk) {
      pk.p += pk.dir * 0.012; pk.life -= 0.006;
      var p = Math.max(0, Math.min(1, pk.p));
      ctx.beginPath(); ctx.arc(pk.e.a.x + (pk.e.b.x - pk.e.a.x) * p, pk.e.a.y + (pk.e.b.y - pk.e.a.y) * p, 3.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(109,255,178,0.95)"; ctx.fill();
    });
    nodes.forEach(function (n) {
      if (n.pulse > 0) n.pulse -= 0.02;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.pulse * 10, 0, Math.PI * 2); ctx.strokeStyle = n.color; ctx.globalAlpha = 0.25 + n.pulse * 0.5; ctx.stroke(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = selected === n.id ? n.color : "rgba(5,8,12,0.9)"; ctx.fill(); ctx.strokeStyle = n.color; ctx.lineWidth = n.role === "CORE" ? 2 : 1; ctx.stroke();
      ctx.fillStyle = "#e8fff4"; ctx.font = (n.role === "CORE" ? "11px" : "10px") + " ui-sans-serif, system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "top"; ctx.fillText(n.label, n.x, n.y + n.r + 4);
    });
    requestAnimationFrame(draw);
  }
  function hit(x, y) {
    for (var i = 0; i < nodes.length; i++) { var n = nodes[i], dx = x - n.x, dy = y - n.y; if (dx * dx + dy * dy <= (n.r + 8) * (n.r + 8)) return n; }
    return null;
  }
  function resize() {
    if (!canvas) return;
    var box = canvas.parentElement;
    canvas.width = Math.max(320, (box && box.clientWidth) || 640);
    canvas.height = Math.max(360, Math.min(620, window.innerHeight * 0.62));
    layout();
  }
  function paintMeta(n) {
    var el = document.getElementById("graph-focus"); if (!el) return;
    el.textContent = n ? (n.name + " · " + n.gen + " · " + n.role + (n.remembrance ? " · REMEMBERED" : " · PROTECTED")) : "Tap a name. Cover travels the bloodline edges.";
  }
  function findNamed(name, id) {
    if (id) { var byId = nodes.filter(function (n) { return n.id === id; })[0]; if (byId) return byId; }
    var needle = String(name || "").toLowerCase(); if (!needle) return null;
    return nodes.filter(function (n) { return (n.name || "").toLowerCase().indexOf(needle) !== -1 || needle.indexOf((n.label || "").toLowerCase()) !== -1; })[0] || null;
  }
  function pulseName(name, id) {
    var n = findNamed(name, id);
    if (n) { selected = n.id; paintMeta(n); emitCover(n.id); return n; }
    emitCover(); return null;
  }
  function bind() {
    canvas = document.getElementById("bloodline-graph"); if (!canvas) return;
    ctx = canvas.getContext("2d"); build(); resize();
    canvas.addEventListener("click", function (ev) {
      var rect = canvas.getBoundingClientRect();
      var n = hit(ev.clientX - rect.left, ev.clientY - rect.top); if (!n) return;
      selected = n.id; paintMeta(n); emitCover(n.id);
      if (g.ChirombeBus) g.ChirombeBus.executeCommand("protect family");
      if (g.ChirombeThrone) g.ChirombeThrone.log("GRAPH", "cover pulse · " + n.name);
    });
    window.addEventListener("resize", resize);
    var go = document.getElementById("graph-pulse"); if (go) go.onclick = function () { emitCover(); };
    draw();
    if (!nodes.length) setTimeout(function () { build(); layout(); }, 400);
  }
  g.CHIROMBE_GRAPH = { rebuild: function () { build(); resize(); layout(); }, pulse: function (id) { emitCover(id); }, pulseName: pulseName, status: function () { return { nodes: nodes.length, edges: edges.length, packets: packets.length }; } };
  if (g.ChirombeBus) g.ChirombeBus.registerCommand("graph.pulse", function () { emitCover(); }, { subsystem: "graph" });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
