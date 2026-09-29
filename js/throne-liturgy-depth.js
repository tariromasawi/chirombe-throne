(function (g) {
  "use strict";
  if (g.__THRONE_LITURGY_DEPTH__) return;
  g.__THRONE_LITURGY_DEPTH__ = true;
  var KEY = "CHIROMBE_LITURGY_PRIVACY_V1";
  var THEMES = ["PROTECTION", "TRUTH", "PEACE", "WISDOM", "UNITY", "REMEMBRANCE", "COURAGE", "HOPE"];
  var MORE_KJV = [
    { ref: "Psalm 16:8", text: "I have set the Lord always before me: because he is at my right hand, I shall not be moved." },
    { ref: "Psalm 34:4", text: "I sought the Lord, and he heard me, and delivered me from all my fears." },
    { ref: "Psalm 37:5", text: "Commit thy way unto the Lord; trust also in him; and he shall bring it to pass." },
    { ref: "Psalm 46:10", text: "Be still, and know that I am God." },
    { ref: "Psalm 55:22", text: "Cast thy burden upon the Lord, and he shall sustain thee." },
    { ref: "Psalm 90:17", text: "And let the beauty of the Lord our God be upon us: and establish thou the work of our hands upon us." },
    { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path." },
    { ref: "Isaiah 40:31", text: "But they that wait upon the Lord shall renew their strength." },
    { ref: "Micah 6:8", text: "What doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?" },
    { ref: "Matthew 6:13", text: "And lead us not into temptation, but deliver us from evil." },
    { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest." },
    { ref: "Romans 12:12", text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer." },
    { ref: "Romans 15:13", text: "Now the God of hope fill you with all joy and peace in believing." },
    { ref: "2 Timothy 1:7", text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind." },
    { ref: "James 1:5", text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally." }
  ];
  var PARA = { en: ["Let this remain a quiet work of care.","May the House keep its gates with wisdom.","Peace first. Then courage. Then truth.","No spectacle. Only the names we are authorised to hold.","What is spoken here is devotion, not a sensor report."], sn: ["Ngakuve basa rakanyarara rerudo.","Imba ngaiichengete masuwo ayo nouchenjeri.","Rugare kutanga. Ushingi. Chokwadi.","Kwete chiratidziro. Mazita atakatenderwa chete.","Zvinotaurwa pano zviri munamato, kwete chiyero."] };
  var privacy = {};
  function load(){ try{ privacy=JSON.parse(localStorage.getItem(KEY)||"{}")||{}; }catch(e){ privacy={}; } }
  function persist(){ try{ localStorage.setItem(KEY, JSON.stringify(privacy)); }catch(e){} }
  function family(){ return g.ChirombeThrone&&g.ChirombeThrone.getFamily?g.ChirombeThrone.getFamily():[]; }
  function record(person){ var id=person.id||person.name; if(!privacy[id]) privacy[id]={ consent:true, approved:true, language:"en", themes: person.remembrance?["REMEMBRANCE","PEACE"]:["PEACE","WISDOM","PROTECTION"] }; return privacy[id]; }
  function setField(id,field,value){ var row=privacy[id]||{consent:true,approved:true,language:"en",themes:["PEACE"]}; row[field]=value; privacy[id]=row; persist(); paint(); return row; }
  function toggleTheme(id,theme){ var row=record({id:id,name:id}); row.themes=row.themes||[]; var i=row.themes.indexOf(theme); if(i>=0) row.themes.splice(i,1); else row.themes.push(theme); if(!row.themes.length) row.themes=["PEACE"]; persist(); paint(); return row; }
  function eligible(options){ options=options||{}; return family().filter(function(p){ var row=record(p); if(options.requireConsent!==false && !row.consent) return false; if(options.requireApproved!==false && !row.approved) return false; return true; }); }
  function paraphrase(text,lang){ var extra=PARA[lang==="sn"?"sn":"en"]; return String(text||"")+" "+extra[(text||"").length%extra.length]; }
  function paint(){
    var box=document.getElementById("privacy-list"); if(!box) return; box.innerHTML="";
    family().forEach(function(p){
      var row=record(p), el=document.createElement("div"); el.className="member";
      el.innerHTML="<b>"+p.name+"</b>"+(row.consent?" · CONSENT":" · HELD")+(row.approved?" · APPROVED":" · WAITING")+" · "+(row.themes||[]).join(", ");
      [["consent","Consent"],["approved","Approve"]].forEach(function(pair){ var btn=document.createElement("button"); btn.className="act"; btn.textContent=pair[1]; btn.onclick=function(){ setField(p.id,pair[0],!row[pair[0]]); }; el.appendChild(btn); });
      THEMES.forEach(function(theme){ var t=document.createElement("button"); t.className="act"; t.textContent=theme; t.style.opacity=(row.themes||[]).indexOf(theme)>=0?"1":"0.45"; t.onclick=function(){ toggleTheme(p.id,theme); }; el.appendChild(t); });
      box.appendChild(el);
    });
    var count=document.getElementById("privacy-eligible"); if(count) count.textContent=String(eligible().length);
  }
  function deepenEngine(){
    var E=g.CHIROMBE_LITURGY_ENGINE; if(!E||E._deepened) return; E._deepened=true;
    var origPerson=E.generatePerson, origBlood=E.createBloodlineSession, origAdapt=E.generateAdaptive, origCompose=E.composeNext;
    E.eligible=eligible; E.privacy=function(id){ return privacy[id]||null; };
    E.generatePerson=function(person,options){
      options=options||{}; person=person||{}; var row=record(person);
      if(!options.force && (!row.consent||!row.approved)) return { type:"HELD", title:"Held", text:person.name+" is held from this session by House consent settings.", target:person.name, provenance:"Privacy gate. No prayer spoken without consent." };
      options.language=options.language||row.language; options.themes=options.themes||row.themes;
      var item=origPerson(person,options); if(item&&item.text&&item.tradition!=="KJV") item.text=paraphrase(item.text,item.language); return item;
    };
    E.createBloodlineSession=function(options){ options=options||{}; if(!eligible(options).length) return {ok:false,error:"No consented and approved members were available."}; return origBlood(options); };
    E.generateAdaptive=function(options){ var people=eligible(options); if(!people.length) return origAdapt(options); return E.generatePerson(people[0],options); };
    E.composeNext=function(kind){ if(kind==="SCRIPTURE"){ var s=MORE_KJV[Math.floor(Math.random()*MORE_KJV.length)]; return { type:"SCRIPTURE", title:s.ref, text:s.ref+". "+s.text, tradition:"KJV", source:"KJV public-domain excerpt", provenance:"Authorized King James Version. Public-domain excerpt. Not a House composition." }; } return origCompose(kind); };
    E.MORE_KJV=MORE_KJV;
  }
  load();
  g.CHIROMBE_LITURGY_PRIVACY={ eligible:eligible, setField:setField, toggleTheme:toggleTheme, record:record, paraphrase:paraphrase, getStatus:function(){ return {people:Object.keys(privacy).length,eligible:eligible().length}; } };
  g.CHIROMBE_AUDIO=g.CHIROMBE_AUDIO||{}; g.CHIROMBE_AUDIO.Privacy=g.CHIROMBE_LITURGY_PRIVACY;
  function bind(){ deepenEngine(); paint(); setTimeout(paint,700); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bind); else bind();
})(window);
