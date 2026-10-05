/**
 * Conexão Imigrante — main.js v4
 * UX aprimorada: Abas de destino · Mini-Quiz de Elegibilidade · Menu de Navegação · Acessibilidade
 */

document.addEventListener('DOMContentLoaded', function () {

  // Marca que o JS está ativo no documento
  document.documentElement.classList.add('js-loaded');

  // Atualiza ano no rodapé
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ─── 1. Cookie Banner (LGPD) ─────────────────────
  var banner = document.getElementById('cookie-banner');
  var consent = localStorage.getItem('cookie_consent');
  if (!consent && banner) {
    document.body.classList.add('cookie-showing');
    setTimeout(function () { banner.classList.add('visible'); }, 1500);

    var btnAccept = document.getElementById('cookie-accept');
    if (btnAccept) {
      btnAccept.addEventListener('click', function () {
        banner.classList.remove('visible');
        document.body.classList.remove('cookie-showing');
        if (typeof window.grantAnalyticsConsent === 'function') {
          window.grantAnalyticsConsent();
        }
      });
    }

    var btnDecline = document.getElementById('cookie-decline');
    if (btnDecline) {
      btnDecline.addEventListener('click', function () {
        banner.classList.remove('visible');
        document.body.classList.remove('cookie-showing');
        if (typeof window.denyAnalyticsConsent === 'function') {
          window.denyAnalyticsConsent();
        }
      });
    }
  } else if (banner) {
    banner.remove();
  }

  // ─── 2. Header State & Navegação Suave ───────────
  var header = document.querySelector('.site-header');
  function updateHeader() {
    if (!header) return;
    var scrolled = window.scrollY > 40;
    header.classList.toggle('scrolled', scrolled);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // Scroll suave com compensação da altura do header
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        var headerOffset = (header ? header.offsetHeight : 70) + 12;
        var elementPosition = targetEl.getBoundingClientRect().top + window.scrollY;
        var offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Foco acessível no destino
        targetEl.setAttribute('tabindex', '-1');
        targetEl.focus({ preventScroll: true });
      }
    });
  });

  // ─── 3. Abas de Destino no Hero (Controle do Visitante) ───
  var tabs = Array.from(document.querySelectorAll('.hero-tab'));
  var panels = Array.from(document.querySelectorAll('.hero-panel'));
  var bgs = Array.from(document.querySelectorAll('.hero-bg'));

  var stage = document.querySelector('.hero-stage');

  function selectDestination(country, shouldFocus, silent) {
    if (stage) stage.setAttribute('data-active', country);
    tabs.forEach(function (tab) {
      var isCurrent = tab.getAttribute('data-country') === country;
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      tab.setAttribute('tabindex', isCurrent ? '0' : '-1');
      if (isCurrent && shouldFocus) {
        tab.focus();
      }
    });

    var n = panels.length;
    var cur = panels.findIndex(function (p) { return p.getAttribute('data-country') === country; });
    panels.forEach(function (panel, idx) {
      var d = idx - cur;
      if (d > n / 2) d -= n;
      if (d < -n / 2) d += n;
      var isCurrent = d === 0;
      panel.classList.toggle('is-active', isCurrent);
      panel.classList.toggle('is-far', Math.abs(d) > 1);
      panel.style.setProperty('--o', Math.max(-1, Math.min(1, d)));
      panel.style.setProperty('--abs', Math.min(1, Math.abs(d)));
      panel.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
      panel.querySelectorAll('a').forEach(function (a) { a.tabIndex = isCurrent ? 0 : -1; });
    });

    bgs.forEach(function (bg) {
      var isCurrent = bg.getAttribute('data-country') === country;
      bg.classList.toggle('is-active', isCurrent);
    });

    if (!silent && typeof gtag === 'function') {
      gtag('event', 'select_content', {
        content_type: 'destination_tab',
        item_id: country
      });
    }
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      var country = this.getAttribute('data-country');
      selectDestination(country, false);
    });

    // Navegação por teclado segundo padrão W3C ARIA Tab
    tab.addEventListener('keydown', function (e) {
      var nextIndex = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex >= 0) {
        e.preventDefault();
        var nextCountry = tabs[nextIndex].getAttribute('data-country');
        selectDestination(nextCountry, true);
      }
    });
  });

  // Setas e autoplay do carrossel (pausa no hover/foco; para ao primeiro uso manual)
  var heroEl = document.getElementById('hero');
  function currentTab() {
    return tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; });
  }
  function goHero(delta, silent) {
    if (!tabs.length) return;
    var i = (currentTab() + delta + tabs.length) % tabs.length;
    selectDestination(tabs[i].getAttribute('data-country'), false, silent);
  }
  var heroTimer = null;
  var heroStopped = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function startHero() {
    if (heroStopped || heroTimer) return;
    heroTimer = setInterval(function () { goHero(1, true); }, 7000);
  }
  function pauseHero() { clearInterval(heroTimer); heroTimer = null; }
  function stopHero() { heroStopped = true; pauseHero(); }

  var prevBtn = document.querySelector('.hero-prev');
  var nextBtn = document.querySelector('.hero-next');
  if (prevBtn) prevBtn.addEventListener('click', function () { stopHero(); goHero(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { stopHero(); goHero(1); });
  tabs.forEach(function (t) {
    t.addEventListener('click', stopHero);
    t.addEventListener('keydown', stopHero);
  });
  if (heroEl) {
    heroEl.addEventListener('mouseenter', pauseHero);
    heroEl.addEventListener('mouseleave', startHero);
    heroEl.addEventListener('focusin', pauseHero);
    heroEl.addEventListener('focusout', startHero);
  }
  // Clique no slide vizinho avança até ele; deslize (swipe) no celular
  panels.forEach(function (panel) {
    panel.addEventListener('click', function (e) {
      if (panel.classList.contains('is-active')) return;
      e.preventDefault();
      stopHero();
      selectDestination(panel.getAttribute('data-country'), false);
    });
  });
  var track = document.querySelector('.hero-track');
  var touchX = null;
  if (track) {
    track.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) { stopHero(); goHero(dx < 0 ? 1 : -1); }
    }, { passive: true });
  }
  selectDestination(tabs.length ? tabs[0].getAttribute('data-country') : 'portugal', false, true);
  startHero();

  // ─── 4. Mini-Quiz de Elegibilidade WhatsApp ─────────
  var quizCard = document.getElementById('quiz');
  if (quizCard) {
    var quizSteps = Array.from(quizCard.querySelectorAll('.quiz-step'));
    var quizCount = quizCard.querySelector('.quiz-count');
    var quizBarFill = quizCard.querySelector('.quiz-bar span');
    var quizBackBtn = quizCard.querySelector('.quiz-back');
    var quizRestartBtn = quizCard.querySelector('.quiz-restart');
    var quizSendBtn = quizCard.querySelector('.quiz-send');
    var currentStep = 1;
    var answers = {
      destino: '',
      objetivo: '',
      prazo: ''
    };

    function renderQuizStep(step, focusHeading) {
      currentStep = step;
      quizSteps.forEach(function (el) {
        var isTarget = parseInt(el.getAttribute('data-step'), 10) === step;
        el.classList.toggle('is-active', isTarget);
      });

      if (quizCount) {
        quizCount.textContent = step <= 3 ? 'Pergunta ' + step + ' de 3' : 'Resumo do seu caso';
      }

      if (quizBarFill) {
        var pct = step === 1 ? 33 : step === 2 ? 66 : step === 3 ? 90 : 100;
        quizBarFill.style.width = pct + '%';
      }

      if (quizBackBtn) {
        quizBackBtn.hidden = step === 1;
      }

      if (quizRestartBtn) {
        quizRestartBtn.hidden = step < 4;
      }

      if (focusHeading) {
        var heading = quizCard.querySelector('.quiz-step.is-active .quiz-q');
        if (heading) heading.focus();
      }

      if (step === 4) {
        buildQuizSummary();
      }
    }

    function buildQuizSummary() {
      var dOut = quizCard.querySelector('[data-out="destino"]');
      var oOut = quizCard.querySelector('[data-out="objetivo"]');
      var pOut = quizCard.querySelector('[data-out="prazo"]');
      var nOut = quizCard.querySelector('[data-out="nota"]');

      if (dOut) dOut.textContent = answers.destino || 'Não definido';
      if (oOut) oOut.textContent = answers.objetivo || 'Não definido';
      if (pOut) pOut.textContent = answers.prazo || 'Não definido';

      var note = '';
      if (answers.destino === 'Portugal') {
        note = 'Portugal tem adaptação imediata pelo idioma e excelente caminho de cidadania em 5 anos. Mapearemos os vistos ideais para seu plano de ' + (answers.objetivo || 'morar fora').toLowerCase() + '.';
      } else if (answers.destino === 'Espanha') {
        note = 'A Espanha oferece alta qualidade de vida, acesso ao Espaço Schengen e incentivos fiscais para profissionais e nômades digitais.';
      } else if (answers.destino === 'Estados Unidos') {
        note = 'Os EUA exigem um dossiê técnico robusto. Analisaremos seu perfil profissional para estruturar a categoria de visto com maior viabilidade.';
      } else {
        note = 'Faremos um comparativo direto entre Portugal, Espanha e EUA com base no seu objetivo, para você decidir com dados reais.';
      }

      if (nOut) nOut.textContent = note;

      // Monta mensagem personalizada para o WhatsApp
      var messageLines = [
        'Olá! Fiz a simulação no site da Conexão Imigrante:',
        '• Destino: ' + (answers.destino || 'A definir'),
        '• Objetivo: ' + (answers.objetivo || 'A definir'),
        '• Prazo: ' + (answers.prazo || 'A definir'),
        '',
        'Gostaria de uma avaliação gratuita do meu caso com um especialista.'
      ];
      var waUrl = 'https://wa.me/5564992390885?text=' + encodeURIComponent(messageLines.join('\n'));

      if (quizSendBtn) {
        quizSendBtn.setAttribute('href', waUrl);
      }

      if (typeof gtag === 'function') {
        gtag('event', 'quiz_complete', {
          event_category: 'Quiz',
          destination: answers.destino,
          objective: answers.objetivo,
          timeframe: answers.prazo
        });
      }
    }

    // Clique nas opções do quiz
    quizCard.querySelectorAll('.quiz-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var name = this.getAttribute('data-name');
        var val = this.getAttribute('data-value');

        // Desmarca opções do mesmo grupo
        var group = this.closest('.quiz-options');
        if (group) {
          group.querySelectorAll('.quiz-opt').forEach(function (b) {
            b.classList.remove('is-selected');
            b.setAttribute('aria-pressed', 'false');
          });
        }

        this.classList.add('is-selected');
        this.setAttribute('aria-pressed', 'true');
        answers[name] = val;

        // Avança suavemente após feedback visual
        setTimeout(function () {
          renderQuizStep(currentStep + 1, true);
        }, 180);
      });
    });

    // Botão Voltar
    if (quizBackBtn) {
      quizBackBtn.addEventListener('click', function () {
        if (currentStep > 1) {
          renderQuizStep(currentStep - 1, true);
        }
      });
    }

    // Botão Refazer
    if (quizRestartBtn) {
      quizRestartBtn.addEventListener('click', function () {
        answers = { destino: '', objetivo: '', prazo: '' };
        quizCard.querySelectorAll('.quiz-opt').forEach(function (b) {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        renderQuizStep(1, true);
      });
    }

    // Botões "Alterar" no resumo final
    quizCard.querySelectorAll('.quiz-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetStep = parseInt(this.getAttribute('data-goto'), 10);
        if (targetStep >= 1 && targetStep <= 3) {
          renderQuizStep(targetStep, true);
        }
      });
    });
  }

  // ─── 5. Scroll Reveal (Animação de Entrada) ───────
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // ─── 6. FAQ Accordion Acessível ───────────────────
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      faqItems.forEach(function (other) {
        var otherBtn = other.querySelector('.faq-question');
        var otherAns = other.querySelector('.faq-answer');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        if (otherAns) otherAns.style.maxHeight = '0';
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  // ─── 7. WhatsApp Tracking Unificado ───────────────
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var location = link.getAttribute('data-wa-location') || 'geral';
      var country = link.getAttribute('data-wa-country') || 'geral';
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          event_category: 'WhatsApp',
          event_label: location + '_' + country,
          destination_country: country,
          click_location: location
        });
      }
    });
  });

});