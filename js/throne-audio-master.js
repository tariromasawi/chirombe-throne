(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_MASTER__) return;
  g.__THRONE_AUDIO_MASTER__ = true;
  function startLivingLiturgy(mode) {
    if (g.CHIROMBE_AUDIO_SAFETY) g.CHIROMBE_AUDIO_SAFETY.registerUserGesture();
    if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.playScene) g.CHIROMBE_AUDIO_TONAL.playScene(mode || "PEACE");
    if (g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.setMode && mode) g.CHIROMBE_LITURGY.setMode(mode);
    if (g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.activate) g.CHIROMBE_LITURGY.activate();
    if (g.ChirombeThrone) g.ChirombeThrone.log("MASTER", "startLivingLiturgy · " + (mode || "PEACE"));
    return status();
  }
  function createBloodlineSession() {
    var lib = g.CHIROMBE_AUDIO_TRADITION_LIBRARY;
    var family = g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : [];
    if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene("UNITY");
    if (g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.activate) g.CHIROMBE_LITURGY.activate();
    if (g.ChirombeThrone) g.ChirombeThrone.log("MASTER", "bloodline session · " + family.length);
    return { ok: true, count: family.length, coverage: lib ? lib.getCoverage() : null };
  }
  function playScene(name) { return g.CHIROMBE_AUDIO_TONAL ? g.CHIROMBE_AUDIO_TONAL.playScene(name) : { ok: false, error: "tonal engine missing" }; }
  function runHardwareSelfTest() {
    var safety = g.CHIROMBE_AUDIO_SAFETY ? g.CHIROMBE_AUDIO_SAFETY.diagnostics() : {};
    var speech = "speechSynthesis" in g;
    var report = { issued: new Date().toISOString(), safety: safety, speech: speech, voices: speech ? (speechSynthesis.getVoices() || []).length : 0, tonal: !!g.CHIROMBE_AUDIO_TONAL, library: !!g.CHIROMBE_AUDIO_TRADITION_LIBRARY, liturgy: !!g.CHIROMBE_LITURGY, ok: !!(safety && safety.ok && speech) };
    var box = document.getElementById("audio-diag"); if (box) box.textContent = JSON.stringify(report, null, 2);
    if (g.ChirombeThrone) g.ChirombeThrone.log("DIAG", report.ok ? "hardware self-test pass" : "hardware self-test partial");
    return report;
  }
  function status() { return { safety: g.CHIROMBE_AUDIO_SAFETY && g.CHIROMBE_AUDIO_SAFETY.getStatus(), tonal: g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.getStatus(), coverage: g.CHIROMBE_AUDIO_TRADITION_LIBRARY && g.CHIROMBE_AUDIO_TRADITION_LIBRARY.getCoverage(), liturgy: g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.status && g.CHIROMBE_LITURGY.status() }; }
  var API = { VERSION: "throne-living-3.1", startLivingLiturgy: startLivingLiturgy, createBloodlineSession: createBloodlineSession, playScene: playScene, runHardwareSelfTest: runHardwareSelfTest, diagnostics: runHardwareSelfTest, emergencyStop: function () { return g.CHIROMBE_AUDIO_SAFETY && g.CHIROMBE_AUDIO_SAFETY.emergencyStop("master"); }, getCoverage: function () { return g.CHIROMBE_AUDIO_TRADITION_LIBRARY && g.CHIROMBE_AUDIO_TRADITION_LIBRARY.getCoverage(); }, getStatus: status };
  g.CHIROMBE_AUDIO = Object.assign(g.CHIROMBE_AUDIO || {}, API);
  g.CHIROMBE_AUDIO.Safety = g.CHIROMBE_AUDIO_SAFETY; g.CHIROMBE_AUDIO.Library = g.CHIROMBE_AUDIO_TRADITION_LIBRARY; g.CHIROMBE_AUDIO.Tonal = g.CHIROMBE_AUDIO_TONAL; g.CHIROMBE_AUDIO.Liturgy = g.CHIROMBE_LITURGY;
  g.CHIROMBE_AUDIO_LIVING_LITURGY = g.CHIROMBE_AUDIO; g.CHIROMBE_AUDIO_CONTROL = API;
  if (g.ChirombeBus) {
    g.ChirombeBus.registerCommand("liturgy.live", function (a) { return startLivingLiturgy(a && a.mode); }, { subsystem: "audio" });
    g.ChirombeBus.registerCommand("liturgy.bloodline", createBloodlineSession, { subsystem: "audio" });
    g.ChirombeBus.registerCommand("audio.scene", function (a) { return playScene(a && a.name); }, { subsystem: "audio" });
    g.ChirombeBus.registerCommand("audio.diag", runHardwareSelfTest, { subsystem: "audio" });
    g.ChirombeBus.registerCommand("audio.stop", API.emergencyStop, { subsystem: "audio" });
  }
})(window);
