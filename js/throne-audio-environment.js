(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_ENV__) return;
  g.__THRONE_AUDIO_ENV__ = true;
  var state = { armed: false, mic: false, motion: false, rms: 0, peak: 0, motionMag: 0, hour: new Date().getHours(), scene: "PEACE", room: "UNKNOWN" };
  var stream = null, ctx = null, analyser = null, source = null, raf = null;
  function classifyRoom() { if (state.rms > 0.18) return "LOUD"; if (state.rms > 0.06) return "LIVING"; if (state.rms > 0.015) return "QUIET"; return "STILL"; }
  function timeBand() { var h = new Date().getHours(); state.hour = h; if (h >= 5 && h < 8) return "DAWN"; if (h >= 8 && h < 18) return "DAY"; if (h >= 18 && h < 22) return "EVENING"; return "NIGHT"; }
  function selectScene() {
    var room = classifyRoom(), band = timeBand(); state.room = room;
    if (room === "LOUD") state.scene = "ALERT";
    else if (band === "NIGHT") state.scene = "NIGHT_WATCH";
    else if (band === "DAWN") state.scene = "DAWN";
    else if (band === "EVENING") state.scene = "EVENING";
    else if (room === "STILL") state.scene = "REMEMBRANCE";
    else state.scene = "PEACE";
    return state.scene;
  }
  function paint() {
    var room = document.getElementById("env-room"), scene = document.getElementById("env-scene"), rms = document.getElementById("env-rms"), band = document.getElementById("env-band"), mic = document.getElementById("env-mic");
    if (room) room.textContent = state.room; if (scene) scene.textContent = state.scene;
    if (rms) rms.textContent = state.rms.toFixed(3); if (band) band.textContent = timeBand(); if (mic) mic.textContent = state.mic ? "OPEN" : "CLOSED";
  }
  function analyseMic() {
    if (!analyser) return;
    var data = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data);
    var sum = 0, peak = 0;
    for (var i = 0; i < data.length; i++) { var v = (data[i] - 128) / 128; sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    state.rms = Math.sqrt(sum / data.length); state.peak = peak; selectScene(); paint(); raf = requestAnimationFrame(analyseMic);
  }
  function armMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { state.mic = false; paint(); return Promise.resolve({ ok: false, error: "no mediaDevices" }); }
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (s) {
      stream = s; var AC = g.AudioContext || g.webkitAudioContext; ctx = ctx || new AC();
      analyser = ctx.createAnalyser(); analyser.fftSize = 2048; source = ctx.createMediaStreamSource(stream); source.connect(analyser);
      state.mic = true; state.armed = true; ctx.resume(); analyseMic();
      if (g.ChirombeThrone) g.ChirombeThrone.log("ENV", "microphone open · room sensing only");
      return { ok: true };
    }).catch(function (e) { state.mic = false; paint(); return { ok: false, error: String(e && e.message || e) }; });
  }
  function disarmMic() {
    if (raf) cancelAnimationFrame(raf); raf = null;
    if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); stream = null;
    state.mic = false; state.armed = false; paint();
  }
  function armMotion() {
    function onMotion(ev) { var a = ev.accelerationIncludingGravity || ev.acceleration || {}; state.motionMag = Math.sqrt((a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0)); state.motion = true; }
    window.addEventListener("devicemotion", onMotion);
    if (typeof DeviceMotionEvent !== "undefined" && DeviceMotionEvent.requestPermission) {
      return DeviceMotionEvent.requestPermission().then(function (r) { state.motion = r === "granted"; return { ok: state.motion }; }).catch(function () { return { ok: false }; });
    }
    state.motion = true; return Promise.resolve({ ok: true });
  }
  function adapt() {
    var scene = selectScene();
    if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene(scene === "ALERT" ? "PROTECTION" : scene);
    if (g.ChirombeThrone) g.ChirombeThrone.log("ENV", "adapt · " + state.room + " · " + timeBand() + " · " + scene);
    paint(); return getStatus();
  }
  function getStatus() { return { armed: state.armed, mic: state.mic, motion: state.motion, rms: Number(state.rms.toFixed(4)), room: state.room, band: timeBand(), scene: state.scene, motionMag: Number(state.motionMag.toFixed(3)) }; }
  g.CHIROMBE_AUDIO_ENVIRONMENT = { armMic: armMic, disarmMic: disarmMic, armMotion: armMotion, adapt: adapt, selectScene: selectScene, getEnvironment: getStatus, getStatus: getStatus };
  g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Environment = g.CHIROMBE_AUDIO_ENVIRONMENT;
  function bind() {
    var go = document.getElementById("env-go"), stop = document.getElementById("env-stop"), adaptBtn = document.getElementById("env-adapt");
    if (go) go.onclick = function () { armMic(); armMotion(); }; if (stop) stop.onclick = disarmMic; if (adaptBtn) adaptBtn.onclick = adapt; paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
