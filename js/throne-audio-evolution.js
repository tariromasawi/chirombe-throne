(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_EVO__) return;
  g.__THRONE_AUDIO_EVO__ = true;
  var KEY = "CHIROMBE_LITURGY_JOURNAL_V1", SNAP = "CHIROMBE_LITURGY_EVO_SNAP_V1", MAX = 77;
  var journal = [], proposals = [], committed = 0, lastSnap = null;
  function load() {
    try { journal = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { journal = []; }
    try { lastSnap = JSON.parse(localStorage.getItem(SNAP) || "null"); } catch (e2) { lastSnap = null; }
    if (!Array.isArray(journal)) journal = [];
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(journal.slice(0, MAX))); } catch (e) {}
    try { localStorage.setItem(SNAP, JSON.stringify(lastSnap)); } catch (e2) {}
  }
  function now() { return new Date().toISOString(); }
  function fp(text) { var h = 77, s = String(text || ""); for (var i = 0; i < s.length; i++) h = ((h * 99) ^ s.charCodeAt(i) ^ 33) >>> 0; return ("00000000" + h.toString(16)).slice(-8); }
  function observe(entry) {
    var row = { id: "J-" + Date.now().toString(36), t: now(), kind: (entry && entry.kind) || "HOUSE", text: String((entry && entry.text) || "").slice(0, 1200), mark: fp(entry && entry.text), names: (entry && entry.names) || 0, remembered: (entry && entry.remembered) || 0, env: (entry && entry.environment) || null };
    journal.unshift(row); if (journal.length > MAX) journal.pop(); persist(); paint(); return row;
  }
  function themes() {
    var bag = { night: 0, house: 0, remembrance: 0, protection: 0 };
    journal.forEach(function (r) {
      var t = (r.text || "").toLowerCase();
      if (/night/.test(t)) bag.night += 1;
      if (/remembrance|remember/.test(t)) bag.remembrance += 1;
      if (/protection|gate|cover/.test(t)) bag.protection += 1;
      if (/house of masawi|mwari/.test(t)) bag.house += 1;
    });
    return bag;
  }
  function propose() {
    var bag = themes(), nextKind = "HOUSE";
    if (bag.night >= bag.protection) nextKind = "NIGHT";
    if (bag.remembrance > bag.night && bag.remembrance > bag.protection) nextKind = "REMEMBRANCE";
    var idea = { id: "P-" + Date.now().toString(36), t: now(), kind: nextKind, reason: "Observed " + journal.length + " rows. Night " + bag.night + ", protection " + bag.protection + ", remembrance " + bag.remembrance + ".", basedOn: journal[0] ? journal[0].id : null };
    proposals.unshift(idea); if (proposals.length > 12) proposals.pop(); paint(); return idea;
  }
  function validate(idea) {
    idea = idea || proposals[0];
    if (!idea) return { ok: false, error: "no proposal" };
    idea.valid = !!idea.kind && !!idea.reason && idea.reason.length > 12; idea.validated = now(); paint();
    return { ok: !!idea.valid, idea: idea };
  }
  function commit(idea) {
    var check = validate(idea); if (!check.ok) return check;
    var prayer = g.CHIROMBE_AUDIO_DECLARE && g.CHIROMBE_AUDIO_DECLARE.writePrayer ? g.CHIROMBE_AUDIO_DECLARE.writePrayer(check.idea.kind) : { text: "Mwari ndi Mwari. The House remains.", kind: check.idea.kind };
    var row = observe(prayer);
    lastSnap = { t: now(), version: committed + 1, kind: check.idea.kind, mark: row.mark, journal: journal.length };
    committed += 1; persist(); paint();
    if (g.ChirombeThrone) g.ChirombeThrone.log("EVO", "commit v" + lastSnap.version + " · " + check.idea.kind);
    return { ok: true, snapshot: lastSnap, prayer: prayer };
  }
  function evolveAndDeclare() {
    var idea = propose(), done = commit(idea);
    if (done.ok && g.CHIROMBE_AUDIO_DECLARE && g.CHIROMBE_AUDIO_DECLARE.declareNow) {
      if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene(idea.kind === "NIGHT" ? "NIGHT_WATCH" : "PROTECTION");
      g.CHIROMBE_AUDIO_DECLARE.declareNow();
    }
    return done;
  }
  function exportJournal() {
    var blob = new Blob([JSON.stringify({ matrix: "77-99-33", snapshot: lastSnap, journal: journal, proposals: proposals }, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "chirombe-liturgy-journal.json"; a.click();
  }
  function rollback() { if (journal.length) journal.shift(); persist(); paint(); return { ok: true, journal: journal.length }; }
  function paint() {
    var jn = document.getElementById("evo-count"), ver = document.getElementById("evo-version"), prop = document.getElementById("evo-proposal"), list = document.getElementById("evo-log");
    if (jn) jn.textContent = String(journal.length); if (ver) ver.textContent = lastSnap ? ("v" + lastSnap.version) : "NONE"; if (prop) prop.textContent = proposals[0] ? proposals[0].kind : "NONE";
    if (list) { list.innerHTML = ""; journal.slice(0, 8).forEach(function (r) { var el = document.createElement("div"); el.className = "member"; el.innerHTML = "<b>" + r.kind + " · " + r.mark + "</b>" + (r.text || "").slice(0, 180); list.appendChild(el); }); }
  }
  load();
  g.CHIROMBE_AUDIO_EVOLUTION = { observe: observe, propose: propose, validate: validate, commit: commit, evolveAndDeclare: evolveAndDeclare, exportJournal: exportJournal, rollback: rollback, journal: function () { return journal.slice(); }, snapshot: function () { return lastSnap; }, getStatus: function () { return { entries: journal.length, committed: committed, snapshot: lastSnap, next: proposals[0] || null }; } };
  g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Evolution = g.CHIROMBE_AUDIO_EVOLUTION;
  if (g.CHIROMBE_AUDIO_DECLARE && g.CHIROMBE_AUDIO_DECLARE.writePrayer) {
    var originalWrite = g.CHIROMBE_AUDIO_DECLARE.writePrayer;
    g.CHIROMBE_AUDIO_DECLARE.writePrayer = function (kind) { var prayer = originalWrite(kind); observe(prayer); return prayer; };
  }
  function bind() {
    var evo = document.getElementById("evo-go"), exp = document.getElementById("evo-export"), back = document.getElementById("evo-back");
    if (evo) evo.onclick = evolveAndDeclare; if (exp) exp.onclick = exportJournal; if (back) back.onclick = rollback; paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
