(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_PERF__) return;
  g.__THRONE_AUDIO_PERF__ = true;
  var PACKS = {
    en: {
      name: "English",
      chant: ["Peace in this House.", "Wisdom at every gate.", "The circle remains."],
      call: [
        { call: "Who keeps this House?", response: "The living God, and this authorised circle." },
        { call: "What do we refuse?", response: "Fear without wisdom, and spectacle without love." },
        { call: "What remains?", response: "Peace, protection, wisdom, unity and strength." }
      ],
      meditate: ["Sit. Let the breath lengthen.", "Name no enemy. Hold the House.", "Silence is also cover.", "Return. The circle is still here."]
    },
    sh: {
      name: "Shona",
      chant: ["Mwari ndi Mwari.", "Mudzimu Unoyera.", "Rugare pamusha."],
      call: [
        { call: "Ndiani anochengeta Imba?", response: "Mwari mupenyu, nedzinza rakatenderwa." },
        { call: "Chii chatinoramba?", response: "Kutya pasina huchenjeri." },
        { call: "Chii chinosara?", response: "Rugare, huchenjeri, kubatana nesimba." }
      ],
      meditate: ["Garai. Fema zvishoma.", "Regai kutya kutaura.", "Runyararo rwuri cover.", "Dzokai. Denderedzwa richipo."]
    }
  };
  var state = { lang: "en", voiceURI: "", rate: 0.92, pitch: 0.92, mode: "IDLE", step: 0, running: false, lastHeard: "", voices: [] };
  var timer = null, rec = null;
  function pack() { return PACKS[state.lang] || PACKS.en; }
  function safety() { return g.CHIROMBE_AUDIO_SAFETY; }
  function log(msg) { if (g.ChirombeThrone) g.ChirombeThrone.log("CHAMBER", msg); }
  function paint() {
    var mode = document.getElementById("perf-mode"), step = document.getElementById("perf-step"), text = document.getElementById("perf-text"), heard = document.getElementById("perf-heard"), lang = document.getElementById("perf-lang-state");
    if (mode) mode.textContent = state.mode; if (step) step.textContent = String(state.step);
    if (lang) lang.textContent = pack().name.toUpperCase(); if (heard) heard.textContent = state.lastHeard || "—";
  }
  function show(line) { var text = document.getElementById("perf-text"); if (text) text.textContent = line; }
  function refreshVoices() {
    if (!("speechSynthesis" in g)) return [];
    state.voices = speechSynthesis.getVoices() || [];
    var sel = document.getElementById("perf-voice"); if (!sel) return state.voices;
    var keep = sel.value; sel.innerHTML = "";
    var opt0 = document.createElement("option"); opt0.value = ""; opt0.textContent = "Default voice"; sel.appendChild(opt0);
    state.voices.forEach(function (v) { var o = document.createElement("option"); o.value = v.voiceURI; o.textContent = v.name + (v.lang ? " · " + v.lang : ""); sel.appendChild(o); });
    if (keep) sel.value = keep; return state.voices;
  }
  function chooseVoice() {
    var list = state.voices.length ? state.voices : (("speechSynthesis" in g) ? speechSynthesis.getVoices() : []);
    if (state.voiceURI) for (var i = 0; i < list.length; i++) if (list[i].voiceURI === state.voiceURI) return list[i];
    for (var j = 0; j < list.length; j++) if (/en/i.test(list[j].lang || "")) return list[j];
    return list[0] || null;
  }
  function speak(line, after) {
    if (!("speechSynthesis" in g)) { if (after) after(); return; }
    if (safety()) safety().registerUserGesture();
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(line), v = chooseVoice();
    if (v) u.voice = v; u.rate = state.rate; u.pitch = state.pitch; u.lang = (v && v.lang) || "en-GB";
    if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(true);
    u.onend = function () { if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(false); if (after) after(); };
    show(line); speechSynthesis.speak(u);
  }
  function stop() {
    state.running = false; state.mode = "IDLE";
    if (timer) { clearTimeout(timer); timer = null; }
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
    if ("speechSynthesis" in g) speechSynthesis.cancel();
    if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.setVoiceDuck) g.CHIROMBE_AUDIO_TONAL.setVoiceDuck(false);
    paint(); log("chamber closed");
  }
  function chant() {
    stop(); state.running = true; state.mode = "CHANT"; state.step = 0;
    var lines = pack().chant; if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene("UNITY");
    function next() {
      if (!state.running) return;
      if (state.step >= 9) { stop(); show("Chant complete. The circle is still."); return; }
      var line = lines[state.step++ % lines.length]; paint();
      if (g.CHIROMBE_AUDIO_TONAL && g.CHIROMBE_AUDIO_TONAL.playPulse) g.CHIROMBE_AUDIO_TONAL.playPulse(77 + (state.step % 3) * 11, 1);
      speak(line, function () { timer = setTimeout(next, 700); });
    }
    log("chant · " + pack().name); next();
  }
  function listenOnce(done) {
    var SR = g.SpeechRecognition || g.webkitSpeechRecognition;
    if (!SR) { state.lastHeard = "Tap Answer — no speech recognition in this browser."; paint(); if (done) done(""); return; }
    try {
      rec = new SR(); rec.lang = "en-GB"; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onresult = function (ev) { state.lastHeard = (ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || ""; paint(); if (done) done(state.lastHeard); };
      rec.onerror = function () { if (done) done(""); }; rec.onend = function () { rec = null; };
      rec.start(); show("Listening for the House response…");
    } catch (e) { if (done) done(""); }
  }
  function callResponse() {
    stop(); state.running = true; state.mode = "CALL"; state.step = 0;
    var pairs = pack().call; if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene("PROTECTION");
    function nextCall() {
      if (!state.running) return;
      if (state.step >= pairs.length) { stop(); show("Call complete. The answers are kept."); return; }
      var pair = pairs[state.step]; paint();
      speak(pair.call, function () {
        show(pair.call + "\n\nYour turn. Speak, or tap Answer.");
        listenOnce(function (heard) {
          speak(heard || pair.response, function () { state.step += 1; timer = setTimeout(nextCall, 600); });
        });
      });
    }
    log("call-and-response · " + pack().name); nextCall();
  }
  function answerNow() {
    if (state.mode !== "CALL") return;
    var pairs = pack().call, pair = pairs[Math.min(state.step, pairs.length - 1)];
    if (rec) { try { rec.stop(); } catch (e) {} }
    speak(pair.response, function () {
      state.step += 1;
      if (state.step >= pairs.length) { stop(); show("Call complete. The answers are kept."); }
      else callResponse();
    });
  }
  function meditate() {
    stop(); state.running = true; state.mode = "MEDITATE"; state.step = 0;
    var lines = pack().meditate, waits = [4000, 11000, 17000, 7000];
    if (g.CHIROMBE_AUDIO_TONAL) g.CHIROMBE_AUDIO_TONAL.playScene("REMEMBRANCE");
    function next() {
      if (!state.running) return;
      if (state.step >= lines.length) { stop(); show("Meditation closed. Return when the House has need."); return; }
      var line = lines[state.step], wait = waits[state.step] || 8000; paint();
      speak(line, function () { show(line + "\n\nHold silence."); state.step += 1; timer = setTimeout(next, wait); });
    }
    log("meditation · " + pack().name); next();
  }
  function bind() {
    refreshVoices();
    if ("speechSynthesis" in g) speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    var lang = document.getElementById("perf-lang"), voice = document.getElementById("perf-voice");
    var chantBtn = document.getElementById("perf-chant"), callBtn = document.getElementById("perf-call");
    var medBtn = document.getElementById("perf-meditate"), ansBtn = document.getElementById("perf-answer"), stopBtn = document.getElementById("perf-stop");
    if (lang) lang.onchange = function () { state.lang = lang.value; paint(); };
    if (voice) voice.onchange = function () { state.voiceURI = voice.value; };
    if (chantBtn) chantBtn.onclick = chant; if (callBtn) callBtn.onclick = callResponse;
    if (medBtn) medBtn.onclick = meditate; if (ansBtn) ansBtn.onclick = answerNow; if (stopBtn) stopBtn.onclick = stop;
    paint();
  }
  g.CHIROMBE_AUDIO_PERFORMANCE = { refreshVoices: refreshVoices, setLanguage: function (c) { state.lang = c === "sh" ? "sh" : "en"; paint(); }, setVoice: function (u) { state.voiceURI = u || ""; }, chant: chant, callResponse: callResponse, submitResponse: answerNow, meditation: meditate, stop: stop, getStatus: function () { return { mode: state.mode, step: state.step, lang: state.lang, voices: state.voices.length, heard: state.lastHeard }; } };
  g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Performance = g.CHIROMBE_AUDIO_PERFORMANCE;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
