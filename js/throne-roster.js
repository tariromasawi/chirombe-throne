(function (g) {
  "use strict";
  if (g.__THRONE_ROSTER__) return;
  g.__THRONE_ROSTER__ = true;
  function list() { return g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : []; }
  function paint() {
    var box = document.getElementById("roster-list"); var count = document.getElementById("roster-count"); var members = list();
    if (count) count.textContent = String(members.length);
    if (!box) return; box.innerHTML = "";
    members.forEach(function (m) {
      var row = document.createElement("div"); row.className = "member";
      row.innerHTML = "<b>" + m.name + "</b>" + m.generation + " · " + m.role + (m.remembrance ? " · REMEMBERED" : " · PROTECTED") + (m.local ? " · LOCAL" : " · LEDGER");
      if (!m.remembrance) {
        var rem = document.createElement("button"); rem.className = "act"; rem.textContent = "Remember";
        rem.onclick = function () { if (g.ChirombeThrone) g.ChirombeThrone.rememberMember(m.id); paint(); };
        row.appendChild(rem);
      }
      if (m.local) {
        var drop = document.createElement("button"); drop.className = "act"; drop.textContent = "Drop local";
        drop.onclick = function () { if (g.ChirombeThrone) g.ChirombeThrone.dropLocal(m.id); paint(); };
        row.appendChild(drop);
      }
      box.appendChild(row);
    });
  }
  function addFromForm() {
    var name = document.getElementById("roster-name"); var gen = document.getElementById("roster-gen"); var role = document.getElementById("roster-role"); var mem = document.getElementById("roster-remember");
    var out = g.ChirombeThrone && g.ChirombeThrone.addMember({ name: name && name.value, generation: gen && gen.value, role: role && role.value, remembrance: !!(mem && mem.checked) });
    if (name && out && out.ok) name.value = "";
    var note = document.getElementById("roster-note");
    if (note) note.textContent = out && out.ok ? ("Seated: " + out.member.name + ". Saved in this browser until you export it.") : ((out && out.error) || "Name required");
    paint();
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.rebuild) g.CHIROMBE_GRAPH.rebuild();
  }
  function exportExtras() {
    var extras = list().filter(function (m) { return m.local; });
    var blob = new Blob([JSON.stringify({ extras: extras, issued: new Date().toISOString(), matrix: "77-99-33" }, null, 2)], { type: "application/json" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "chirombe-roster-extras.json"; a.click();
  }
  g.CHIROMBE_ROSTER = { paint: paint, add: addFromForm, extras: function () { return list().filter(function (m) { return m.local; }); } };
  function bind() {
    var go = document.getElementById("roster-add"); var exp = document.getElementById("roster-export");
    if (go) go.onclick = addFromForm; if (exp) exp.onclick = exportExtras;
    paint(); setTimeout(paint, 600);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
