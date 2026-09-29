(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_TONAL__) return;
  g.__THRONE_AUDIO_TONAL__ = true;
  var SCENES = {
    GROUNDING: { hz: [64, 128, 77], wave: ["sine", "sine", "triangle"], gain: [0.04, 0.02, 0.012] },
    PEACE: { hz: [77, 192, 264], wave: ["sine", "sine", "sine"], gain: [0.035, 0.016, 0.01] },
    PROTECTION: { hz: [99, 256, 528], wave: ["triangle", "sine", "sine"], gain: [0.03, 0.014, 0.008] },
    REMEMBRANCE: { hz: [264, 174, 220], wave: ["sine", "triangle", "sine"], gain: [0.028, 0.014, 0.01] },
    FAMILY_BLESSING: { hz: [136.1, 256, 77], wave: ["sine", "sine", "triangle"], gain: [0.03, 0.012, 0.01] },
    NIGHT_WATCH: { hz: [77, 99, 264], wave: ["sine", "triangle", "sine"], gain: [0.02, 0.012, 0.008] },
    DAWN: { hz: [174, 261.63, 392], wave: ["sine", "sine", "triangle"], gain: [0.022, 0.014, 0.01] },
    EVENING: { hz: [128, 192, 220], wave: ["sine", "triangle", "sine"], gain: [0.024, 0.012, 0.01] },
    UNITY: { hz: [256, 192, 77], wave: ["sine", "sine", "sine"], gain: [0.026, 0.014, 0.012] },
    CLOSING: { hz: [392, 256, 77], wave: ["sine", "sine", "triangle"], gain: [0.02, 0.012, 0.01] }
  };
  var ctx = null, master = null, duck = null, analyser = null, compressor = null, nodes = [], sceneName = "DORMANT";
  function safety() { return g.CHIROMBE_AUDIO_SAFETY; }
  function ok(req) { return safety() ? safety().validateRequest(req) : { ok: true, gain: { gain: req.gain } }; }
  function ensure() {
    if (ctx) return ctx;
    var AC = g.AudioContext || g.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.18; duck = ctx.createGain(); duck.gain.value = 1;
    compressor = ctx.createDynamicsCompressor(); analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
    duck.connect(master); master.connect(compressor); compressor.connect(analyser); analyser.connect(ctx.destination); return ctx;
  }
  function resume() { ensure(); if (!ctx) return Promise.resolve(null); if (safety()) safety().registerUserGesture(); return ctx.resume().then(function () { return ctx; }); }
  function attach(o, gn) { nodes.push({ o: o, g: gn }); if (safety()) safety().sourceStarted(); }
  function detach(entry) { try { entry.o.stop(); } catch (e) {} try { entry.o.disconnect(); entry.g.disconnect(); } catch (e2) {} if (safety()) safety().sourceStopped(); }
  function stopAll() { nodes.forEach(detach); nodes = []; sceneName = "DORMANT"; paint(); }
  function tone(freq, type, gain, ms) {
    var check = ok({ hz: freq, gain: gain, ms: ms || 0, nodes: 1 }); if (!check.ok) return null;
    if (!ensure() || ctx.state !== "running") return null;
    var useGain = (check.gain && check.gain.gain) || gain || 0.03;
    var o = ctx.createOscillator(), gn = ctx.createGain(); o.type = type || "sine"; o.frequency.value = freq; gn.gain.value = useGain;
    o.connect(gn); gn.connect(duck); o.start(); attach(o, gn); if (ms) setTimeout(function () { try { o.stop(); } catch (e) {} }, ms); return o;
  }
  function playDrone(hz) { return resume().then(function () { stopAll(); tone(hz || 77, "sine", 0.04); tone((hz || 77) * 2, "sine", 0.012); sceneName = "DRONE"; paint(); return { ok: true, scene: sceneName }; }); }
  function playHarmonicStack(root, count) { return resume().then(function () { stopAll(); var n = Math.min(count || 4, 8), base = root || 77; for (var i = 1; i <= n; i++) tone(base * i, i % 2 ? "sine" : "triangle", 0.04 / i); sceneName = "STACK"; paint(); return { ok: true, root: base, partials: n }; }); }
  function playSweep(from, to, ms) { return resume().then(function () { var start = from || 77, end = to || 99, dur = (ms || 2400) / 1000; if (!ok({ hz: start, gain: 0.03, ms: ms || 2400 }).ok) return { ok: false }; var o = ctx.createOscillator(), gn = ctx.createGain(); o.type = "sine"; o.frequency.setValueAtTime(start, ctx.currentTime); o.frequency.linearRampToValueAtTime(end, ctx.currentTime + dur); gn.gain.value = 0.03; o.connect(gn); gn.connect(duck); o.start(); attach(o, gn); setTimeout(function () { try { o.stop(); } catch (e) {} }, (ms || 2400) + 80); sceneName = "SWEEP"; paint(); return { ok: true }; }); }
  function playPulse(hz, times) { return resume().then(function () { var n = times || 3, i = 0; function beat() { if (i >= n) return; tone(hz || 99, "sine", 0.05, 180); i += 1; setTimeout(beat, 320); } beat(); sceneName = "PULSE"; paint(); return { ok: true }; }); }
  function playScene(name) { var spec = SCENES[String(name || "PEACE").toUpperCase()] || SCENES.PEACE; return resume().then(function () { stopAll(); spec.hz.forEach(function (h, i) { tone(h, spec.wave[i] || "sine", spec.gain[i] || 0.02); }); sceneName = String(name || "PEACE").toUpperCase(); paint(); if (g.ChirombeThrone) g.ChirombeThrone.log("TONAL", "scene " + sceneName); return { ok: true, scene: sceneName, hz: spec.hz }; }); }
  function setVoiceDuck(on) { if (!ensure()) return; duck.gain.setTargetAtTime(on ? 0.2 : 1, ctx.currentTime, 0.08); }
  function analyse() {
    if (!analyser) return { rms: 0, peak: 0, dominant: 0 };
    var spec = new Uint8Array(analyser.frequencyBinCount), time = new Uint8Array(analyser.fftSize);
    analyser.getByteFrequencyData(spec); analyser.getByteTimeDomainData(time);
    var sum = 0, peak = 0, dom = 0, domI = 0;
    for (var i = 0; i < time.length; i++) { var v = (time[i] - 128) / 128; sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    for (var j = 0; j < spec.length; j++) if (spec[j] > dom) { dom = spec[j]; domI = j; }
    return { rms: Math.sqrt(sum / time.length), peak: peak, dominant: Math.round(domI * (analyser.context ? analyser.context.sampleRate : 44100) / analyser.fftSize) };
  }
  function paint() {
    var st = document.getElementById("audio-state"); var sceneEl = document.getElementById("tonal-scene"); var specEl = document.getElementById("tonal-spec"); var vu = document.getElementById("audio-vu"); var a = analyse();
    if (st) st.textContent = (ctx && ctx.state ? ctx.state.toUpperCase() : "NO-CTX") + " · " + sceneName;
    if (sceneEl) sceneEl.textContent = sceneName; if (specEl) specEl.textContent = a.dominant ? a.dominant + " Hz" : "—";
    if (vu) vu.style.width = Math.min(100, Math.round(a.rms * 280)) + "%";
  }
  var API = { SCENES: Object.keys(SCENES), playDrone: playDrone, playHarmonicStack: playHarmonicStack, playSweep: playSweep, playPulse: playPulse, playScene: playScene, stopScene: stopAll, stopAll: stopAll, setVoiceDuck: setVoiceDuck, analyse: analyse, unlock: resume, startField: function () { return playScene("PEACE"); }, pulseCover: function () { return playPulse(528, 2); }, getStatus: function () { return { scene: sceneName, nodes: nodes.length, analysis: analyse() }; } };
  g.CHIROMBE_AUDIO_TONAL = API; g.ChirombeAudio = Object.assign(g.ChirombeAudio || {}, API); g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Tonal = API;
  document.addEventListener("click", function boot() { resume(); setInterval(paint, 240); }, { once: true });
})(window);
