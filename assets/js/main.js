/* ─────────────────────────────────────────────
   APEX LITE — global script
   ───────────────────────────────────────────── */
(function () {
  'use strict';

  var LANG = document.documentElement.lang === 'en' ? 'EN' : 'KR';

  /* ── Header state on scroll ───────────────── */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Mobile menu ──────────────────────────── */
  var burger = document.getElementById('hamburger');
  var mnav = document.getElementById('mobileNav');
  if (burger && mnav) {
    var setNav = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      mnav.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
    };
    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setNav(false);
    });
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
      }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* ── Project filters ──────────────────────── */
  var filterBar = document.getElementById('projectFilters');
  if (filterBar) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-cat]'));
    var empty = document.getElementById('filterEmpty');

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');

      filterBar.querySelectorAll('.filter-btn').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });

      var shown = 0;
      cards.forEach(function (card) {
        var match = cat === 'all' || card.getAttribute('data-cat').split(' ').indexOf(cat) !== -1;
        card.hidden = !match;
        if (match) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  }

  /* ── Contact form (EmailJS) ───────────────── */
  var form = document.getElementById('inquiryForm');
  if (form) {
    var COPY = LANG === 'EN' ? {
      sending: 'Sending…',
      submit: 'Send Inquiry',
      ok: "Thank you. We'll review your inquiry and get back to you.",
      err: 'Sending failed. Please email us directly at apexlite1@gmail.com.',
      required: 'Please fill in all required fields.'
    } : {
      sending: '전송 중…',
      submit: '문의 보내기',
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

      var body = rows
        .filter(function (r) { return r[1]; })
        .map(function (r) { return r[0] + ': ' + r[1]; })
        .join('\n');

      body += '\n\n---\n' + val('message');

      return {
        lang: LANG,
        from_name: val('from_name'),
        reply_to: val('reply_to'),
        phone: val('phone'),
        company: val('company'),
        project_type: val('project_type'),
        support: support,
        region: val('region'),
        venue: val('venue'),
        date_loadin: val('date_loadin'),
        date_rehearsal: val('date_rehearsal'),
        date_show: val('date_show'),
        ref_links: val('ref_links'),
        message: body
      };
    };

    /* exposed for static verification only */
    form.buildPayload = buildPayload;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        say('err', COPY.required);
        return;
      }

      var payload = buildPayload();

      if (typeof window.emailjs === 'undefined') {
        say('err', COPY.err);
        return;
      }

      btn.disabled = true;
      btn.textContent = COPY.sending;
      if (status) status.className = 'form-status';

      window.emailjs
        .send('service_qch02xy', 'template_mah4hjs', payload)
        .then(function () {
          btn.disabled = false;
          btn.textContent = COPY.submit;
          say('ok', COPY.ok);
          form.reset();
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = COPY.submit;
          console.error('EmailJS error:', err);
          say('err', COPY.err);
        });
    });
  }
})();
