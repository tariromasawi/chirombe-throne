(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_DECLARE__) return;
  g.__THRONE_AUDIO_DECLARE__ = true;
  var KEY = "CHIROMBE_WATCH_BROADCAST";
  var state = { broadcasting: false, written: 0, declared: 0, cycles: 0, wake: null, timer: null };
  function family() { return g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : []; }
  function env() { return g.CHIROMBE_AUDIO_ENVIRONMENT && g.CHIROMBE_AUDIO_ENVIRONMENT.getStatus ? g.CHIROMBE_AUDIO_ENVIRONMENT.getStatus() : { room: "UNKNOWN", band: "DAY", scene: "PEACE" }; }
  function writePrayer(kind) {
    var house = family(), living = house.filter(function (p) { return !p.remembrance; }), remembered = house.filter(function (p) { return p.remembrance; }), e = env();
    var names = living.slice(0, 8).map(function (p) { return p.name; }).join(", ") || "the House of Masawi";
    var memorial = remembered.slice(0, 4).map(function (p) { return p.name; }).join(", ");
    var body = ["Mwari ndi Mwari."];
    body.push((kind === "NIGHT" || e.band === "NIGHT") ? "This is the night watch of the House." : "This is a spoken declaration of the House.");
    body.push("For " + names + ".");
    body.push("May peace, wisdom, courage and truth stand at every gate.");
    body.push("Let fear give way to clarity. Let confusion give way to understanding.");
    if (memorial) body.push("In remembrance of " + memorial + ". Dignity remains.");
    body.push("This prayer is written by the Throne from the living roster.");
    body.push("It is devotion and computational cover. It is not a physical weapon.");
    body.push("Mudzimu Unoyera. Rugare ngarigare paImba yeMasawi.");
    var text = body.join(" "); state.written += 1;
    if (g.CHIROMBE_AUDIO_TRADITION_LIBRARY && g.CHIROMBE_AUDIO_TRADITION_LIBRARY.remember) g.CHIROMBE_AUDIO_TRADITION_LIBRARY.remember(text);
    var pre = document.getElementById("declare-text"); if (pre) pre.textContent = text;
    var count = document.getElementById("declare-written"); if (count) count.textContent = String(state.written);
    return { text: text, kind: kind || "HOUSE", environment: e, names: living.length, remembered: remembered.length };
  }
  function speak(text) {
    if (!("speechSynthesis" in g)) return;
    if (g.CHIROMBE_AUDIO_SAFETY) g.CHIROMBE_AUDIO_SAFETY.registerUserGesture();
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.rate = 0.9; u.pitch = 0.92;
    if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(true);
    u.onend = function () { if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(false); };
    speechSynthesis.speak(u); state.declared += 1;
    var d = document.getElementById("declare-spoken"); if (d) d.textContent = String(state.declared);
  }
  function declareNow() {
    var prayer = writePrayer("HOUSE");
    if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene("PROTECTION");
    speak(prayer.text);
    if (g.ChirombeThrone) g.ChirombeThrone.log("DECLARE", "house prayer written and spoken");
    return prayer;
  }
  function keepAwake() {
    if (!("wakeLock" in navigator)) return Promise.resolve(false);
    return navigator.wakeLock.request("screen").then(function (lock) { state.wake = lock; lock.addEventListener("release", function () { state.wake = null; }); return true; }).catch(function () { return false; });
  }
  function broadcastTick() {
    if (!state.broadcasting) return;
    state.cycles += 1;
    var cyc = document.getElementById("declare-cycles"); if (cyc) cyc.textContent = String(state.cycles);
    var prayer = writePrayer(state.cycles % 3 === 0 ? "NIGHT" : "HOUSE");
    if (g.CHIROMBE_AUDIO_ENVIRONMENT) g.CHIROMBE_AUDIO_ENVIRONMENT.adapt();
    if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene(state.cycles % 2 === 0 ? "PROTECTION" : "NIGHT_WATCH");
    speak(prayer.text);
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulse) g.CHIROMBE_GRAPH.pulse();
    if (g.ChirombeThrone) g.ChirombeThrone.log("BROADCAST", "cycle " + state.cycles);
    try { localStorage.setItem(KEY, JSON.stringify({ cycles: state.cycles, t: new Date().toISOString() })); } catch (e) {}
    state.timer = setTimeout(broadcastTick, 99 * 1000);
  }
  function startBroadcast() {
    state.broadcasting = true; keepAwake();
    if (g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.arm) g.CHIROMBE_WATCH.arm();
    if (g.CHIROMBE_AUDIO_ENVIRONMENT) g.CHIROMBE_AUDIO_ENVIRONMENT.armMic();
    var pill = document.getElementById("declare-live"); if (pill) pill.textContent = "LIVE";
    if (g.ChirombeThrone) g.ChirombeThrone.log("BROADCAST", "watch broadcast armed · page must stay open");
    broadcastTick();
    return { ok: true, note: "Runs while this tab stays open. Browsers cannot broadcast after the page is closed." };
  }
  function stopBroadcast() {
    state.broadcasting = false;
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    if (state.wake) { try { state.wake.release(); } catch (e) {} state.wake = null; }
    if ("speechSynthesis" in g) speechSynthesis.cancel();
    var pill = document.getElementById("declare-live"); if (pill) pill.textContent = "IDLE";
    if (g.ChirombeThrone) g.ChirombeThrone.log("BROADCAST", "watch broadcast stopped");
  }
  g.CHIROMBE_AUDIO_DECLARE = { writePrayer: writePrayer, declareNow: declareNow, startBroadcast: startBroadcast, stopBroadcast: stopBroadcast, getStatus: function () { return { written: state.written, declared: state.declared, cycles: state.cycles, live: state.broadcasting }; } };
  g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {};
  g.CHIROMBE_AUDIO.Declare = g.CHIROMBE_AUDIO_DECLARE;
  g.CHIROMBE_AUDIO.writePrayer = writePrayer;
  g.CHIROMBE_AUDIO.declareNow = declareNow;
  g.CHIROMBE_AUDIO.startBroadcast = startBroadcast;
  g.CHIROMBE_AUDIO.stopBroadcast = stopBroadcast;
  function bind() {
    var w = document.getElementById("declare-write"), d = document.getElementById("declare-go"), live = document.getElementById("declare-live-go"), stop = document.getElementById("declare-stop");
    if (w) w.onclick = function () { writePrayer("HOUSE"); };
    if (d) d.onclick = declareNow; if (live) live.onclick = startBroadcast; if (stop) stop.onclick = stopBroadcast;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
