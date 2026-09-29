(function () {
  "use strict";
  var canvas = document.getElementById("matrix");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var letters = "77 99 33 MWARI 777 999 333 ZION 01".split(" ");
  var drops = [];
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var cols = Math.floor(canvas.width / 18);
    drops = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.random() * canvas.height;
  }
  function draw() {
    ctx.fillStyle = "rgba(2,3,7,0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(109,255,178,0.55)";
    ctx.font = "13px ui-monospace, monospace";
    for (var i = 0; i < drops.length; i++) {
      var text = letters[Math.floor(Math.random() * letters.length)];
      ctx.fillText(text, i * 18, drops[i] * 18);
      if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  window.addEventListener("resize", resize);
  resize();
  draw();
})();
