/* PoPaCi Pictures — interactions */
(() => {
  // ---- intro animation (index.html only) ----
  const introEl = document.getElementById('intro-overlay');
  if (introEl) {
    // Lock scroll immediately so any attempt to scroll before animation ends
    // keeps the hero in view
    document.body.classList.add('intro-lock');
    window.scrollTo(0, 0);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Full sequence ~3.0s + 0.75s outro. Reduced-motion: short static beat.
    const leaveAt = reducedMotion ? 700 : 3000;
    const removeAt = leaveAt + 800;

    setTimeout(() => {
      introEl.classList.add('is-leaving');
    }, leaveAt);

    setTimeout(() => {
      introEl.style.display = 'none';
      document.body.classList.remove('intro-lock');
    }, removeAt);
  }

  // ---- year in footer ----
  const y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  // ---- menu toggle (split-strip overlay) ----
  const body = document.body;
  const toggle = document.querySelector(".menu-toggle");
  const overlay = document.getElementById("nav-overlay");

  if (toggle && overlay) {
    const headerEl = document.querySelector(".site-header");
    const closeNav = () => {
      body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      overlay.setAttribute("aria-hidden", "true");
    };
    const openNav = () => {
      body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      overlay.setAttribute("aria-hidden", "false");
      // Ensure header is visible (so the close button is reachable)
      if (headerEl) headerEl.style.transform = "translateY(0)";
    };
    toggle.addEventListener("click", () => {
      body.classList.contains("nav-open") ? closeNav() : openNav();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && body.classList.contains("nav-open")) closeNav();
    });
  }

  // ---- custom cursor ----
  const cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let x = 0, y2 = 0, tx = 0, ty = 0;
    document.addEventListener("mousemove", (e) => {
      tx = e.clientX; ty = e.clientY;
    });
    const tick = () => {
      x += (tx - x) * 0.18;
      y2 += (ty - y2) * 0.18;
      cursor.style.transform = `translate(${x}px, ${y2}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    const hoverables = "a, button, .strip, label, input, select, textarea, .news-item, .work, .mff-card";
    document.querySelectorAll(hoverables).forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
  }

  // ---- scroll reveal ----
  const reveals = document.querySelectorAll(
    ".section-head, .news-item, .work, .founder, .member, .mff-card, .about-blurb-text, .contact-channels, .socials, .contact-form"
  );
  reveals.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  // ---- header hide on scroll-down, show on scroll-up (but stay open with menu) ----
  const header = document.querySelector(".site-header");
  if (header) {
    let lastY = 0;
    window.addEventListener(
      "scroll",
      () => {
        // when nav overlay is open, keep header visible so user can close it
        if (body.classList.contains("nav-open")) {
          header.style.transform = "translateY(0)";
          return;
        }
        const cy = window.scrollY;
        if (cy > 80 && cy > lastY) {
          header.style.transform = "translateY(-110%)";
        } else {
          header.style.transform = "translateY(0)";
        }
        lastY = cy;
      },
      { passive: true }
    );
    header.style.transition = "transform .5s cubic-bezier(.7,.05,.1,1)";
  }

  // ---- news carousel: mouse-drag to scroll (touch uses native scroll) ----
  const rail = document.querySelector(".news-track");
  if (rail) {
    let isDown = false, startX = 0, startScroll = 0, dragged = false;
    const DRAG_THRESHOLD = 6;

    rail.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDown = true; dragged = false;
      startX = e.clientX;
      startScroll = rail.scrollLeft;
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > DRAG_THRESHOLD) dragged = true;
      if (dragged) {
        rail.scrollLeft = startScroll - dx;
        e.preventDefault();
      }
    });
    document.addEventListener("mouseup", () => { isDown = false; });

    // Only suppress the click that follows an actual drag. Taps pass through
    // and the inner <a class="news-card"> navigates as expected.
    rail.addEventListener("click", (e) => {
      if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
    }, true);

    const step = () => {
      const card = rail.querySelector(".news-card");
      if (!card) return rail.clientWidth * 0.8;
      const style = getComputedStyle(rail);
      const gap = parseFloat(style.columnGap || style.gap || 24);
      return card.getBoundingClientRect().width + gap;
    };
    document.querySelectorAll("[data-rail-prev]").forEach((b) =>
      b.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }))
    );
    document.querySelectorAll("[data-rail-next]").forEach((b) =>
      b.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }))
    );
  }

  // ---- contact form (graceful Formspree submit) ----
  const form = document.querySelector(".contact-form");
  if (form) {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", async (e) => {
      // If endpoint not configured, prevent and warn
      if (form.action.includes("YOUR_FORM_ID")) {
        e.preventDefault();
        if (status) {
          status.textContent =
            "Form endpoint not configured. Add your Formspree ID in contact.html.";
          status.className = "form-status err";
        }
        return;
      }
      e.preventDefault();
      if (status) {
        status.textContent = "Sending transmission…";
        status.className = "form-status";
      }
      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.reset();
          if (status) {
            status.textContent = "Received. We'll reply within 48h.";
            status.className = "form-status ok";
          }
        } else {
          throw new Error("Network error");
        }
      } catch (err) {
        if (status) {
          status.textContent = "Something broke. Try emailing us directly.";
          status.className = "form-status err";
        }
      }
    });
  }
})();
