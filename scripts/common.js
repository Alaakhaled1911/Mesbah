(function () {
  "use strict";

  /* ------------------------- Utilities ------------------------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) =>
    Array.from((ctx || document).querySelectorAll(sel));

  async function fetchHtml(path) {
    try {
      const res = await fetch(path);
      if (!res.ok)
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      console.error("fetchHtml error", path, err);
      return null;
    }
  }

  /* --------------------- Component Injection -------------------- */
  async function injectComponent(path, selector) {
    const html = await fetchHtml(path);
    if (!html) return false;
    const container = qs(selector);
    if (!container) return false;
    container.innerHTML = html;
    return true;
  }

  /* ----------------------- Event wiring ------------------------- */
  function wireFooterCtas() {
    qsa(".footer-cta").forEach((btn) => {
      // use data-href so components can declare intent without inline onclick
      const target = btn.dataset.href || "order.html";
      btn.addEventListener("click", () => (window.location.href = target));
    });
  }

  function wireOrderButtons() {
    qsa(".product-actions .action-btn.primary").forEach((btn) => {
      // remove any inline handlers and attach a single behavior
      btn.removeAttribute("onclick");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "order-success.html";
      });
    });
  }

  function wireQuantityControls() {
    qsa(".qty-controls").forEach((wrapper) => {
      const minus = qs(".qty-btn.minus", wrapper);
      const plus = qs(".qty-btn.plus", wrapper);
      const input = qs(".qty-input", wrapper);
      if (!input) return;

      minus &&
        minus.addEventListener("click", () => {
          const v = Math.max(1, parseInt(input.value || "1", 10) - 1);
          input.value = v;
        });

      plus &&
        plus.addEventListener("click", () => {
          const v = Math.max(1, parseInt(input.value || "1", 10) + 1);
          input.value = v;
        });
    });
  }

  function wireThumbnails() {
    qsa(".thumbnails").forEach((group) => {
      const mainImg = qs("#mainImg");
      qsa(".thumbnail", group).forEach((thumb) => {
        thumb.addEventListener("click", () => {
          qsa(".thumbnail", group).forEach((t) => t.classList.remove("active"));
          thumb.classList.add("active");
          const img = qs("img", thumb);
          if (img && mainImg) mainImg.src = img.src;
        });
      });
    });
  }

  function wireCategoryCardAnimation() {
    qsa(".category-card").forEach((card) => {
      card.addEventListener("click", () => {
        card.style.transform = "scale(0.95)";
        setTimeout(() => (card.style.transform = ""), 150);
      });
    });
  }

  /* ------------------------- Slider logic ----------------------- */
  function wireBudgetSlider() {
    const fromSlider = qs("#fromSlider");
    const toSlider = qs("#toSlider");
    const fromInput = qs("#fromInput");
    const toInput = qs("#toInput");
    const sliderRange = qs(".slider-range");

    if (!fromSlider || !toSlider || !fromInput || !toInput) return;

    function controlFromInput(fromSlider, fromInput, toInput, controlSlider) {
      const [from, to] = getParsedValue(fromInput, toInput);
      fillSlider(fromInput, toInput, toSlider, sliderRange);
      if (from > to) {
        fromSlider.value = to;
        fromInput.value = to;
      } else {
        fromSlider.value = from;
      }
    }

    function controlToInput(toSlider, fromInput, toInput, controlSlider) {
      const [from, to] = getParsedValue(fromInput, toInput);
      fillSlider(fromInput, toInput, toSlider, sliderRange);
      if (from <= to) {
        toSlider.value = to;
      } else {
        toInput.value = from;
        toSlider.value = from;
      }
    }

    function getParsedValue(fromInput, toInput) {
      const from = parseInt(fromInput.value, 10);
      const to = parseInt(toInput.value, 10);
      return [from, to];
    }

    function fillSlider(fromInput, toInput, toSlider, sliderRange) {
      const rangeDistance = toSlider.max - toSlider.min;
      const fromPosition = fromInput.value - toSlider.min;
      const toPosition = toInput.value - toSlider.min;
      sliderRange.style.left = `${(fromPosition / rangeDistance) * 100}%`;
      sliderRange.style.width = `${
        ((toPosition - fromPosition) / rangeDistance) * 100
      }%`;
    }

    fromSlider.oninput = () => {
      const value = Math.min(
        parseInt(fromSlider.value, 10),
        parseInt(toSlider.value, 10) - 100
      );
      fromSlider.value = value;
      fromInput.value = value;
      fillSlider(fromInput, toInput, toSlider, sliderRange);
    };

    toSlider.oninput = () => {
      const value = Math.max(
        parseInt(toSlider.value, 10),
        parseInt(fromSlider.value, 10) + 100
      );
      toSlider.value = value;
      toInput.value = value;
      fillSlider(fromInput, toInput, toSlider, sliderRange);
    };

    fromInput.oninput = () => {
      controlFromInput(fromSlider, fromInput, toInput, toSlider);
    };

    toInput.oninput = () => {
      controlToInput(toSlider, fromInput, toInput, fromSlider);
    };
    fillSlider(fromInput, toInput, toSlider, sliderRange);
  }

  /* --------------------- Image upload area --------------------- */
  function wireImageUpload() {
    const uploadArea = qs(".image-upload-area");
    const fileInput = qs("#imageUpload");
    if (!uploadArea || !fileInput) return;

    uploadArea.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/))
        return alert("Please select a PNG or JPEG image file.");
      if (file.size > 5 * 1024 * 1024)
        return alert("File size must be less than 5MB.");

      const fileName = file.name;
      uploadArea.innerHTML = `
        <div class="upload-icon">📁</div>
        <p class="upload-text">Selected: ${fileName}</p>
        <p class="upload-instruction"><strong>File ready for upload</strong></p>
      `;
    });

    // drag & drop
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#808DD3";
      uploadArea.style.background = "#f0f4ff";
    });

    uploadArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#dee2e6";
      uploadArea.style.background = "#f8f9fa";
    });

    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = "#dee2e6";
      uploadArea.style.background = "#f8f9fa";
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      fileInput.files = files;
      fileInput.dispatchEvent(new Event("change"));
    });
  }

  /* -------------------- Forms and navigation ------------------- */
  function wireOrderForm() {
    const form = qs(".order-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      window.location.href = "request-success.html";
    });
  }

  function wireInternalLinksWithFade() {
    qsa('a[href$=".html"]').forEach((link) => {
      link.addEventListener("click", function (e) {
        // keep default for external or hashes
        const href = this.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("http")) return;
        e.preventDefault();
        document.body.style.opacity = "0.8";
        document.body.style.transition = "opacity 0.3s ease";
        setTimeout(() => (window.location.href = href), 300);
      });
    });
  }

  /* ------------------------- Breadcrumbs ----------------------- */
  function ensureBreadcrumbs() {
    qsa(".breadcrumbs").forEach((bc) => {
      if (qs(".current", bc)) return; // already defined in page
      const title = (document.title || "").replace(" - Mesbah", "") || "Page";
      bc.innerHTML = `<a href="index.html">Home</a> &gt; <span class="current">${title}</span>`;
    });
  }

  /* ---------------------------- Init --------------------------- */
  async function init() {
    // Inject components if placeholders exist
    await injectComponent("components/footer.html", "footer.footer");

    // Wire behaviors (order matters doesn't matter much)
    wireFooterCtas();
    wireOrderButtons();
    wireQuantityControls();
    wireThumbnails();
    wireBudgetSlider();
    wireOrderForm();
    wireInternalLinksWithFade();
    wireCategoryCardAnimation();
    wireImageUpload();
    ensureBreadcrumbs();

    // small convenience: home buttons sometimes exist in success pages
    const goHome = qs(".go-home");
    if (goHome)
      goHome.addEventListener(
        "click",
        () => (window.location.href = "index.html")
      );
  }

  // Start once DOM is ready
  document.addEventListener("DOMContentLoaded", init);
})();
