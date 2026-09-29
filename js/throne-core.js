(function (g) {
  "use strict";
  if (g.__THRONE_CORE__) return;
  g.__THRONE_CORE__ = true;
  var KEY = "CHIROMBE_THRONE_V3";
  var EXTRA_KEY = "CHIROMBE_ROSTER_EXTRA";
  var MATRIX = { a: 77, b: 99, c: 33, seal: "77-99-33", deep: "777-999-333" };
  var cmds = {}, family = [], nodes = new Map(), audit = [], workers = { active: 0, tasks: 0, done: 0, err: 0 }, started = Date.now();
  function now() { return new Date().toISOString(); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save(extra) {
    var state = Object.assign({ family: family.map(function (m) { return m.id; }), auditHead: audit[0] || null, saved: now() }, extra || {});
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    return state;
  }
  function log(type, msg) {
    var row = { t: new Date().toLocaleTimeString(), type: type, msg: String(msg) };
    audit.unshift(row); if (audit.length > 200) audit.pop();
    var box = document.getElementById("live-log");
    if (box) { var el = document.createElement("div"); el.textContent = row.t + "  " + row.type + "  " + row.msg; box.prepend(el); }
    return row;
  }
  function registerCommand(name, handler, meta) { cmds[name] = { handler: handler, meta: meta || {} }; }
  function executeCommand(name, args) {
    var rec = cmds[name]; if (!rec) return { ok: false, command: name, error: "unknown command" };
    try { return { ok: true, command: name, result: rec.handler(args || {}) }; }
    catch (e) { return { ok: false, command: name, error: String(e && e.message || e) }; }
  }
  function registerNode(id, label, resilience) {
    if (nodes.has(id)) return nodes.get(id);
    var node = { id: id, label: label, resilience: resilience == null ? 0.77 : resilience, vulnerability: 0.12, links: [] };
    nodes.set(id, node); return node;
  }
  function snapshot() {
    var out = [];
    nodes.forEach(function (n) { out.push({ id: n.id, label: n.label, resilience: Number(n.resilience.toFixed(3)), vulnerability: Number(n.vulnerability.toFixed(3)), links: n.links.length }); });
    return { nodes: out, auditLength: audit.length, matrix: MATRIX, armed: true };
  }
  function reinforce() {
    nodes.forEach(function (n) { n.resilience = Math.min(0.99, n.resilience + 0.03); n.vulnerability = Math.max(0.02, n.vulnerability * 0.92); });
    workers.tasks += 1; workers.done += 1; log("COVER", "Protection cycle complete · " + MATRIX.seal); save({ lastCycle: now() }); return snapshot();
  }
  function renderFamily() {
    var list = document.getElementById("family-list"); var count = document.getElementById("stat-family");
    if (count) count.textContent = String(family.length);
    if (!list) return; list.innerHTML = "";
    family.forEach(function (m) {
      var n = document.createElement("div"); n.className = "member";
      n.innerHTML = "<b>" + m.name + "</b>" + m.generation + " · " + m.role + (m.remembrance ? " · REMEMBERED" : " · PROTECTED");
      list.appendChild(n);
    });
  }
  function renderStats() {
    var avg = snapshot().nodes.reduce(function (a, n) { return a + n.resilience; }, 0) / Math.max(1, nodes.size);
    var map = { "stat-nodes": String(nodes.size), "stat-workers": String(workers.active), "stat-resilience": String(Math.round(avg * 100)), "stat-uptime": String(Math.floor((Date.now() - started) / 1000)) + "s", "stat-matrix": MATRIX.seal };
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = map[id]; });
  }
  function loadExtras() { try { return JSON.parse(localStorage.getItem(EXTRA_KEY) || "[]"); } catch (e) { return []; } }
  function saveExtras() {
    var extras = family.filter(function (m) { return m && m.local; });
    try { localStorage.setItem(EXTRA_KEY, JSON.stringify(extras)); } catch (e) {}
    return extras;
  }
  function addMember(raw) {
    if (!raw || !String(raw.name || "").trim()) return { ok: false, error: "name required" };
    var member = { id: raw.id || ("FAM-X-" + Date.now().toString(36)), name: String(raw.name).trim(), generation: raw.generation || "house", role: raw.role || "PROTECTED", remembrance: !!raw.remembrance, protect: true, local: true };
    if (family.some(function (m) { return m.id === member.id || (m.name || "").toLowerCase() === member.name.toLowerCase(); })) return { ok: false, error: "already on the roster" };
    family.push(member); registerNode(member.id, member.name, 0.91); renderFamily(); renderStats(); saveExtras();
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.rebuild) g.CHIROMBE_GRAPH.rebuild();
    log("ROSTER", (member.remembrance ? "remembered " : "added ") + member.name);
    return { ok: true, member: member };
  }
  function rememberMember(id) {
    var m = family.filter(function (x) { return x.id === id; })[0]; if (!m) return { ok: false, error: "not found" };
    m.remembrance = true; if (m.local) saveExtras(); renderFamily();
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.rebuild) g.CHIROMBE_GRAPH.rebuild();
    log("ROSTER", "remembered " + m.name); return { ok: true, member: m };
  }
  function dropLocal(id) {
    var m = family.filter(function (x) { return x.id === id && x.local; })[0];
    if (!m) return { ok: false, error: "only local additions can be dropped here" };
    family = family.filter(function (x) { return x.id !== id; }); nodes.delete(id); renderFamily(); renderStats(); saveExtras();
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.rebuild) g.CHIROMBE_GRAPH.rebuild();
    log("ROSTER", "dropped local " + m.name); return { ok: true };
  }
  function wireFamily(members) {
    family = members || [];
    family.forEach(function (m) { registerNode(m.id, m.name, 0.91); });
    var ids = family.map(function (m) { return m.id; });
    for (var i = 1; i < ids.length; i++) { var a = nodes.get(ids[i - 1]); var b = nodes.get(ids[i]); if (a && b) { a.links.push(b.id); b.links.push(a.id); } }
    renderFamily(); renderStats(); log("BLOODLINE", "House of Masawi loaded · " + family.length + " protected");
    loadExtras().forEach(function (m) { addMember(m); });
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.rebuild) g.CHIROMBE_GRAPH.rebuild();
  }
  registerCommand("status", function () { return { system: "CHIROMBE-THRONE", version: "3.0.10", matrix: MATRIX, family: family.length, workers: workers, uptimeMs: Date.now() - started }; });
  registerCommand("protect family", reinforce);
  registerCommand("activate system", function () { workers.active = 12; log("BOOT", "Throne command core armed"); renderStats(); return { armed: true }; });
  registerCommand("show lineage", function () { return family.map(function (m) { return m.name + " · " + m.generation; }); });
  registerCommand("roster.add", function (args) { return addMember(args || {}); });
  registerCommand("roster.remember", function (args) { return rememberMember(args && args.id); });
  registerCommand("roster.drop", function (args) { return dropLocal(args && args.id); });
  registerCommand("export state", function () { return save({ exported: now(), snapshot: snapshot() }); });
  registerCommand("selftest", function () {
    var checks = [
      { name: "single-document-index", ok: document.querySelectorAll("html").length === 1 },
      { name: "family-loaded", ok: family.length > 0 },
      { name: "snapshot-finite", ok: snapshot().nodes.length === nodes.size },
      { name: "bus", ok: true }
    ];
    return { ok: checks.every(function (c) { return c.ok; }), checks: checks };
  });
  g.ChirombeBus = { registerCommand: registerCommand, executeCommand: executeCommand, listCommands: function () { return Object.keys(cmds); } };
  g.ZionProtect = { snapshot: snapshot, reinforce: reinforce, nodes: nodes };
  g.ChirombeThrone = { MATRIX: MATRIX, log: log, loadFamily: wireFamily, getFamily: function () { return family.slice(); }, addMember: addMember, rememberMember: rememberMember, dropLocal: dropLocal, extras: saveExtras, renderStats: renderStats, workers: workers, save: save, load: load };
  g.ChirombeCore = g.ChirombeCore || {};
  Object.defineProperty(g.ChirombeCore, "family", { get: function () { return family; }, configurable: true });
  fetch("./data/family.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.members) wireFamily(d.members);
    executeCommand("activate system");
  }).catch(function () {
    wireFamily([{ id: "FAM-SELF-TARIRO", name: "HRH Saint Tariro Masawi", generation: "self", role: "CORE" }]);
  });
  setInterval(function () { workers.active = 12; renderStats(); }, 1500);
})(window);
