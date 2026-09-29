(function () {
  "use strict";
  var views = ["command", "bloodline", "graph", "audio", "swarm", "watch", "keep", "seal", "engines", "inspect"];
  function show(name) {
    views.forEach(function (v) {
      var panel = document.getElementById("view-" + v);
      var btn = document.querySelector('[data-view="' + v + '"]');
      if (panel) panel.hidden = v !== name;
      if (btn) btn.classList.toggle("active", v === name);
    });
    if (name === "graph" && window.CHIROMBE_GRAPH) CHIROMBE_GRAPH.rebuild();
  }
  document.querySelectorAll("[data-view]").forEach(function (btn) {
    btn.addEventListener("click", function () { show(btn.getAttribute("data-view")); });
  });
  document.querySelectorAll("[data-cmd]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = btn.getAttribute("data-cmd");
      var out = window.ChirombeBus ? ChirombeBus.executeCommand(name) : { ok: false };
      if (window.ChirombeThrone) ChirombeThrone.log("CMD", name + " · " + (out.ok ? "OK" : out.error || "FAIL"));
      if (name === "protect family" && window.ChirombeAudio) ChirombeAudio.pulseCover();
      if (name === "protect family" && window.CHIROMBE_GRAPH) CHIROMBE_GRAPH.pulse();
      if (name === "activate system" && window.CHIROMBE_SWARM) CHIROMBE_SWARM.start();
      if (name === "activate system" && window.CHIROMBE_WATCH) CHIROMBE_WATCH.arm();
      if (name === "export state") {
        var blob = new Blob([JSON.stringify(out.result || out, null, 2)], { type: "application/json" });
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "chirombe-throne-state.json"; a.click();
      }
    });
  });
  var startBtn = document.getElementById("audio-start"); var stopBtn = document.getElementById("audio-stop");
  if (startBtn) startBtn.addEventListener("click", function () { if (window.ChirombeAudio) ChirombeAudio.startField(); });
  if (stopBtn) stopBtn.addEventListener("click", function () { if (window.ChirombeAudio) ChirombeAudio.stopAll(); });
  show("command");
})();
