/* ─────────────────────────────────────────────
   APEX LITE — global script
   ───────────────────────────────────────────── */
(function () {
  'use strict';

  var LANG = document.documentElement.lang === 'en' ? 'EN' : 'KR';

  /* ── Header state on scroll ───────────────── */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile menu ──────────────────────────────
     Every exit path closes it: the X, any link, ESC,
     a tap on empty space, resizing to desktop, and
     restoring the page from bfcache.                */
  var burger = document.getElementById('hamburger');
  var mnav = document.getElementById('mobileNav');

  function setNav(open) {
    if (!mnav || !burger) return;
    mnav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    mnav.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('nav-open', open);
    document.body.classList.toggle('nav-open', open);
    if (open) {
      var first = mnav.querySelector('.mnav-close');
      if (first) first.focus();
    }
  }

  if (burger && mnav) {
    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });

    mnav.addEventListener('click', function (e) {
      // a link, the X button, or any empty area — all close
      if (e.target.closest('a') || e.target.closest('.mnav-close') || e.target === mnav ||
          e.target.classList.contains('mnav-backdrop') || e.target.closest('.mnav-top')) {
        setNav(false);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') setNav(false);
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 940) setNav(false);
    });

    // returning via the Back button must never restore an open menu
    window.addEventListener('pageshow', function () { setNav(false); });
    setNav(false);
  }

  /* ── Hero slideshow ───────────────────────── */
  var hero = document.getElementById('heroSlides');
  if (hero) {
    var slides = hero.querySelectorAll('.hero__slide');
    var dots = document.querySelectorAll('#heroDots button');
    var idx = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var show = function (n) {
      idx = (n + slides.length) % slides.length;
      for (var i = 0; i < slides.length; i++) {
        slides[i].classList.toggle('active', i === idx);
      }
      for (var j = 0; j < dots.length; j++) {
        dots[j].setAttribute('aria-selected', String(j === idx));
      }
    };
    var start = function () {
      if (reduce || slides.length < 2) return;
      stop();
      timer = setInterval(function () { show(idx + 1); }, 5000);
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };

    for (var d = 0; d < dots.length; d++) {
      (function (n) {
        dots[n].addEventListener('click', function () { show(n); start(); });
      })(d);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });
    show(0);
    start();
  }

  /* ── Reveal on scroll ─────────────────────── */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
      Array.prototype.forEach.call(revealEls, function (el) { io.observe(el); });
    } else {
      Array.prototype.forEach.call(revealEls, function (el) { el.classList.add('visible'); });
    }
  }

  /* ── Project filters ──────────────────────── */
  var filterBar = document.getElementById('projectFilters');
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll('.filter-btn'));

    // a filter with nothing behind it is a dead end — hide the button
    buttons.forEach(function (b) {
      var cat = b.getAttribute('data-filter');
      if (cat === 'all') return;
      var n = cards.filter(function (c) {
        return c.getAttribute('data-cat').split(' ').indexOf(cat) !== -1;
      }).length;
      if (n === 0) b.hidden = true;
    });

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      cards.forEach(function (card) {
        var match = cat === 'all' || card.getAttribute('data-cat').split(' ').indexOf(cat) !== -1;
        card.hidden = !match;
      });
    });
  }

  /* ── Contact form (EmailJS) ───────────────── */
  var form = document.getElementById('inquiryForm');
  if (form) {
    var COPY = LANG === 'EN' ? {
      sending: 'Sending…', submit: 'Send Inquiry',
      ok: "Thank you. We'll review your inquiry and get back to you.",
      err: 'Sending failed. Please email us directly at apexlite1@gmail.com.',
      required: 'Please fill in all required fields.'
    } : {
      sending: '전송 중…', submit: '문의 보내기',
      ok: '문의가 접수되었습니다. 검토 후 연락드리겠습니다.',
      err: '전송에 실패했습니다. apexlite1@gmail.com 으로 직접 연락해 주세요.',
      required: '필수 항목을 모두 입력해 주세요.'
    };

    var btn = document.getElementById('inquirySubmit');
    var status = document.getElementById('formStatus');

    var say = function (kind, text) {
      if (!status) return;
      status.className = 'form-status show ' + kind;
      status.textContent = text;
    };
    var val = function (name) {
      var el = form.elements[name];
      return el && el.value ? el.value.trim() : '';
    };

    var buildPayload = function () {
      var support = Array.prototype.slice
        .call(form.querySelectorAll('input[name="support"]:checked'))
        .map(function (i) { return i.value; })
        .join(', ');

      var rows = [
        ['Language', LANG],
        [LANG === 'EN' ? 'Project Type' : '프로젝트 유형', val('project_type')],
        [LANG === 'EN' ? 'Support Required' : '필요 지원', support],
        [LANG === 'EN' ? 'Company & Country' : '회사명·국가', val('company')],
        [LANG === 'EN' ? 'Contact Name' : '담당자', val('from_name')],
        ['Email', val('reply_to')],
        [LANG === 'EN' ? 'Phone' : '연락처', val('phone')],
        [LANG === 'EN' ? 'Location' : '지역', val('region')],
        [LANG === 'EN' ? 'Venue' : '공연장·장소', val('venue')],
        [LANG === 'EN' ? 'Load-in' : '반입', val('date_loadin')],
        [LANG === 'EN' ? 'Rehearsal' : '리허설', val('date_rehearsal')],
        [LANG === 'EN' ? 'Show' : '본 공연', val('date_show')],
        [LANG === 'EN' ? 'File links' : '자료 링크', val('ref_links')]
      ];
      var body = rows.filter(function (r) { return r[1]; })
                     .map(function (r) { return r[0] + ': ' + r[1]; })
                     .join('\n');
      body += '\n\n---\n' + val('message');

      return {
        lang: LANG, from_name: val('from_name'), reply_to: val('reply_to'),
        phone: val('phone'), company: val('company'), project_type: val('project_type'),
        support: support, region: val('region'), venue: val('venue'),
        date_loadin: val('date_loadin'), date_rehearsal: val('date_rehearsal'),
        date_show: val('date_show'), ref_links: val('ref_links'), message: body
      };
    };

    form.buildPayload = buildPayload;   /* exposed for static verification only */

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        say('err', COPY.required);
        return;
      }
      var payload = buildPayload();
      if (typeof window.emailjs === 'undefined') { say('err', COPY.err); return; }

      btn.disabled = true;
      btn.textContent = COPY.sending;
      if (status) status.className = 'form-status';

      window.emailjs.send('service_qch02xy', 'template_mah4hjs', payload)
        .then(function () {
          btn.disabled = false; btn.textContent = COPY.submit;
          say('ok', COPY.ok); form.reset();
        })
        .catch(function (err) {
          btn.disabled = false; btn.textContent = COPY.submit;
          console.error('EmailJS error:', err);
          say('err', COPY.err);
        });
    });
  }
})();
