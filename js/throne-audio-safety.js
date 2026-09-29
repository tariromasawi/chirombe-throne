(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_SAFETY__) return;
  g.__THRONE_AUDIO_SAFETY__ = true;
  var LIMITS = { minHz: 20, maxHz: 5000, maxOscGain: 0.16, maxMasterGain: 0.5, maxOscillators: 16, maxHarmonics: 8, maxDurationMs: 3600000, allowUltrasonic: false };
  var state = { armed: true, gesture: false, sources: 0, lastStop: null };
  function classifyFrequency(hz) {
    var f = Number(hz); if (!isFinite(f)) return "INVALID";
    if (f < LIMITS.minHz) return "SUB_AUDIBLE"; if (f > 20000) return "ULTRASONIC"; if (f > LIMITS.maxHz) return "HIGH_AUDIBLE_BLOCKED"; return "AUDIBLE";
  }
  function validateFrequency(hz) { var f = Number(hz), cls = classifyFrequency(f); return { ok: cls === "AUDIBLE", hz: f, class: cls }; }
  function validateGain(gain, kind) {
    var gval = Number(gain), cap = kind === "master" ? LIMITS.maxMasterGain : LIMITS.maxOscGain;
    if (!isFinite(gval) || gval < 0) return { ok: false, gain: 0, cap: cap };
    return { ok: gval <= cap, gain: Math.min(gval, cap), cap: cap };
  }
  function validateDuration(ms) { var n = Number(ms) || 0; return { ok: n >= 0 && n <= LIMITS.maxDurationMs, ms: Math.min(Math.max(0, n), LIMITS.maxDurationMs) }; }
  function resourceCheck(extra) { var next = state.sources + (extra || 0); return { ok: state.armed && next <= LIMITS.maxOscillators, sources: state.sources, next: next, cap: LIMITS.maxOscillators, armed: state.armed }; }
  function sourceStarted() { state.sources += 1; return state.sources; }
  function sourceStopped() { state.sources = Math.max(0, state.sources - 1); return state.sources; }
  function validateRequest(req) {
    req = req || {};
    var freq = req.hz == null ? { ok: true } : validateFrequency(req.hz);
    var gain = req.gain == null ? { ok: true, gain: 0.04 } : validateGain(req.gain, req.kind);
    var dur = req.ms == null ? { ok: true } : validateDuration(req.ms);
    var res = resourceCheck(req.nodes || 1);
    return { ok: state.armed && state.gesture && freq.ok && gain.ok && dur.ok && res.ok, frequency: freq, gain: gain, duration: dur, resources: res, gesture: state.gesture, armed: state.armed };
  }
  function registerUserGesture() { state.gesture = true; return true; }
  function arm() { state.armed = true; return getStatus(); }
  function disarm() { state.armed = false; return getStatus(); }
  function emergencyStop(reason) {
    state.armed = false; state.lastStop = { t: new Date().toISOString(), reason: String(reason || "emergency") };
    if (g.ChirombeAudio && g.ChirombeAudio.stopAll) g.ChirombeAudio.stopAll();
    if (g.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {}
    if (g.CHIROMBE_LITURGY && g.CHIROMBE_LITURGY.stop) g.CHIROMBE_LITURGY.stop();
    if (g.ChirombeThrone) g.ChirombeThrone.log("SAFETY", "emergency stop · " + state.lastStop.reason);
    return getStatus();
  }
  function getStatus() { return { armed: state.armed, gesture: state.gesture, sources: state.sources, limits: LIMITS, lastStop: state.lastStop }; }
  function diagnostics() {
    var AC = g.AudioContext || g.webkitAudioContext, report = { webAudio: !!AC, speech: "speechSynthesis" in g, ok: false, state: "unknown", sampleRate: null };
    try { if (AC) { var ctx = new AC(); report.sampleRate = ctx.sampleRate; report.state = ctx.state; report.ok = true; ctx.close && ctx.close(); } } catch (e) { report.error = String(e && e.message || e); }
    report.safety = getStatus(); return report;
  }
  var API = { LIMITS: LIMITS, classifyFrequency: classifyFrequency, validateFrequency: validateFrequency, validateGain: validateGain, validateDuration: validateDuration, resourceCheck: resourceCheck, sourceStarted: sourceStarted, sourceStopped: sourceStopped, validateRequest: validateRequest, registerUserGesture: registerUserGesture, arm: arm, disarm: disarm, emergencyStop: emergencyStop, safeStop: emergencyStop, getStatus: getStatus, diagnostics: diagnostics };
  g.CHIROMBE_AUDIO_SAFETY = API; g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Safety = API;
  document.addEventListener("click", function once() { registerUserGesture(); document.removeEventListener("click", once); });
})(window);
