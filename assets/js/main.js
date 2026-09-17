/* ─────────────────────────────────────────────
   APEX LITE — global script
   ───────────────────────────────────────────── */
(function () {
  'use strict';

  var LANG = document.documentElement.lang === 'en' ? 'EN' : 'KR';

  var store = {
    get: function (k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
    del: function (k) { try { window.sessionStorage.removeItem(k); } catch (e) { /* storage blocked */ } }
  };

  /* ── Header state on scroll ───────────────── */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 24); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile menu ──────────────────────────────
     The header (logo · language · burger/close) stays on top of
     the open menu. While open, everything behind it is inert and
     Tab cycles between the header and the menu links. Closing it
     from the burger, ESC or empty space returns focus to the burger. */
  var burger = document.getElementById('hamburger');
  var mnav = document.getElementById('mobileNav');
  var isOpen = false;

  var background = function () {
    return [document.getElementById('main'), document.querySelector('.site-footer'), document.querySelector('.skip-link')]
      .filter(Boolean);
  };

  var focusables = function () {
    var els = document.querySelectorAll('#siteHeader a, #siteHeader button, #mobileNav a');
    return Array.prototype.filter.call(els, function (el) {
      return el.getClientRects().length > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    });
  };

  function setNav(open, returnFocus) {
    if (!mnav || !burger) return;
    var wasOpen = isOpen;
    isOpen = open;
    mnav.classList.toggle('open', open);
    mnav.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open
      ? (LANG === 'EN' ? 'Close menu' : '메뉴 닫기')
      : (LANG === 'EN' ? 'Open menu' : '메뉴 열기'));
    document.documentElement.classList.toggle('nav-open', open);
    background().forEach(function (el) {
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open) {
      var first = mnav.querySelector('a');
      if (first) first.focus();
    } else if (wasOpen && returnFocus) {
      burger.focus();
    }
  }

  if (burger && mnav) {
    burger.addEventListener('click', function () {
      setNav(!isOpen, true);
    });

    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { setNav(false, false); return; }
      if (e.target === mnav || e.target.closest('.mnav-backdrop')) setNav(false, true);
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key === 'Esc') { setNav(false, true); return; }
      if (e.key !== 'Tab') return;
      var list = focusables();
      if (!list.length) return;
      var i = list.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); list[list.length - 1].focus(); }
      else if (!e.shiftKey && (i === -1 || i === list.length - 1)) { e.preventDefault(); list[0].focus(); }
    });

    window.addEventListener('resize', function () {
      if (isOpen && window.innerWidth > 940) setNav(false, false);
    });
    // returning via the Back button must never restore an open menu
    window.addEventListener('pageshow', function () { setNav(false, false); });
    setNav(false, false);
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

  /* ── Return-to-list flag (detail pages) ───── */
  var RETURN_KEY = 'apx-projects-return';
  Array.prototype.forEach.call(document.querySelectorAll('[data-return-projects]'), function (a) {
    a.addEventListener('click', function () { store.set(RETURN_KEY, '1'); });
  });

  /* ── Project filters ──────────────────────── */
  var filterBar = document.getElementById('projectFilters');
  var grid = document.getElementById('projectGrid');
  if (filterBar && grid) {
    var STATE_KEY = 'apx-projects-state';
    var items = Array.prototype.slice.call(grid.querySelectorAll('[data-cat]'));
    var buttons = Array.prototype.slice.call(filterBar.querySelectorAll('.filter-btn'));
    var empty = document.getElementById('filterEmpty');
    var counter = document.getElementById('filterCount');
    var current = 'all';

    var apply = function (cat) {
      if (!buttons.some(function (b) { return b.getAttribute('data-filter') === cat; })) cat = 'all';
      current = cat;
      var shown = 0;
      items.forEach(function (item) {
        var match = cat === 'all' || item.getAttribute('data-cat') === cat;
        item.hidden = !match;
        if (match) shown++;
      });
      buttons.forEach(function (b) {
        var on = b.getAttribute('data-filter') === cat;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      if (empty) empty.hidden = shown > 0;
      if (counter) counter.textContent = LANG === 'EN' ? shown + ' projects' : shown + '개 프로젝트';
    };

    var save = function () {
      store.set(STATE_KEY, JSON.stringify({ path: location.pathname, filter: current, y: window.scrollY }));
    };

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      apply(btn.getAttribute('data-filter'));
      save();
    });
    grid.addEventListener('click', function (e) { if (e.target.closest('a')) save(); });
    window.addEventListener('pagehide', save);

    var state = null;
    try { state = JSON.parse(store.get(STATE_KEY)); } catch (e) { state = null; }
    var navEntry = window.performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    var cameBack = (navEntry && navEntry.type === 'back_forward') || store.get(RETURN_KEY) === '1';
    store.del(RETURN_KEY);

    if (state && state.path === location.pathname && cameBack) {
      apply(state.filter);
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      var restore = function () {
        try { window.scrollTo({ top: state.y, left: 0, behavior: 'instant' }); }
        catch (e) { window.scrollTo(0, state.y); }
      };
      restore();
      window.requestAnimationFrame(restore);
      window.addEventListener('load', restore);
    } else {
      apply('all');
    }
  }

  /* ── Contact form (EmailJS) ───────────────── */
  var form = document.getElementById('inquiryForm');
  if (form) {
    var COPY = LANG === 'EN' ? {
      sending: 'Sending…', submit: 'Send Inquiry',
      ok: "Thank you. We'll review your inquiry and get back to you.",
      err: 'Sending failed. Please email us directly at apexlite1@gmail.com.',
      required: 'Please fill in your name, email and message.',
      requiredGeneric: 'Please fill in your name, a phone number or email, and a message.'
    } : {
      sending: '전송 중…', submit: '문의 보내기',
      ok: '문의가 접수되었습니다. 검토 후 연락드리겠습니다.',
      err: '전송에 실패했습니다. apexlite1@gmail.com 으로 직접 연락해 주세요.',
      required: '담당자, 이메일, 문의 내용을 입력해 주세요.',
      requiredGeneric: '담당자, 연락처 또는 이메일, 문의 내용을 입력해 주세요.'
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

    var generic = form.hasAttribute('data-generic');

    /* home form: every field carries data-label, so the mail body is built from the form itself */
    var buildGeneric = function () {
      var rows = [['Language', LANG]];
      Array.prototype.forEach.call(form.querySelectorAll('[data-label]'), function (el) {
        if (el.name !== 'message' && el.value && el.value.trim()) rows.push([el.getAttribute('data-label'), el.value.trim()]);
      });
      var body = rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') + '\n\n---\n' + val('message');
      var payload = { lang: LANG, message: body };
      Array.prototype.forEach.call(form.querySelectorAll('[name]'), function (el) {
        if (el.name !== 'message') payload[el.name] = el.value ? el.value.trim() : '';
      });
      return payload;
    };

    var genericValid = function () {
      if (!val('from_name') || !val('message') || (!val('phone') && !val('reply_to'))) return false;
      var mail = form.elements.reply_to;
      return !(mail && mail.value && !mail.checkValidity());
    };

    var buildPayload = function () {
      if (generic) return buildGeneric();
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
      if (generic ? !genericValid() : !form.checkValidity()) {
        if (!generic) form.reportValidity();
        say('err', generic ? COPY.requiredGeneric : COPY.required);
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
