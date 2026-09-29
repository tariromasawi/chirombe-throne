(function (g) {
  "use strict";
  if (g.__THRONE_AUDIO_LIBRARY__) return;
  g.__THRONE_AUDIO_LIBRARY__ = true;
  var SCRIPTURE = [
    { ref: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want.", tradition: "KJV" },
    { ref: "Psalm 27:1", text: "The Lord is my light and my salvation; whom shall I fear?", tradition: "KJV" },
    { ref: "Psalm 46:1", text: "God is our refuge and strength, a very present help in trouble.", tradition: "KJV" },
    { ref: "Psalm 91:1-2", text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.", tradition: "KJV" },
    { ref: "Psalm 121:7-8", text: "The Lord shall preserve thee from all evil: he shall preserve thy soul.", tradition: "KJV" },
    { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding.", tradition: "KJV" },
    { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", tradition: "KJV" },
    { ref: "Isaiah 26:3", text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee.", tradition: "KJV" },
    { ref: "Matthew 5:9", text: "Blessed are the peacemakers: for they shall be called the children of God.", tradition: "KJV" },
    { ref: "John 14:27", text: "Peace I leave with you, my peace I give unto you.", tradition: "KJV" },
    { ref: "Philippians 4:7", text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.", tradition: "KJV" },
    { ref: "Numbers 6:24-26", text: "The Lord bless thee, and keep thee: The Lord make his face shine upon thee, and be gracious unto thee.", tradition: "KJV" },
    { ref: "Ephesians 6:10", text: "Finally, my brethren, be strong in the Lord, and in the power of his might.", tradition: "KJV" },
    { ref: "Joshua 1:9", text: "Be strong and of a good courage; be not afraid, neither be thou dismayed.", tradition: "KJV" },
    { ref: "Psalm 4:8", text: "I will both lay me down in peace, and sleep: for thou, Lord, only makest me dwell in safety.", tradition: "KJV" }
  ];
  var HOUSE = {
    openings: ["Mwari ndi Mwari. Let this moment begin in peace.", "May truth stand at every gate of the House of Masawi.", "Let wisdom govern words and actions in this household."],
    protection: ["May peace, wisdom and protection remain with this authorised branch of the House.", "Let fear give way to clarity, and confusion give way to understanding."],
    remembrance: ["May dignity and love remain with this House.", "We remember with honour, not as a spectacle."],
    closing: ["Let peace remain with this household.", "May wisdom accompany every decision that follows."]
  };
  var SHONA = {
    openings: ["Mwari ndi Mwari; ngatitangei nerugare.", "Ngatitangei nguva ino nechokwadi, rugare nouchenjeri."],
    protection: ["Mwari ndi Mwari; ngapave norugare, chokwadi nouchenjeri mumhuri.", "Mudzimu Unoyera, titungamirire muchokwadi."],
    closing: ["Rugare, huchenjeri nesimba rezvakanaka ngazvigare paImba yeMasawi."]
  };
  var coverage = {}, spokenHash = [], scriptureIndex = 0;
  function family() { return (g.ChirombeThrone && g.ChirombeThrone.getFamily) ? g.ChirombeThrone.getFamily() : []; }
  function pick(arr, salt) { if (!arr || !arr.length) return ""; return arr[Math.abs(salt || spokenHash.length) % arr.length]; }
  function fingerprint(text) { var h = 77, s = String(text || ""); for (var i = 0; i < s.length; i++) h = ((h * 99) ^ s.charCodeAt(i) ^ 33) >>> 0; return ("00000000" + h.toString(16)).slice(-8); }
  function isNovel(text) { return spokenHash.indexOf(fingerprint(text)) === -1; }
  function remember(text) { var fp = fingerprint(text); spokenHash.unshift(fp); if (spokenHash.length > 80) spokenHash.pop(); return fp; }
  function markCoverage(person) {
    var id = (person && (person.id || person.name)) || "HOUSE";
    if (!coverage[id]) coverage[id] = { name: person && person.name || id, spoken: 0, remembered: 0 };
    coverage[id].spoken += 1; if (person && person.remembrance) coverage[id].remembered += 1; return coverage[id];
  }
  function getCoverage() {
    var rows = family().map(function (m) { var row = coverage[m.id] || coverage[m.name] || { spoken: 0, remembered: 0 }; return { id: m.id, name: m.name, spoken: row.spoken || 0, remembered: row.remembered || 0, covered: (row.spoken || 0) > 0 }; });
    var covered = rows.filter(function (r) { return r.covered; }).length;
    return { total: rows.length, covered: covered, pending: Math.max(0, rows.length - covered), ratio: rows.length ? covered / rows.length : 0, people: rows };
  }
  function scripture() { var s = SCRIPTURE[scriptureIndex++ % SCRIPTURE.length]; return { type: "SCRIPTURE", title: s.ref, text: s.ref + ". " + s.text, source: "KJV public-domain excerpt", tradition: "KJV", provenance: "Authorized King James Version, public domain in most jurisdictions." }; }
  function personPrayer(person, theme) {
    person = person || { name: "House of Masawi" };
    var memorial = !!(person.remembrance || theme === "REMEMBRANCE");
    var line = memorial ? pick(HOUSE.remembrance) : pick(HOUSE.protection);
    var text = (pick(HOUSE.openings) + " " + (memorial ? "In remembrance of " : "For ") + person.name + ". " + line);
    if (!isNovel(text)) text += " May this circle remain distinct and at peace.";
    markCoverage(person); remember(text);
    return { type: memorial ? "REMEMBRANCE" : "INTERCESSION", title: "For " + person.name, text: text, target: person.name, targetId: person.id, tradition: "HOUSE", provenance: "Original House devotion. Not extra scripture." };
  }
  function masowe() { var text = pick(SHONA.openings) + " " + pick(SHONA.protection) + " " + pick(SHONA.closing); remember(text); return { type: "MASOWE", title: "Masowe", text: text, tradition: "SHONA_HOUSE", provenance: "House Shona devotion. Distinct from KJV scripture." }; }
  function houseLine(kind) { var text = pick(HOUSE[kind] || HOUSE.openings); remember(text); return { type: "ORIGINAL", title: "House devotion", text: "Mwari ndi Mwari. " + text, tradition: "HOUSE", provenance: "Original House devotion. Not extra scripture." }; }
  var API = { SCRIPTURE: SCRIPTURE, scripture: scripture, personPrayer: personPrayer, masowe: masowe, houseLine: houseLine, getCoverage: getCoverage, isNovel: isNovel, remember: remember, traditions: { KJV: "Public-domain KJV excerpts only.", HOUSE: "Original Masawi house lines. Not scripture.", SHONA_HOUSE: "Shona house devotion. Not blended into KJV." } };
  g.CHIROMBE_AUDIO_TRADITION_LIBRARY = API; g.CHIROMBE_AUDIO = g.CHIROMBE_AUDIO || {}; g.CHIROMBE_AUDIO.Library = API;
})(window);
