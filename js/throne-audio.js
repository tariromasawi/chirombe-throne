(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO__) return;
  g.__THRONE_AUDIO__ = true;
  var ctx = null, master = null, analyser = null, nodes = [], running = false;
  var hz = { ground: 77, cover: 99, seal: 33, overtone: 136.1 };
  function ensure() {
    if (ctx) return ctx;
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.08;
    analyser = ctx.createAnalyser(); analyser.fftSize = 256;
    master.connect(analyser); analyser.connect(ctx.destination);
    return ctx;
  }
  function tone(freq, type, gain) {
    if (!ensure() || ctx.state !== "running") return null;
    var o = ctx.createOscillator(); var gnode = ctx.createGain();
    o.type = type || "sine"; o.frequency.value = freq; gnode.gain.value = gain == null ? 0.04 : gain;
    o.connect(gnode); gnode.connect(master); o.start(); nodes.push({ o: o, g: gnode }); return o;
  }
  function stopAll() {
    nodes.forEach(function (n) { try { n.o.stop(); } catch (e) {} try { n.o.disconnect(); n.g.disconnect(); } catch (e2) {} });
    nodes = []; running = false; paint("IDLE");
  }
  function startField() {
    if (!ensure()) return { ok: false, error: "no AudioContext" };
    return ctx.resume().then(function () {
      stopAll(); tone(hz.ground, "sine", 0.03); tone(hz.cover, "triangle", 0.018); tone(hz.seal * 8, "sine", 0.012);
      running = true; paint("FIELD");
      if (g.ChirombeThrone) g.ChirombeThrone.log("AUDIO", "Matrix field " + hz.ground + "/" + hz.cover + "/" + hz.seal);
      return { ok: true, state: ctx.state, hz: hz };
    });
  }
  function pulseCover() {
    if (!ensure()) return;
    ctx.resume().then(function () {
      var o = tone(528, "sine", 0.0001); if (!o || !nodes.length) return;
      var gnode = nodes[nodes.length - 1].g; var t = ctx.currentTime;
      gnode.gain.setValueAtTime(0.0001, t);
      gnode.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
      gnode.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      setTimeout(function () { try { o.stop(); } catch (e) {} }, 1800);
      if (g.ChirombeThrone) g.ChirombeThrone.log("AUDIO", "Cover pulse 528");
    });
  }
  function paint(stage) {
    var st = document.getElementById("audio-state"); var hzEl = document.getElementById("audio-hz"); var vu = document.getElementById("audio-vu");
    if (st) st.textContent = (ctx && ctx.state ? ctx.state.toUpperCase() : "NO-CTX") + " · " + stage;
    if (hzEl) hzEl.textContent = hz.ground + " / " + hz.cover + " / " + hz.seal;
    if (vu && analyser && running) {
      var data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      var avg = 0; for (var i = 0; i < data.length; i++) avg += data[i];
      avg = avg / data.length / 255; vu.style.width = Math.max(8, Math.round(avg * 100)) + "%";
    }
  }
  function tick() { paint(running ? "FIELD" : "STANDBY"); requestAnimationFrame(tick); }
  requestAnimationFrame(tick);
  g.ChirombeAudio = { startField: startField, stopAll: stopAll, pulseCover: pulseCover, status: function () { return { available: !!ensure(), state: ctx && ctx.state, running: running, hz: hz, sources: nodes.length }; } };
})(window);
