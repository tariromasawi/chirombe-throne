(function (g) {
  "use strict";
  if (g.__THRONE_STATION__) return;
  g.__THRONE_STATION__ = true;
  var KEY = "CHIROMBE_WATCH_STATION_V1";
  var state = { stationed: false, hiddenStops: 0, resumes: 0, beats: 0, wake: null, started: null };
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ stationed: state.stationed, beats: state.beats, resumes: state.resumes, saved: new Date().toISOString() })); } catch (e) {} }
  function paint() {
    var st = document.getElementById("station-state"), beat = document.getElementById("station-beats"), vis = document.getElementById("station-vis"), wake = document.getElementById("station-wake");
    if (st) st.textContent = state.stationed ? "STATIONED" : "OPEN";
    if (beat) beat.textContent = String(state.beats);
    if (vis) vis.textContent = document.hidden ? "HIDDEN" : "SEEN";
    if (wake) wake.textContent = state.wake ? "HELD" : "NONE";
  }
  function keepAwake() {
    if (!("wakeLock" in navigator)) return Promise.resolve(false);
    return navigator.wakeLock.request("screen").then(function (lock) {
      state.wake = lock; lock.addEventListener("release", function () { state.wake = null; paint(); }); paint(); return true;
    }).catch(function () { paint(); return false; });
  }
  function goFullscreen() {
    var root = document.documentElement, req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (req) try { req.call(root); } catch (e) {}
  }
  function station() {
    state.stationed = true; state.started = Date.now(); save(); keepAwake(); goFullscreen();
    if (g.CHIROMBE_AUDIO && g.CHIROMBE_AUDIO.startBroadcast) g.CHIROMBE_AUDIO.startBroadcast();
    if (g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.arm) g.CHIROMBE_WATCH.arm();
    if (g.ChirombeThrone) g.ChirombeThrone.log("STATION", "this device is the watch altar · tab must stay open");
    paint(); return { ok: true };
  }
  function leave() {
    state.stationed = false; save();
    if (state.wake) { try { state.wake.release(); } catch (e) {} state.wake = null; }
    if (g.CHIROMBE_AUDIO && g.CHIROMBE_AUDIO.stopBroadcast) g.CHIROMBE_AUDIO.stopBroadcast();
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    if (g.ChirombeThrone) g.ChirombeThrone.log("STATION", "watch station left"); paint();
  }
  function heartbeat() {
    if (!state.stationed) return; state.beats += 1;
    if (!document.hidden && !state.wake) keepAwake(); save(); paint();
  }
  function onVisible() {
    paint();
    if (!state.stationed || document.hidden) return;
    state.resumes += 1; keepAwake();
    if (g.CHIROMBE_AUDIO && g.CHIROMBE_AUDIO.startBroadcast) g.CHIROMBE_AUDIO.startBroadcast();
    if (g.ChirombeThrone) g.ChirombeThrone.log("STATION", "tab seen again · watch resumed");
  }
  document.addEventListener("visibilitychange", onVisible);
  setInterval(heartbeat, 15000);
  var prior = load(); if (prior.stationed) { state.beats = prior.beats || 0; state.resumes = prior.resumes || 0; }
  g.CHIROMBE_WATCH_STATION = { station: station, leave: leave, getStatus: function () { return { stationed: state.stationed, beats: state.beats, resumes: state.resumes, hidden: document.hidden, wake: !!state.wake }; } };
  g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Station = g.CHIROMBE_WATCH_STATION;
  function bind() {
    var go = document.getElementById("station-go"), stop = document.getElementById("station-leave");
    if (go) go.onclick = station; if (stop) stop.onclick = leave;
    if (prior.stationed) { var note = document.getElementById("station-note"); if (note) note.textContent = "This browser remembers a stationed watch. Tap Station this device to resume after refresh."; }
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})(window);
