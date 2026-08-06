/* ==========================================================================
   JUNIOR CORTEZ — interaction layer
   Preloader · Lenis smooth scroll · custom cursor · magnetic elements ·
   split-text reveals · pinned horizontal work gallery · service accordions
   with mouse-following previews · showreel scale · marquee · counters
   ========================================================================== */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  const hasGsap = typeof gsap !== "undefined";

  if (hasGsap && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  } else {
    // CDN failed or blocked — neutralize all animation-hidden states via CSS
    document.documentElement.classList.add("no-anim");
  }

  /* ------------------------------------------------------------------
     Text splitting (hand-rolled — keeps us on free GSAP plugins only)
  ------------------------------------------------------------------ */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    [...text].forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? " " : ch;
      el.appendChild(span);
    });
    return el.querySelectorAll(".char");
  }

  function splitWords(el) {
    const nodes = [...el.childNodes];
    el.textContent = "";
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            el.appendChild(document.createTextNode(" "));
          } else {
            const span = document.createElement("span");
            span.className = "word-reveal";
            span.textContent = part;
            el.appendChild(span);
          }
        });
      } else {
        el.appendChild(node);
      }
    });
    return el.querySelectorAll(".word-reveal");
  }

  document.querySelectorAll("[data-split-chars]").forEach(splitChars);
  document.querySelectorAll("[data-words-reveal]").forEach(splitWords);

  /* ------------------------------------------------------------------
     Lenis smooth scroll, driven by GSAP's ticker
  ------------------------------------------------------------------ */
  let lenis = null;
  if (typeof Lenis !== "undefined" && hasGsap && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    } else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  /* ------------------------------------------------------------------
     Preloader → hero entrance
  ------------------------------------------------------------------ */
  const preloader = document.getElementById("preloader");
  const countEl = document.getElementById("preloaderCount");

  function heroEntrance() {
    if (!hasGsap) return;
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.to(".hero__title-line .char, .re-hero__title-line .char", {
      y: 0, rotate: 0, duration: 1.2, stagger: 0.025,
    })
      .from(".hero__eyebrow", { y: 24, autoAlpha: 0, duration: 0.8 }, "-=0.8")
      .from(".hero__sub-text", { y: 24, autoAlpha: 0, duration: 0.8 }, "-=0.6")
      .from(".hero__cta", { scale: 0.6, autoAlpha: 0, duration: 0.9, ease: "back.out(1.6)" }, "-=0.6")
      .to(".hero__frame-item", { autoAlpha: 1, duration: 0.6, stagger: 0.08 }, "-=0.7")
      .from(".hero__scroll-hint", { autoAlpha: 0, duration: 0.6 }, "-=0.4")
      // fade nav children only — the bar itself must not move, it is the
      // landing target for the preloader signature flight
      .from(".nav__center, .nav__toggle", { autoAlpha: 0, y: -14, duration: 0.7, stagger: 0.1, ease: "power3.out" }, "-=0.9");
  }

  let preloaderStarted = false;
  function runPreloader() {
    if (preloaderStarted) return;
    preloaderStarted = true;
    if (!hasGsap || reduceMotion) {
      if (preloader) preloader.remove();
      heroEntrance();
      return;
    }

    document.documentElement.style.overflow = "hidden";
    const counter = { v: 0 };
    const sig = document.querySelector(".preloader__sig");
    const navImg = document.querySelector(".nav__logo-img");

    // nav logo stays hidden until the preloader signature flies into its slot
    if (navImg) gsap.set(navImg, { autoAlpha: 0 });
    gsap.set(sig, { clipPath: "inset(0 100% 0 0)" });

    function flySigToNav() {
      const done = () => {
        if (navImg) gsap.set(navImg, { autoAlpha: 1 });
        preloader.remove();
        document.documentElement.style.overflow = "";
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      };
      if (!sig || !navImg) return done();
      const s = sig.getBoundingClientRect();
      const n = navImg.getBoundingClientRect();
      gsap.set(sig, { transformOrigin: "left top" });
      gsap.to(sig, {
        x: n.left - s.left,
        y: n.top - s.top,
        scale: n.width / s.width,
        duration: 0.9,
        ease: "power3.inOut",
        onComplete: done,
      });
    }

    const tl = gsap.timeline({ onComplete: flySigToNav });

    tl.to(".preloader__tagline", { opacity: 1, duration: 0.5 })
      // the signature writes itself in lockstep with the loading percentage
      .to(counter, {
        v: 100,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          countEl.textContent = Math.round(counter.v);
          if (sig) sig.style.clipPath = "inset(0 " + (100 - counter.v) + "% 0 0)";
        },
      }, "<")
      .to([".preloader__count", ".preloader__tagline"], {
        autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.in",
      })
      .add(heroEntrance, "-=0.1")
      .add(() => { preloader.style.pointerEvents = "none"; }, "<")
      .to(".preloader__curtain--1", { yPercent: -100, duration: 1, ease: "power4.inOut" }, "<")
      .to(".preloader__curtain--2", { yPercent: 100, duration: 1, ease: "power4.inOut" }, "<");
  }

  window.addEventListener("load", runPreloader);
  // Safety net: if `load` stalls (e.g. a slow image), reveal after 5s anyway
  setTimeout(() => {
    if (document.getElementById("preloader")) runPreloader();
  }, 5000);

  /* ------------------------------------------------------------------
     Custom cursor + contextual labels (VIEW / PLAY)
  ------------------------------------------------------------------ */
  const cursor = document.getElementById("cursor");
  if (cursor && !isTouch && hasGsap) {
    document.body.classList.add("has-cursor");
    const label = cursor.querySelector(".cursor__label");
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3.out" });

    window.addEventListener("pointermove", (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });

    document.querySelectorAll("[data-cursor]").forEach((el) => {
      const mode = el.dataset.cursor;
      el.addEventListener("pointerenter", () => {
        cursor.className = "cursor is-" + mode;
        label.textContent = mode === "view" ? "View" : mode === "play" ? "Play" : "";
      });
      el.addEventListener("pointerleave", () => {
        cursor.className = "cursor";
        label.textContent = "";
      });
    });

    // embedded players are cross-origin iframes that swallow pointer events,
    // which would freeze the ring mid-screen — hide it over them instead
    document.querySelectorAll("#showreelStage, .lightbox__frame").forEach((zone) => {
      zone.addEventListener("pointerenter", () => cursor.classList.add("is-hidden"));
      zone.addEventListener("pointerleave", () => cursor.classList.remove("is-hidden"));
    });
  } else if (cursor) {
    cursor.style.display = "none";
  }

  /* ------------------------------------------------------------------
     Magnetic elements
  ------------------------------------------------------------------ */
  if (!isTouch && hasGsap && !reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.35;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * strength,
          y: (e.clientY - r.top - r.height / 2) * strength,
          duration: 0.4,
          ease: "power3.out",
        });
      });
      el.addEventListener("pointerleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ------------------------------------------------------------------
     Live clock + hero timecode (set dressing)
  ------------------------------------------------------------------ */
  const navTime = document.getElementById("navTime");
  const timecode = document.getElementById("heroTimecode");
  let frames = 0;
  setInterval(() => {
    const now = new Date();
    if (navTime) {
      navTime.textContent = now.toLocaleTimeString("en-US", {
        hour12: false,
        timeZone: "America/Los_Angeles", // Portland, OR — Pacific time
      });
    }
  }, 1000);
  setInterval(() => {
    if (!timecode) return;
    frames = (frames + 1) % 24;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    timecode.textContent =
      pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" +
      pad(now.getSeconds()) + ":" + pad(frames);
  }, 1000 / 24);

  /* ------------------------------------------------------------------
     Fullscreen menu
  ------------------------------------------------------------------ */
  const menu = document.getElementById("menu");
  const menuToggle = document.getElementById("menuToggle");
  let menuOpen = false;
  let menuTl = null;

  if (menu && menuToggle && hasGsap) {
    menuTl = gsap.timeline({ paused: true });
    menuTl
      .to(".menu__bg", { scaleY: 1, duration: 0.7, ease: "power4.inOut" })
      .to(".menu__link", { y: 0, duration: 0.8, stagger: 0.07, ease: "power4.out" }, "-=0.25")
      .to(".menu__footer", { opacity: 1, duration: 0.5 }, "-=0.4");

    function setMenu(open) {
      menuOpen = open;
      document.body.classList.toggle("menu-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
      menuToggle.querySelector(".nav__toggle-label").textContent = open ? "Close" : "Menu";
      if (open) {
        menu.classList.add("is-open");
        if (lenis) lenis.stop();
        menuTl.timeScale(1).play();
      } else {
        if (lenis) lenis.start();
        menuTl.timeScale(1.6).reverse().eventCallback("onReverseComplete", () => {
          menu.classList.remove("is-open");
        });
      }
    }

    menuToggle.addEventListener("click", () => setMenu(!menuOpen));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) setMenu(false);
    });
  } else if (menu && menuToggle) {
    // no GSAP — plain class toggle, styled by the .no-anim CSS fallback
    menuToggle.addEventListener("click", () => {
      menuOpen = !menuOpen;
      menu.classList.toggle("is-open", menuOpen);
      document.body.classList.toggle("menu-open", menuOpen);
      menuToggle.setAttribute("aria-expanded", String(menuOpen));
      menu.setAttribute("aria-hidden", String(!menuOpen));
      menuToggle.querySelector(".nav__toggle-label").textContent = menuOpen ? "Close" : "Menu";
    });

    document.querySelectorAll("[data-menu-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.getAttribute("href");
        setMenu(false);
        setTimeout(() => scrollToTarget(target), 450);
      });
    });
  }

  // Scramble hover on menu words
  const SCRAMBLE_CHARS = "AEFHKLMNRSTVXZ#/";
  document.querySelectorAll("[data-scramble]").forEach((el) => {
    const original = el.textContent;
    let raf = null;
    el.parentElement.addEventListener("pointerenter", () => {
      let frame = 0;
      cancelAnimationFrame(raf);
      (function scramble() {
        el.textContent = original
          .split("")
          .map((ch, i) =>
            i < frame / 3
              ? ch
              : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0]
          )
          .join("");
        frame++;
        if (frame / 3 <= original.length) raf = requestAnimationFrame(scramble);
        else el.textContent = original;
      })();
    });
  });

  /* ------------------------------------------------------------------
     Smooth-scroll for remaining anchors
  ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]:not([data-menu-link])').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = a.getAttribute("href");
      if (target.length > 1 && document.querySelector(target)) {
        e.preventDefault();
        scrollToTarget(target);
      }
    });
  });
  const backToTop = document.getElementById("backToTop");
  if (backToTop) backToTop.addEventListener("click", () => scrollToTarget(0));

  /* ------------------------------------------------------------------
     Film / image lightbox — click a card, view it without leaving
  ------------------------------------------------------------------ */
  const lightbox = document.getElementById("lightbox");
  const lightboxFrame = document.getElementById("lightboxFrame");
  const lightboxTitle = document.getElementById("lightboxTitle");
  let lightboxOpen = false;

  function setLightboxVisible(visible) {
    const backdrop = lightbox.querySelector(".lightbox__backdrop");
    const inner = lightbox.querySelector(".lightbox__inner");
    if (hasGsap && !reduceMotion) {
      if (visible) {
        lightbox.classList.add("is-open");
        gsap.to(backdrop, { opacity: 1, duration: 0.4, ease: "power2.out" });
        gsap.fromTo(inner,
          { opacity: 0, scale: 0.94, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: "power3.out", delay: 0.08 });
      } else {
        gsap.to(inner, { opacity: 0, scale: 0.96, y: 12, duration: 0.3, ease: "power2.in" });
        gsap.to(backdrop, {
          opacity: 0, duration: 0.35, delay: 0.1, ease: "power2.in",
          onComplete: () => lightbox.classList.remove("is-open"),
        });
      }
    } else {
      lightbox.classList.toggle("is-open", visible);
      backdrop.style.opacity = visible ? 1 : 0;
      inner.style.opacity = visible ? 1 : 0;
      inner.style.transform = "none";
    }
  }

  function openFilm(videoId, title) {
    if (!lightbox || !videoId) return;
    lightboxTitle.textContent = title || "";
    lightboxFrame.innerHTML =
      '<iframe src="https://www.youtube-nocookie.com/embed/' + videoId +
      '?autoplay=1&rel=0&modestbranding=1&playsinline=1" ' +
      'title="' + (title || "Film") + '" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe>';
    lightbox.setAttribute("aria-hidden", "false");
    lightboxOpen = true;
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
    setLightboxVisible(true);
  }

  function openImage(src, title) {
    if (!lightbox || !src) return;
    lightboxTitle.textContent = title || "";
    lightboxFrame.classList.add("is-image");
    lightboxFrame.innerHTML = '<img src="' + src + '" alt="' + (title || "") + '" />';
    lightbox.setAttribute("aria-hidden", "false");
    lightboxOpen = true;
    if (lenis) lenis.stop();
    document.documentElement.style.overflow = "hidden";
    setLightboxVisible(true);
  }

  function closeFilm() {
    if (!lightboxOpen) return;
    lightboxOpen = false;
    lightbox.setAttribute("aria-hidden", "true");
    setLightboxVisible(false);
    // drop the iframe so playback stops immediately
    setTimeout(() => {
      lightboxFrame.innerHTML = "";
      lightboxFrame.classList.remove("is-image");
    }, 350);
    if (lenis) lenis.start();
    document.documentElement.style.overflow = "";
  }

  if (lightbox) {
    document.querySelectorAll("[data-video]").forEach((card) => {
      card.addEventListener("click", () => openFilm(card.dataset.video, card.dataset.title));
    });
    document.querySelectorAll("[data-image]").forEach((card) => {
      card.addEventListener("click", () => openImage(card.dataset.image, card.dataset.title));
    });
    document.getElementById("lightboxClose").addEventListener("click", closeFilm);
    document.getElementById("lightboxBackdrop").addEventListener("click", closeFilm);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightboxOpen) closeFilm();
    });
  }

  /* ==================================================================
     SCROLL-DRIVEN ANIMATIONS (everything below needs GSAP + ST)
  ================================================================== */
  if (!hasGsap || typeof ScrollTrigger === "undefined") return;

  /* --- marquee: constant drift + scroll-velocity kick --- */
  const marqueeTrack = document.querySelector("[data-marquee]");
  if (marqueeTrack && !reduceMotion) {
    // duplicate content so the loop is seamless
    marqueeTrack.innerHTML += marqueeTrack.innerHTML;
    const half = marqueeTrack.scrollWidth / 2;
    const drift = gsap.to(marqueeTrack, {
      x: -half,
      duration: 28,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: (x) => (parseFloat(x) % half) + "px",
      },
    });
    ScrollTrigger.create({
      trigger: ".marquee",
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        drift.timeScale(gsap.utils.clamp(0.4, 4, 1 + Math.abs(self.getVelocity()) / 600));
      },
    });
  }

  /* --- design examples: continuous right-to-left marquee (e.g. real estate) --- */
  const galleryTrack = document.querySelector("[data-gallery-marquee]");
  if (galleryTrack && !reduceMotion) {
    const galleryWrap = galleryTrack.parentElement;
    // clone (not innerHTML +=) so the originals' click listeners survive
    Array.from(galleryTrack.children).forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      clone.addEventListener("click", () => openImage(clone.dataset.image, clone.dataset.title));
      galleryTrack.appendChild(clone);
    });
    galleryWrap.classList.add("is-auto");
    const galleryHalf = galleryTrack.scrollWidth / 2;
    const galleryDrift = gsap.to(galleryTrack, {
      x: -galleryHalf,
      duration: 34,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: (x) => (parseFloat(x) % galleryHalf) + "px",
      },
    });
    galleryWrap.addEventListener("mouseenter", () => galleryDrift.pause());
    galleryWrap.addEventListener("mouseleave", () => galleryDrift.play());
  }

  /* --- generic fade-up reveal (any page) --- */
  document.querySelectorAll("[data-fade-up]").forEach((el) => {
    gsap.from(el, {
      y: 30,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  /* --- manifesto: word-by-word brighten on scroll --- */
  document.querySelectorAll("[data-words-reveal]").forEach((el) => {
    gsap.to(el.querySelectorAll(".word-reveal"), {
      opacity: 1,
      stagger: 0.04,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top 78%",
        end: "bottom 45%",
        scrub: 0.6,
      },
    });
  });

  /* --- stat counters --- */
  document.querySelectorAll("[data-stat]").forEach((stat, i) => {
    const numEl = stat.querySelector("[data-counter]");
    const end = parseInt(numEl.dataset.counter, 10);
    ScrollTrigger.create({
      trigger: stat,
      start: "top 88%",
      once: true,
      onEnter: () => {
        gsap.to(stat, { opacity: 1, y: 0, duration: 0.8, delay: i * 0.1, ease: "power3.out" });
        const counter = { v: 0 };
        gsap.to(counter, {
          v: end,
          duration: 1.8,
          delay: i * 0.1,
          ease: "power2.out",
          onUpdate: () => { numEl.textContent = Math.round(counter.v); },
        });
      },
    });
  });

  /* --- section titles: char rise on enter --- */
  document.querySelectorAll(".work__title, .services__title, .contact__title-line, .packages__title, .re-gallery__title, .re-video-hero__title-line").forEach((el) => {
    gsap.to(el.querySelectorAll(".char"), {
      y: 0,
      rotate: 0,
      duration: 1,
      stagger: 0.03,
      ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });

  /* --- work: pinned horizontal scroll (desktop only) --- */
  const workTrack = document.getElementById("workTrack");
  const workPin = document.getElementById("workPin");
  if (workTrack && workPin) {
    ScrollTrigger.matchMedia({
      "(min-width: 821px)": function () {
        const getDistance = () => workTrack.scrollWidth - window.innerWidth;
        gsap.to(workTrack, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: workPin,
            start: "top 12%",
            end: () => "+=" + getDistance(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        // subtle parallax inside each card while the track moves
        document.querySelectorAll(".project__img").forEach((img) => {
          gsap.fromTo(img, { xPercent: -6 }, {
            xPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: workPin,
              start: "top 12%",
              end: () => "+=" + getDistance(),
              scrub: 1,
            },
          });
        });
      },
      "(max-width: 820px)": function () {
        // mobile: plain swipeable row
        workPin.style.overflowX = "auto";
        gsap.utils.toArray(".project").forEach((card) => {
          gsap.from(card, {
            y: 40,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 92%", once: true },
          });
        });
      },
    });
  }

  /* --- services: accordion --- */
  const services = document.querySelectorAll("[data-service]");

  services.forEach((service) => {
    const row = service.querySelector(".service__row");
    const body = service.querySelector(".service__body");

    row.addEventListener("click", () => {
      const isOpen = service.classList.contains("is-open");
      // close siblings
      services.forEach((s) => {
        if (s !== service && s.classList.contains("is-open")) {
          s.classList.remove("is-open");
          gsap.to(s.querySelector(".service__body"), {
            maxHeight: 0, duration: 0.55, ease: "power3.inOut",
          });
        }
      });
      service.classList.toggle("is-open", !isOpen);
      gsap.to(body, {
        maxHeight: isOpen ? 0 : body.scrollHeight + 32,
        duration: 0.65,
        ease: "power3.inOut",
      });
    });
  });

  /* --- service rows slide in --- */
  gsap.utils.toArray(".service").forEach((row, i) => {
    gsap.from(row, {
      y: 50,
      autoAlpha: 0,
      duration: 0.9,
      delay: i * 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: row, start: "top 90%", once: true },
    });
  });

  /* --- showreel: scales up as it enters (Drive embed handles playback) --- */
  const stage = document.getElementById("showreelStage");

  if (stage) {
    gsap.to(stage, {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top 95%",
        end: "top 35%",
        scrub: 0.8,
      },
    });
  }

  /* --- generic line reveals --- */
  document.querySelectorAll(".quote__author, .showreel__caption").forEach((el) => {
    gsap.from(el, {
      y: 24,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
    });
  });

  /* --- contact form entrance --- */
  gsap.from(".form__field, .form__pills, .form__footer", {
    y: 36,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.08,
    ease: "power3.out",
    scrollTrigger: { trigger: ".form", start: "top 85%", once: true },
  });
  /* --- footer signature writes in as you scroll --- */
  const contactSig = document.getElementById("contactSig");
  if (contactSig) {
    gsap.fromTo(contactSig,
      { clipPath: "inset(0 100% 0 0)" },
      {
        clipPath: "inset(0 0% 0 0)",
        ease: "none",
        scrollTrigger: {
          trigger: contactSig,
          start: "top bottom",
          // finish exactly at max scroll so the signature is never left
          // partially clipped at the bottom of the page
          end: () => ScrollTrigger.maxScroll(window),
          scrub: 0.6,
        },
      });
  }

  gsap.from(".contact__col", {
    y: 30,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".contact__grid", start: "top 90%", once: true },
  });

  /* ------------------------------------------------------------------
     Contact form
     Set FORM_ENDPOINT to a Formspree (or similar) URL to submit via
     fetch; left empty, the form opens a pre-filled email instead.
  ------------------------------------------------------------------ */
  const FORM_ENDPOINT = "https://formspree.io/f/mzdqkeaj";
  const CONTACT_EMAIL = "jxtezmedia@gmail.com";

  const form = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const formSuccess = document.getElementById("formSuccess");

  if (form) {
    function flagError(el) {
      el.classList.add("is-error");
      el.addEventListener("animationend", () => el.classList.remove("is-error"), { once: true });
    }

    function validate() {
      let firstBad = null;
      const name = form.querySelector("#fName");
      const email = form.querySelector("#fEmail");
      const message = form.querySelector("#fMessage");
      const pills = document.getElementById("formService");

      [[name, (v) => v.trim().length > 1],
       [email, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)],
       [message, (v) => v.trim().length > 3]].forEach(([input, ok]) => {
        if (!ok(input.value)) {
          flagError(input.closest(".form__field"));
          firstBad = firstBad || input;
        }
      });

      if (!form.querySelector('input[name="service"]:checked')) {
        flagError(pills);
        firstBad = firstBad || pills.querySelector("input");
      }
      return firstBad;
    }

    function showSuccess() {
      formSuccess.setAttribute("aria-hidden", "false");
      if (hasGsap) {
        gsap.to(form, {
          autoAlpha: 0,
          y: -24,
          duration: 0.5,
          ease: "power3.in",
          onComplete: () => {
            form.style.display = "none";
            formSuccess.style.display = "block";
            gsap.from(formSuccess.children, {
              y: 30, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
            });
          },
        });
      } else {
        form.style.display = "none";
        formSuccess.style.display = "block";
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      formStatus.textContent = "";

      const firstBad = validate();
      if (firstBad) {
        formStatus.textContent = "A couple of fields need attention.";
        firstBad.focus({ preventScroll: true });
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());

      if (!FORM_ENDPOINT) {
        // no backend configured — hand off to the visitor's mail client
        const subject = `${data.service || "Project"} inquiry — ${data.name}`;
        const body =
          `Name: ${data.name}\nEmail: ${data.email}\nService: ${data.service || "-"}\n` +
          `Date: ${data.date || "-"}\nBudget: ${data.budget || "-"}\n\n${data.message}`;
        window.location.href =
          `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showSuccess();
        return;
      }

      const submitBtn = form.querySelector(".form__submit");
      const btnText = submitBtn.querySelector(".contact__btn-text");
      submitBtn.disabled = true;
      btnText.textContent = "Sending…";

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Request failed: " + res.status);
        showSuccess();
      } catch (err) {
        formStatus.textContent =
          "Something went wrong — please email " + CONTACT_EMAIL + " directly.";
        submitBtn.disabled = false;
        btnText.textContent = "Send it →";
      }
    });
  }

  // Recalculate pinned distances once everything (fonts, images) settles
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
