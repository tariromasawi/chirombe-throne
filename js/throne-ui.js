(function () {
  "use strict";
  var views = ["command", "bloodline", "roster", "graph", "audio", "chamber", "watchcast", "swarm", "watch", "keep", "seal", "brief", "engines", "inspect"];
  function show(name) {
    views.forEach(function (v) {
      var panel = document.getElementById("view-" + v);
      var btn = document.querySelector('[data-view="' + v + '"]');
      if (panel) panel.hidden = v !== name;
      if (btn) btn.classList.toggle("active", v === name);
    });
    if (name === "graph" && window.CHIROMBE_GRAPH) CHIROMBE_GRAPH.rebuild();
    if (name === "brief" && window.CHIROMBE_BRIEF) CHIROMBE_BRIEF.paint();
    if (name === "roster" && window.CHIROMBE_ROSTER) CHIROMBE_ROSTER.paint();
    if (name === "chamber" && window.CHIROMBE_AUDIO_PERFORMANCE) CHIROMBE_AUDIO_PERFORMANCE.refreshVoices();
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
    });
  });
  var startBtn = document.getElementById("audio-start"); var stopBtn = document.getElementById("audio-stop");
  if (startBtn) startBtn.addEventListener("click", function () { if (window.ChirombeAudio) ChirombeAudio.startField(); });
  if (stopBtn) stopBtn.addEventListener("click", function () { if (window.ChirombeAudio) ChirombeAudio.stopAll(); });
  var blood = document.getElementById("audio-bloodline"); var diagBtn = document.getElementById("audio-diag-btn"); var panic = document.getElementById("audio-panic");
  if (blood) blood.addEventListener("click", function () { if (window.CHIROMBE_AUDIO) CHIROMBE_AUDIO.createBloodlineSession(); });
  if (diagBtn) diagBtn.addEventListener("click", function () { if (window.CHIROMBE_AUDIO) CHIROMBE_AUDIO.runHardwareSelfTest(); });
  if (panic) panic.addEventListener("click", function () { if (window.CHIROMBE_AUDIO) CHIROMBE_AUDIO.emergencyStop(); });
  document.querySelectorAll("[data-scene]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = btn.getAttribute("data-scene");
      if (name === "STACK" && window.CHIROMBE_AUDIO_TONAL) CHIROMBE_AUDIO_TONAL.playHarmonicStack(77, 5);
      else if (name === "SWEEP" && window.CHIROMBE_AUDIO_TONAL) CHIROMBE_AUDIO_TONAL.playSweep(77, 99, 2400);
      else if (window.CHIROMBE_AUDIO) CHIROMBE_AUDIO.playScene(name);
    });
  });
  show("command");
})();
