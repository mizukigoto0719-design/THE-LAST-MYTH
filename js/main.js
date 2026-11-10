/* =========================================================
   最後の神話 - THE LAST MYTH -   main.js  (Vanilla JS)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqMobile = window.matchMedia('(max-width: 640px)');
  var reduce = mqReduce.matches;
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', function (e) { reduce = e.matches; });
  var hasIO = 'IntersectionObserver' in window;
  var html = document.documentElement;

  /* ---------- fallback image (missing files) ---------- */
  var FALLBACK = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">' +
    '<defs><radialGradient id="g" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#4a0d0d"/><stop offset="1" stop-color="#0a0908"/></radialGradient></defs>' +
    '<rect width="1200" height="800" fill="url(#g)"/>' +
    '<circle cx="600" cy="330" r="120" fill="#8b0000" opacity=".55"/>' +
    '<path d="M0 800V620l80-40 60 60 90-120 70 90 120-180 90 140 110-200 100 170 80-90 120 150 110-110 170 180v130z" fill="#050303"/>' +
    '<text x="600" y="420" text-anchor="middle" font-family="serif" font-size="34" letter-spacing="14" fill="#D4AF37" opacity=".7">THE LAST MYTH</text></svg>'
  );
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && !t.dataset.fallback) {
      t.dataset.fallback = '1';
      t.src = FALLBACK;
    }
  }, true);

  /* ---------- scroll lock ---------- */
  var lockCount = 0;
  function lockScroll() {
    if (lockCount++ === 0) {
      var sw = window.innerWidth - html.clientWidth;
      document.body.style.paddingRight = sw > 0 ? sw + 'px' : '';
      html.classList.add('is-locked');
    }
  }
  function unlockScroll() {
    if (lockCount > 0 && --lockCount === 0) {
      html.classList.remove('is-locked');
      document.body.style.paddingRight = '';
    }
  }

  /* ---------- focus trap ---------- */
  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trapTab(e, root) {
    if (e.key !== 'Tab') return;
    var list = $$(FOCUSABLE, root).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- blackout ---------- */
  var blackout = $('#blackout');
  function setBlackout(on) { if (blackout) blackout.classList.toggle('is-on', !!on); }
  function pulseBlackout(ms) {
    if (reduce || !blackout) return;
    setBlackout(true);
    setTimeout(function () { setBlackout(false); }, ms || 450);
  }

  /* =========================================================
     MENU
     ========================================================= */
  var menu = $('#menu'), menuOpenBtn = $('#menuOpen'), menuCloseBtn = $('#menuClose');
  var menuOpen = false;
  function openMenu() {
    if (!menu || menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuOpenBtn.setAttribute('aria-expanded', 'true');
    lockScroll();
    setTimeout(function () { if (menuCloseBtn) menuCloseBtn.focus(); }, 60);
  }
  function closeMenu(returnFocus) {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuOpenBtn.setAttribute('aria-expanded', 'false');
    unlockScroll();
    if (returnFocus !== false) menuOpenBtn.focus();
  }
  if (menuOpenBtn) menuOpenBtn.addEventListener('click', openMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener('click', function () { closeMenu(); });

  /* =========================================================
     SMOOTH SCROLL (links with data-scroll)
     ========================================================= */
  function scrollToId(id, instant) {
    var target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    var behavior = (reduce || instant) ? 'auto' : 'smooth';
    if (id === 'top') window.scrollTo({ top: 0, behavior: behavior });
    else {
      var y = target.getBoundingClientRect().top + window.pageYOffset;
      var offset = (id === 'story' || id === 'boss' || id === 'gallery' || id === 'special') ? 0 : 0;
      window.scrollTo({ top: y - offset, behavior: behavior });
    }
  }
  $$('a[data-scroll]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href.length < 2) return;
      e.preventDefault();
      var id = href.slice(1);
      var wasMenu = menuOpen;
      if (wasMenu) closeMenu(false);
      // wait a beat so the unlocked scroll position is stable
      setTimeout(function () { scrollToId(id); }, wasMenu ? 120 : 0);
      if (history.replaceState) { try { history.replaceState(null, '', '#' + id); } catch (err) { /* file:// etc. */ } }
    });
  });

  /* =========================================================
     MODAL manager
     ========================================================= */
  var activeModal = null, lastTrigger = null;
  function openModal(el, trigger) {
    if (!el) return;
    if (activeModal) closeModal(true);
    activeModal = el; lastTrigger = trigger || document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    lockScroll();
    var c = $('[data-close]', el);
    setTimeout(function () { if (c) c.focus(); }, 60);
  }
  function closeModal(silent) {
    if (!activeModal) return;
    var el = activeModal; activeModal = null;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    unlockScroll();
    if (!silent && lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }
  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m || e.target.closest('[data-close]')) closeModal(); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      if (activeModal) { closeModal(); return; }
      if (menuOpen) { closeMenu(); return; }
    }
    if (activeModal) {
      trapTab(e, activeModal);
      if (activeModal.id === 'galleryModal') {
        if (e.key === 'ArrowLeft') gShow(gIndex - 1);
        if (e.key === 'ArrowRight') gShow(gIndex + 1);
      }
    } else if (menuOpen) {
      trapTab(e, menu);
    }
  });

  /* =========================================================
     BOSS modal
     ========================================================= */
  var BOSSES = [
    {
      no: 'No.01', name: '堕天の守護者 ノクス', title: '血涙の石像', img: 'images/boss-1.svg',
      weak: '聖なる炎、または古の呪文。石の身体は炎の浄化に弱く、胸の呪印が露出した瞬間が最大の好機となる。',
      ability: '「血涙の雨」: 周囲一帯に呪われた血を降らせ、継続ダメージを与える。「羽ばたきの断罪」: 石の翼で衝撃波を放つ。',
      story: 'かつて神々の聖堂を守護した天使。神々の消失を目撃した瞬間、その双眸から血の涙が流れ始め、慈悲は憎悪へと反転した。今も崩れた聖堂で、訪れる者すべてに裁きを下している。',
      reward: '【堕天使の羽根】/ 呪印の欠片(第一印)'
    },
    {
      no: 'No.02', name: '灰燼の王 ヴァルグレイヴ', title: '滅びの王都を統べし者', img: 'images/boss-2.svg',
      weak: '兜の継ぎ目と、玉座の記憶を宿す王冠。王冠を砕くと一時的に動きが止まる。雷撃・祝福属性に弱い。',
      ability: '「灰燼の号令」: 亡者の騎士団を召喚。「終末の斬撃」: 王剣による広範囲の薙ぎ払いと炎の波。',
      story: '王都が崩壊した夜、民を見捨てて玉座に留まり続けた最後の王。その執念は死してもなお朽ちず、灰の中から幾度も蘇っては、存在しない王国を守ろうとする。',
      reward: '【灰燼の王冠】/ 呪印の欠片(第二印)'
    },
    {
      no: 'No.03', name: '深淵の魔女 エリュシア', title: '森に沈みし祈り', img: 'images/boss-3.svg',
      weak: '額の祈りの宝珠。霧が晴れた一瞬にのみ露出する。物理攻撃より、光属性の魔法が有効。',
      ability: '「迷いの霧」: 視界を奪い、偽の幻影を生み出す。「茨の抱擁」: 地面から棘の蔓を伸ばし、動きを封じる。',
      story: '森の聖女として人々の祈りを受け止め続けた女性。神々が沈黙した後、届かぬ祈りが彼女の内側で膨れ上がり、やがて森そのものを呑み込む呪いへと変わった。',
      reward: '【祈りの宝珠】/ 呪印の欠片(第三印)'
    },
    {
      no: 'No.04', name: '終焉の創造主 ヴォイド・ゼロ', title: '世界を統べた者の残骸', img: 'images/boss-4.svg',
      weak: '不明。戦闘中に浮かび上がる七つの呪印を順に破壊することでのみ、本体への攻撃が通る。',
      ability: '「虚無の円環」: 空間ごと対象を削り取る。「創世の逆流」: 倒したはずの敵を再構築し、戦場に再配置する。',
      story: 'かつて世界を創り、神々を生んだ存在の成れの果て。神々が自らを犠牲にして封じた「終焉」そのもの。その眠りを覚ました者こそが、最後の神話の結末を決める。',
      reward: '【創造主の核】/ 最後の神話の断章'
    }
  ];
  var bossModal = $('#bossModal');
  function openBoss(i, trigger) {
    var b = BOSSES[i]; if (!b || !bossModal) return;
    $('#bmNo').textContent = b.no;
    $('#bmName').textContent = b.name;
    $('#bmTitle').textContent = '— ' + b.title + ' —';
    $('#bmWeak').textContent = b.weak;
    $('#bmAbility').textContent = b.ability;
    $('#bmStory').textContent = b.story;
    $('#bmReward').textContent = b.reward;
    var img = $('#bmImg');
    img.removeAttribute('data-fallback');
    img.src = b.img; img.alt = b.name + 'のビジュアル';
    var box = $('.modal-box', bossModal); if (box) box.scrollTop = 0;
    openModal(bossModal, trigger);
  }
  $$('.boss-card').forEach(function (c) {
    c.addEventListener('click', function () { openBoss(parseInt(c.dataset.boss, 10), c); });
  });

  /* =========================================================
     GALLERY modal
     ========================================================= */
  var gItems = $$('.g-item');
  var gModal = $('#galleryModal'), gImg = $('#gmImg'), gIndex = 0;
  function gShow(i) {
    if (!gItems.length) return;
    gIndex = (i + gItems.length) % gItems.length;
    var src = $('img', gItems[gIndex]);
    gImg.removeAttribute('data-fallback');
    gImg.style.animation = 'none'; void gImg.offsetWidth; gImg.style.animation = '';
    gImg.src = src.getAttribute('src'); gImg.alt = src.alt;
    $('#gmTitle').textContent = src.alt;
    $('#gmCount').textContent = ('0' + (gIndex + 1)).slice(-2) + ' / ' + ('0' + gItems.length).slice(-2);
  }
  gItems.forEach(function (it, i) {
    it.addEventListener('click', function () { gShow(i); openModal(gModal, it); });
  });
  var gPrev = $('#gmPrev'), gNext = $('#gmNext');
  if (gPrev) gPrev.addEventListener('click', function () { gShow(gIndex - 1); });
  if (gNext) gNext.addEventListener('click', function () { gShow(gIndex + 1); });
  // swipe on touch
  (function () {
    var stage = $('.gm-stage'), sx = null;
    if (!stage) return;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) gShow(gIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();

  /* =========================================================
     ACCORDION (multiple open)
     ========================================================= */
  function setAcc(item, open) {
    var btn = $('.acc-trigger', item);
    item.classList.toggle('is-open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  $$('[data-accordion]').forEach(function (acc) {
    $$('.acc-item', acc).forEach(function (item) {
      var btn = $('.acc-trigger', item);
      if (!btn) return;
      btn.addEventListener('click', function () { setAcc(item, !item.classList.contains('is-open')); });
    });
  });

  /* =========================================================
     SLIDESHOW
     ========================================================= */
  (function () {
    var slides = $$('.slide'); if (!slides.length) return;
    var dotsWrap = $('#slideDots'), capNo = $('#capNo'), capTtl = $('#capTtl'), cap = $('#slideCaption');
    var cur = 0, timer = null, INTERVAL = 5000, paused = false;
    var dots = slides.map(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'スライド ' + (i + 1) + ': ' + s.dataset.title);
      b.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(b); return b;
    });
    function pad(n) { return ('0' + n).slice(-2); }
    function render() {
      slides.forEach(function (s, i) {
        var on = i === cur;
        if (on) { s.classList.remove('is-leaving'); }
        else if (s.classList.contains('is-active')) { s.classList.add('is-leaving'); }
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur); d.setAttribute('aria-selected', i === cur ? 'true' : 'false'); });
      if (cap) {
        cap.classList.add('is-changing');
        setTimeout(function () {
          capNo.textContent = pad(cur + 1) + ' / ' + pad(slides.length);
          capTtl.textContent = slides[cur].dataset.title;
          cap.classList.remove('is-changing');
        }, 450);
      }
    }
    function go(i, user) {
      cur = (i + slides.length) % slides.length;
      render();
      if (user) restart();
    }
    function start() { stop(); if (reduce || paused) return; timer = setInterval(function () { go(cur + 1); }, INTERVAL); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { start(); }
    $('#slidePrev').addEventListener('click', function () { go(cur - 1, true); });
    $('#slideNext').addEventListener('click', function () { go(cur + 1, true); });
    var hero = $('#top');
    hero.addEventListener('mouseenter', function () { paused = true; stop(); });
    hero.addEventListener('mouseleave', function () { paused = false; start(); });
    hero.addEventListener('focusin', function () { paused = true; stop(); });
    hero.addEventListener('focusout', function () { paused = false; start(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    // swipe
    var sx = null;
    hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 60) go(cur + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
    // pause when hero is off screen
    if (hasIO) {
      new IntersectionObserver(function (en) {
        paused = !en[0].isIntersecting; if (paused) stop(); else start();
      }, { threshold: 0.05 }).observe(hero);
    }
    render(); start();
  })();

  /* =========================================================
     TYPEWRITER
     ========================================================= */
  (function () {
    var target = $('#typeTarget'); if (!target) return;
    var text = target.getAttribute('data-text') || '';
    var sub = $('#copySub'), cta = $('#heroCta');
    var full = document.createElement('span'); full.className = 'sr-only'; full.textContent = text.replace(/\n/g, '');
    var typed = document.createElement('span'); typed.setAttribute('aria-hidden', 'true');
    var caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    target.removeAttribute('aria-label');
    target.textContent = '';
    target.appendChild(full); target.appendChild(typed); target.appendChild(caret);
    function finish() { if (sub) sub.classList.add('is-on'); if (cta) cta.classList.add('is-on'); }
    if (reduce) { typed.textContent = text; finish(); return; }
    var i = 0;
    function tick() {
      i++; typed.textContent = text.slice(0, i);
      if (i < text.length) {
        var ch = text.charAt(i - 1);
        setTimeout(tick, ch === '、' || ch === '\n' ? 420 : 120);
      } else { setTimeout(finish, 400); }
    }
    setTimeout(tick, 2000);
  })();

  /* =========================================================
     REVEAL (IntersectionObserver)
     ========================================================= */
  var revealEls = $$('.reveal');
  var deathSec = $('#death');
  if (hasIO) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); rio.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    if (deathSec) deathSec.classList.add('is-visible');
  }

  /* =========================================================
     SCROLL SPY
     ========================================================= */
  (function () {
    if (!hasIO) return;
    var links = $$('[data-spy]');
    var ids = ['top', 'story', 'world', 'boss', 'gallery', 'special'];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          var on = a.dataset.spy === en.target.id;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
  })();

  /* =========================================================
     PARALLAX + header state (single rAF-throttled handler)
     ========================================================= */
  var header = $('#siteHeader'), toTop = $('#toTop'), heroEl = $('#top');
  var items = [];
  function addItem(el, speed, mode, container) { items.push({ el: el, speed: speed, mode: mode, box: container, vis: true }); }
  $$('#top [data-plx]').forEach(function (el) { addItem(el, parseFloat(el.dataset.plx) || 0, 'hero', heroEl); });
  $$('.story [data-plx]').forEach(function (el) { addItem(el, parseFloat(el.dataset.plx) || 0, 'rect', el.parentElement); });
  $$('[data-wplx]').forEach(function (el) { addItem(el, parseFloat(el.dataset.wplx) || 0.12, 'clamp', el.parentElement); });
  $$('.world-panel .wno').forEach(function (el) { addItem(el, -0.1, 'rect', el.closest('.world-panel')); });

  if (hasIO) {
    items.forEach(function (it) {
      new IntersectionObserver(function (en) { it.vis = en[0].isIntersecting; if (it.vis) schedule(); }, { rootMargin: '10% 0px' }).observe(it.box);
    });
  }

  var ticking = false;
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function update() {
    ticking = false;
    var y = window.pageYOffset, vh = window.innerHeight;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (toTop) toTop.classList.toggle('is-show', y > vh * 0.9);
    if (reduce) return;
    var k = mqMobile.matches ? 0.4 : 1;
    for (var i = 0; i < items.length; i++) {
      var it = items[i]; if (!it.vis) continue;
      var t = 0;
      if (it.mode === 'hero') {
        t = y * it.speed * k;
      } else {
        var r = it.box.getBoundingClientRect();
        var off = (r.top + r.height / 2) - vh / 2;
        t = -off * it.speed * k * (it.mode === 'rect' && it.speed < 0 ? -1 : 1);
        if (it.mode === 'clamp') {
          var margin = Math.max(0, (it.el.offsetHeight - it.box.offsetHeight) / 2 * 0.95);
          t = Math.max(-margin, Math.min(margin, t));
        }
      }
      it.el.style.transform = 'translate3d(0,' + t.toFixed(1) + 'px,0)';
    }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();

  /* =========================================================
     DEATH TRAP: section blackout, glitch, hidden-chapel link
     ========================================================= */
  (function () {
    if (!deathSec) return;
    var text = $('#youDied'), inView = false, firstFlash = true;
    function glitch() {
      if (!text || reduce) return;
      text.classList.remove('is-glitch'); void text.offsetWidth;
      text.classList.add('is-glitch');
      setTimeout(function () { text.classList.remove('is-glitch'); }, 480);
    }
    function loop() {
      if (inView) glitch();
      setTimeout(loop, 3200 + Math.random() * 3200);
    }
    if (hasIO) {
      new IntersectionObserver(function (en) {
        inView = en[0].isIntersecting;
        if (inView) {
          deathSec.classList.add('is-visible');
          if (firstFlash) { firstFlash = false; pulseBlackout(380); setTimeout(glitch, 500); }
        }
      }, { threshold: 0.45 }).observe(deathSec);
    }
    if (text) { text.addEventListener('mouseenter', glitch); text.addEventListener('click', glitch); }
    loop();

    var link = $('#hiddenLink');
    if (link) link.addEventListener('click', function (e) {
      e.preventDefault();
      function reveal() {
        scrollToId('special', true);
        var first = $('#specialAcc .acc-item');
        if (first) setAcc(first, true);
        var h = $('#specialTitle'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
      if (reduce) { reveal(); return; }
      setBlackout(true);
      setTimeout(function () { reveal(); setTimeout(function () { setBlackout(false); }, 350); }, 750);
    });
  })();

  /* =========================================================
     EMBERS (rising flame particles)
     ========================================================= */
  (function () {
    var cv = $('#embers'); if (!cv || reduce || !cv.getContext) return;
    var ctx = cv.getContext('2d'), w = 0, h = 0, dpr = 1, ps = [], running = true;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, w / (mqMobile.matches ? 14 : 22)));
      while (ps.length < n) ps.push(spawn(true));
      ps.length = n;
    }
    function spawn(init) {
      return {
        x: Math.random() * w, y: init ? Math.random() * h : h + 10,
        r: 0.6 + Math.random() * 2.1, vy: 0.2 + Math.random() * 0.7,
        sw: Math.random() * Math.PI * 2, sp: 0.005 + Math.random() * 0.012, amp: 0.2 + Math.random() * 0.6,
        a: 0.25 + Math.random() * 0.65, hue: 8 + Math.random() * 30
      };
    }
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i];
        p.y -= p.vy; p.sw += p.sp; p.x += Math.sin(p.sw) * p.amp;
        var life = p.y / h;
        var alpha = p.a * Math.min(1, life * 2.2);
        if (p.y < -10) { ps[i] = spawn(false); continue; }
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ',100%,58%,' + (alpha * 0.18).toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.2832); ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = 'hsla(' + p.hue + ',100%,62%,' + alpha.toFixed(3) + ')';
        ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) running = false;
      else if (!running) { running = true; requestAnimationFrame(frame); }
    });
    size(); requestAnimationFrame(frame);
  })();

})();
