(function (g) {
  "use strict";
  if (g.__THRONE_LITURGY__) return;
  g.__THRONE_LITURGY__ = true;
  var SEQ = ["SCRIPTURE", "PRAYER", "BLOODLINE", "REFLECTION", "MASOWE", "REMEMBRANCE", "ORIGINAL"];
  var queue = [], current = null, unlocked = false, active = false, paused = false, speaking = false, completed = 0, cycle = 0, mode = "PEACE";
  function pending() { return queue.filter(function (x) { return !x.completed; }).length; }
  function enqueue(item) { if (!item || !item.text) return false; item.id = item.id || ("LQ-" + Date.now().toString(36)); item.completed = false; queue.push(item); return true; }
  function peek() { for (var i = 0; i < queue.length; i++) if (!queue[i].completed) return queue[i]; return null; }
  function markDone(id) { queue.forEach(function (x) { if (x.id === id) x.completed = true; }); }
  function compose(type) {
    if (g.CHIROMBE_LITURGY_ENGINE && g.CHIROMBE_LITURGY_ENGINE.composeNext) return g.CHIROMBE_LITURGY_ENGINE.composeNext(type);
    return { type: type || "PRAYER", title: "House", text: "Mwari ndi Mwari. May peace remain with this House." };
  }
  function fill() {
    var guard = 0;
    while (pending() < 6 && guard < 12) {
      if (g.CHIROMBE_LITURGY_ENGINE && g.CHIROMBE_LITURGY_ENGINE.peek) {
        var next = g.CHIROMBE_LITURGY_ENGINE.peek();
        if (next) { enqueue(next); g.CHIROMBE_LITURGY_ENGINE.complete(next.id); guard++; continue; }
      }
      enqueue(compose(SEQ[cycle % SEQ.length])); cycle++; guard++;
    }
  }
  function paint() {
    var health = document.getElementById("liturgy-health"), q = document.getElementById("liturgy-queue"), done = document.getElementById("liturgy-done"), voice = document.getElementById("liturgy-voice"), cur = document.getElementById("liturgy-current");
    if (health) health.textContent = !unlocked ? "LOCKED" : (speaking ? "SPEAKING" : (paused ? "PAUSED" : (active ? "LIVE" : "READY")));
    if (q) q.textContent = String(pending()); if (done) done.textContent = String(completed);
    if (voice) voice.textContent = unlocked ? "OPEN" : "LOCKED";
    if (cur) cur.textContent = current ? ((current.title || current.type) + "\n" + current.text + (current.provenance ? "\n\n" + current.provenance : "")) : "Living liturgy ready.";
  }
  function speak(item) {
    if (!("speechSynthesis" in g) || !unlocked || !item) return false;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(item.text); u.rate = 0.88;
    if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(true);
    u.onstart = function () { speaking = true; if (item.target && g.CHIROMBE_GRAPH && g.CHIROMBE_GRAPH.pulseName) g.CHIROMBE_GRAPH.pulseName(item.target); paint(); };
    u.onend = function () { speaking = false; if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(false); markDone(item.id); completed++; current = null; paint(); if (active && !paused) setTimeout(speakNext, 800); };
    current = item; speechSynthesis.speak(u); return true;
  }
  function speakNext() { fill(); var item = peek(); if (!item) { active = false; paint(); return; } speak(item); }
  function activate() {
    unlocked = true; active = true; paused = false;
    if (g.CHIROMBE_AUDIO_SAFETY) g.CHIROMBE_AUDIO_SAFETY.registerUserGesture();
    if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.playScene) g.CHIROMBE_AUDIO_TONAL.playScene(mode || "PEACE");
    fill(); speakNext(); paint();
  }
  function stop() { active = false; paused = false; speechSynthesis && speechSynthesis.cancel(); paint(); }
  g.CHIROMBE_LITURGY = { activate: activate, stop: stop, setMode: function (m) { mode = m; }, status: function () { return { active: active, completed: completed, pending: pending(), unlocked: unlocked }; } };
  function bind() {
    var go = document.getElementById("liturgy-go"), pause = document.getElementById("liturgy-pause"), next = document.getElementById("liturgy-next"), end = document.getElementById("liturgy-end"), sel = document.getElementById("liturgy-mode-select");
    if (go) go.onclick = activate;
    if (pause) pause.onclick = function () { paused = !paused; if (!paused && active) speakNext(); paint(); };
    if (next) next.onclick = function () { if ("speechSynthesis" in g) speechSynthesis.cancel(); speakNext(); };
    if (end) end.onclick = stop;
    if (sel) sel.onchange = function () { mode = sel.value; };
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
