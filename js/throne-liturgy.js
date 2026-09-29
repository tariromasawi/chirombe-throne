(function (g) {
  "use strict";
  if (g.__THRONE_LITURGY__) return;
  g.__THRONE_LITURGY__ = true;
  var SCRIPTURE = [
    { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
    { ref: "Psalm 27:1", text: "The Lord is my light and my salvation; whom shall I fear?" },
    { ref: "Psalm 46:1", text: "God is our refuge and strength, a very present help in trouble." },
    { ref: "Psalm 91:1", text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty." },
    { ref: "Psalm 121:7-8", text: "The Lord shall preserve thee from all evil: he shall preserve thy soul." },
    { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding." },
    { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God." },
    { ref: "Matthew 5:9", text: "Blessed are the peacemakers: for they shall be called the children of God." },
    { ref: "John 14:27", text: "Peace I leave with you, my peace I give unto you." },
    { ref: "Philippians 4:7", text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
    { ref: "Numbers 6:24", text: "The Lord bless thee, and keep thee." },
    { ref: "Ephesians 6:10", text: "Finally, my brethren, be strong in the Lord, and in the power of his might." }
  ];
  var SEQ = ["SCRIPTURE", "PRAYER", "BLOODLINE", "REFLECTION", "MASOWE", "REMEMBRANCE", "ORIGINAL"];
  var MODE_HZ = { PEACE: 77, PROTECTION: 99, REMEMBRANCE: 33, FAMILY_BLESSING: 136.1, GROUNDING: 64 };
  var scriptureIndex = 0, personIndex = 0, cycle = 0, queue = [], current = null;
  var unlocked = false, active = false, paused = false, speaking = false, completed = 0, mode = "PEACE";
  function family() {
    if (g.ChirombeThrone && g.ChirombeThrone.getFamily) return g.ChirombeThrone.getFamily();
    if (g.ChirombeCore && g.ChirombeCore.family && g.ChirombeCore.family.length) return g.ChirombeCore.family;
    return [{ name: "House of Masawi" }];
  }
  function nextPerson() {
    var f = family();
    var p = f[personIndex % Math.max(1, f.length)] || { name: "House of Masawi" };
    personIndex++; return p;
  }
  function enqueue(item) {
    if (!item || !item.text) return false;
    if (queue.filter(function (x) { return !x.completed; }).length >= 24) return false;
    item.id = item.id || ("LQ-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
    item.completed = false; queue.push(item); return true;
  }
  function peek() { for (var i = 0; i < queue.length; i++) if (!queue[i].completed) return queue[i]; return null; }
  function markDone(itemId) { queue.forEach(function (x) { if (x.id === itemId) x.completed = true; }); }
  function pending() { return queue.filter(function (x) { return !x.completed; }).length; }
  function scripture() { var s = SCRIPTURE[scriptureIndex++ % SCRIPTURE.length]; return { type: "SCRIPTURE", title: s.ref, text: s.ref + ". " + s.text }; }
  function bloodline() {
    var p = nextPerson();
    var memorial = !!(p.remembrance || /Corinna|Rhodha|Abigail/i.test(p.name || ""));
    var text = memorial
      ? ("Mwari ndi Mwari. In remembrance of " + p.name + ". May dignity and love remain with this House.")
      : ("Mwari ndi Mwari. For " + p.name + ". May peace, wisdom and protection remain with this authorised branch of the House of Masawi.");
    return { type: memorial ? "REMEMBRANCE" : "INTERCESSION", title: "For " + p.name, text: text, target: p.name };
  }
  function masowe() { return { type: "MASOWE", title: "Masowe", text: "Mwari ndi Mwari. Mudzimu Unoyera, titungamirire muchokwadi. Rugare, huchenjeri nesimba rezvakanaka ngazvigare paImba yeMasawi." }; }
  function original() { return { type: "ORIGINAL", title: "House devotion", text: "Mwari ndi Mwari. May truth stand at every gate of the House of Masawi. This is an original devotion, not extra scripture." }; }
  function reflection() { return { type: "REFLECTION", title: "Reflection", text: "We pause. Sensors remain measurements. Prayer remains prayer. May wisdom increase where fear once stood." }; }
  function prayer() { return { type: "PRAYER", title: "House prayer", text: "Mwari ndi Mwari. May peace, wisdom and protection remain over the House and every descendant branch." }; }
  function compose(type) {
    if (type === "SCRIPTURE") return scripture();
    if (type === "BLOODLINE" || type === "INTERCESSION") return bloodline();
    if (type === "REMEMBRANCE") { var r = bloodline(); r.type = "REMEMBRANCE"; return r; }
    if (type === "MASOWE") return masowe();
    if (type === "ORIGINAL") return original();
    if (type === "REFLECTION") return reflection();
    return prayer();
  }
  function fill() { var guard = 0; while (pending() < 6 && guard < 12) { enqueue(compose(SEQ[cycle++ % SEQ.length])); guard++; } }
  function voices() { try { return speechSynthesis.getVoices() || []; } catch (e) { return []; } }
  function chooseVoice() {
    var list = voices(), prefer = ["en-GB", "en-US", "en"];
    for (var i = 0; i < prefer.length; i++) for (var j = 0; j < list.length; j++) if ((list[j].lang || "").indexOf(prefer[i]) === 0) return list[j];
    return list[0] || null;
  }
  function unlock() {
    unlocked = true;
    try { speechSynthesis.resume(); } catch (e) {}
    if (g.ChirombeAudio && g.ChirombeAudio.startField) try { g.ChirombeAudio.startField(); } catch (e2) {}
    return unlocked;
  }
  function speak(item) {
    if (!("speechSynthesis" in g) || !unlocked || !item || !item.text) return false;
    try { speechSynthesis.cancel(); } catch (e) {}
    var u = new SpeechSynthesisUtterance(item.text);
    var v = chooseVoice(); if (v) u.voice = v;
    u.rate = 0.88; u.pitch = 1;
    u.onstart = function () { speaking = true; paint(); };
    u.onend = function () { speaking = false; markDone(item.id); completed++; current = null; paint(); if (active && !paused) setTimeout(speakNext, 900); };
    u.onerror = function () { speaking = false; current = null; paint(); if (active && !paused) setTimeout(speakNext, 400); };
    speechSynthesis.speak(u); return true;
  }
  function speakNext() {
    if (!active || paused) return;
    if (!unlocked) { paint(); return; }
    if (speaking || (g.speechSynthesis && speechSynthesis.speaking)) return;
    fill(); var item = peek(); if (!item) { paint(); return; }
    current = item; speak(item); paint();
    if (g.ChirombeThrone) g.ChirombeThrone.log("LITURGY", item.type + " · " + item.title);
    if ((item.type === "INTERCESSION" || item.type === "REMEMBRANCE") && g.ChirombeBus) g.ChirombeBus.executeCommand("protect family");
  }
  function activate() { unlock(); active = true; paused = false; fill(); speakNext(); paint(); }
  function pause() { paused = true; try { speechSynthesis.pause(); } catch (e) {} paint(); }
  function resume() { paused = false; active = true; try { speechSynthesis.resume(); } catch (e) {} if (!speaking) speakNext(); paint(); }
  function stop() { active = false; paused = false; speaking = false; try { speechSynthesis.cancel(); } catch (e) {} current = null; paint(); }
  function setMode(next) { mode = next || "PEACE"; paint(); }
  function paint() {
    var health = document.getElementById("liturgy-health");
    var cur = document.getElementById("liturgy-current");
    var q = document.getElementById("liturgy-queue");
    var done = document.getElementById("liturgy-done");
    var voice = document.getElementById("liturgy-voice");
    var modeEl = document.getElementById("liturgy-mode");
    if (health) health.textContent = !unlocked ? "LOCKED" : paused ? "PAUSED" : speaking ? "SPEAKING" : active ? "READY" : "STANDBY";
    if (cur) cur.textContent = current ? (current.title + "\n" + current.text) : "Living liturgy ready. One tap unlocks speech. Then each prayer finishes before the next starts.";
    if (q) q.textContent = String(pending());
    if (done) done.textContent = String(completed);
    if (voice) voice.textContent = unlocked ? (chooseVoice() ? chooseVoice().name : "DEFAULT") : "TAP TO UNLOCK";
    if (modeEl) modeEl.textContent = mode + " · " + (MODE_HZ[mode] || 77) + " Hz";
  }
  g.CHIROMBE_LITURGY = { activate: activate, start: activate, pause: pause, resume: resume, stop: stop, next: speakNext, setMode: setMode, status: function () { return { active: active, paused: paused, speaking: speaking, queue: pending(), completed: completed, unlocked: unlocked, mode: mode, voices: voices().length }; } };
  if (g.ChirombeBus) {
    g.ChirombeBus.registerCommand("liturgy.start", activate, { subsystem: "liturgy" });
    g.ChirombeBus.registerCommand("liturgy.stop", stop, { subsystem: "liturgy" });
    g.ChirombeBus.registerCommand("liturgy.next", speakNext, { subsystem: "liturgy" });
  }
  function bind() {
    var go = document.getElementById("liturgy-go");
    var pauseBtn = document.getElementById("liturgy-pause");
    var end = document.getElementById("liturgy-end");
    var next = document.getElementById("liturgy-next");
    var modeSel = document.getElementById("liturgy-mode-select");
    if (go) go.onclick = activate;
    if (pauseBtn) pauseBtn.onclick = function () { if (paused) resume(); else pause(); };
    if (end) end.onclick = stop;
    if (next) next.onclick = function () { try { speechSynthesis.cancel(); } catch (e) {} speaking = false; speakNext(); };
    if (modeSel) modeSel.onchange = function () { setMode(modeSel.value); };
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
