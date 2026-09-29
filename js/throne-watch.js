(function (g) {
  "use strict";
  if (g.__THRONE_WATCH__) return;
  g.__THRONE_WATCH__ = true;
  var KEY = "CHIROMBE_NIGHT_WATCH";
  var armed = false, started = 0, tickTimer = null, whisper = false, rememberedIndex = 0;
  var beats = { peace: 0, protect: 0, remember: 0 };
  var last = { peace: 0, protect: 0, remember: 0 };
  function now() { return Date.now(); }
  function elapsed() { return armed ? Math.floor((now() - started) / 1000) : 0; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ armed: armed, started: started, beats: beats, whisper: whisper })); } catch (e) {} }
  function restore() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "{}");
      whisper = !!s.whisper;
      if (s.armed && s.started) { armed = true; started = s.started; beats = s.beats || beats; }
    } catch (e) {}
  }
  function remembered() {
    var list = g.ChirombeThrone && g.ChirombeThrone.getFamily ? g.ChirombeThrone.getFamily() : [];
    var spirits = list.filter(function (m) { return m.remembrance || m.role === "SPIRIT"; });
    return spirits.length ? spirits : list;
  }
  function log(msg) {
    if (g.ChirombeThrone && g.ChirombeThrone.log) g.ChirombeThrone.log("WATCH", msg);
    var feed = document.getElementById("watch-live"); if (!feed) return;
    var el = document.createElement("div"); el.textContent = new Date().toLocaleTimeString() + "  " + msg; feed.prepend(el);
    while (feed.children.length > 16) feed.removeChild(feed.lastChild);
  }
  function pulsePeace() {
    beats.peace += 1; last.peace = now();
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulse) g.CHIROMBE_GRAPH.pulse();
    log("77 · peace cadence · House held");
  }
  function pulseProtect() {
    beats.protect += 1; last.protect = now();
    if (g.ChirombeBus) g.ChirombeBus.executeCommand("protect family");
    else if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulse) g.CHIROMBE_GRAPH.pulse();
    log("99 · protection cadence · cover cycle");
  }
  function pulseRemember() {
    beats.remember += 1; last.remember = now();
    var list = remembered();
    var person = list[rememberedIndex++ % Math.max(1, list.length)] || { name: "House of Masawi" };
    if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulseName) g.CHIROMBE_GRAPH.pulseName(person.name, person.id);
    else if (g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulse) g.CHIROMBE_GRAPH.pulse();
    log("33 · remembrance · " + person.name);
    if (whisper && g.speechSynthesis && document.hasFocus()) {
      try { var u = new SpeechSynthesisUtterance("Mwari ndi Mwari. " + person.name + " is remembered."); u.rate = 0.86; u.volume = 0.4; speechSynthesis.speak(u); } catch (e) {}
    }
  }
  function paint() {
    var state = document.getElementById("watch-state");
    var up = document.getElementById("watch-uptime");
    var p77 = document.getElementById("watch-77");
    var p99 = document.getElementById("watch-99");
    var p33 = document.getElementById("watch-33");
    var pill = document.getElementById("watch-pill");
    var next = document.getElementById("watch-next");
    var sec = elapsed();
    if (state) state.textContent = armed ? "ARMED" : "SLEEP";
    if (pill) pill.textContent = armed ? "ARMED" : "SLEEP";
    if (up) up.textContent = armed ? sec + "s" : "0s";
    if (p77) p77.textContent = String(beats.peace);
    if (p99) p99.textContent = String(beats.protect);
    if (p33) p33.textContent = String(beats.remember);
    if (next) next.textContent = armed ? ("33 in " + (33 - (sec % 33)) + "s · 77 in " + (77 - (sec % 77)) + "s · 99 in " + (99 - (sec % 99)) + "s") : "Standby";
    var box = document.getElementById("watch-whisper"); if (box) box.checked = whisper;
  }
  function step() {
    if (!armed) return;
    var sec = elapsed();
    if (sec > 0 && sec % 33 === 0 && now() - last.remember > 1500) pulseRemember();
    if (sec > 0 && sec % 77 === 0 && now() - last.peace > 1500) pulsePeace();
    if (sec > 0 && sec % 99 === 0 && now() - last.protect > 1500) pulseProtect();
    persist(); paint();
  }
  function arm() {
    armed = true; started = started || now();
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(step, 1000);
    log("Night Watch armed. Page must stay open. Cadence is 33 / 77 / 99 seconds.");
    persist(); paint(); pulsePeace();
  }
  function sleep() {
    armed = false;
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = null;
    log("Night Watch sleeping."); persist(); paint();
  }
  function reset() { sleep(); started = 0; beats = { peace: 0, protect: 0, remember: 0 }; persist(); paint(); }
  g.CHIROMBE_WATCH = { arm: arm, sleep: sleep, reset: reset, status: function () { return { armed: armed, elapsed: elapsed(), beats: beats }; } };
  if (g.ChirombeBus) {
    g.ChirombeBus.registerCommand("watch.arm", arm, { subsystem: "watch" });
    g.ChirombeBus.registerCommand("watch.sleep", sleep, { subsystem: "watch" });
  }
  function bind() {
    restore();
    var go = document.getElementById("watch-go"); var halt = document.getElementById("watch-stop"); var clr = document.getElementById("watch-reset"); var box = document.getElementById("watch-whisper");
    if (go) go.onclick = arm; if (halt) halt.onclick = sleep; if (clr) clr.onclick = reset;
    if (box) box.onchange = function () { whisper = !!box.checked; persist(); };
    paint(); if (armed) arm();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
