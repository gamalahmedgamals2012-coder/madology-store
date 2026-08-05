/* ===================================================
   Add-to-Cart Modal Controller
   Step 1: Confirmation modal
   Step 2: Size selection modal
   =================================================== */

const ATC_MODAL = (() => {
  /* ---------- state ---------- */
  let currentProduct = null;       // { name, price, image, quantity, id }
  let currentStep = 1;
  let selectedSize = "";

  /* ---------- DOM cache ---------- */
  let overlay = null;
  let modal  = null;

  /* ---------- helpers ---------- */
  function buildProductPreview(product) {
    return `
      <div class="atc-product-preview">
        <img src="${product.image}" alt="${product.name}" />
        <div class="atc-product-details">
          <h3>${product.name}</h3>
          <p class="atc-product-price">${product.price} L.E</p>
        </div>
      </div>
    `;
  }

  function buildStepIndicator(step) {
    return `
      <div class="atc-step-indicator">
        <div class="atc-step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}"></div>
        <div class="atc-step-dot ${step >= 2 ? 'active' : ''}"></div>
      </div>
    `;
  }

  function buildStep1(product) {
    return `
      <div class="atc-modal-inner">
        ${buildStepIndicator(1)}
        ${buildProductPreview(product)}
        <p class="atc-modal-message">Are you sure you want to add this item to your cart?</p>
        <div class="atc-modal-actions">
          <button class="btn-cancel" data-action="cancel">Cancel</button>
          <button class="btn-continue" data-action="continue">Continue</button>
        </div>
      </div>
    `;
  }

  function buildStep2(product) {
    const sizes = ["S", "M", "L", "XL", "XXL"];
    const sizeOptions = sizes
      .map(
        (s) => `
        <div class="size-option">
          <input type="radio" name="atc-size" id="atc-size-${s}" value="${s}" />
          <label for="atc-size-${s}">${s}</label>
        </div>
      `
      )
      .join("");

    return `
      <div class="atc-modal-inner">
        ${buildStepIndicator(2)}
        ${buildProductPreview(product)}
        <div class="size-selector">
          <span class="size-selector-label">Select Size</span>
          <div class="size-selector-grid">
            ${sizeOptions}
          </div>
          <div class="size-error" id="sizeError">Please select a size before adding to cart.</div>
        </div>
        <div class="atc-modal-actions">
          <button class="btn-back" data-action="back">Back</button>
          <button class="btn-add-cart" data-action="add-to-cart">Add to Cart</button>
        </div>
      </div>
    `;
  }

  /* ---------- render ---------- */
  function render() {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      document.body.appendChild(overlay);
    }

    modal = document.createElement("div");
    modal.className = "atc-modal";

    const closeBtn = document.createElement("button");
    closeBtn.className = "atc-modal-close";
    closeBtn.setAttribute("data-action", "close");
    closeBtn.innerHTML = "&times;";

    const content = document.createElement("div");
    if (currentStep === 1) {
      content.innerHTML = buildStep1(currentProduct);
    } else {
      content.innerHTML = buildStep2(currentProduct);
    }

    modal.appendChild(closeBtn);
    modal.appendChild(content);
    overlay.innerHTML = "";
    overlay.appendChild(modal);

    // Show with a tiny delay for CSS transition
    requestAnimationFrame(() => {
      overlay.classList.add("active");
    });
  }

  /* ---------- close ---------- */
  function close() {
    if (overlay) {
      overlay.classList.remove("active");
    }
    // Reset state after transition
    setTimeout(() => {
      if (overlay) {
        overlay.innerHTML = "";
      }
      currentStep = 1;
      selectedSize = "";
    }, 350);
  }

  /* ---------- validation ---------- */
  function getSelectedSize() {
    if (!overlay) return "";
    const checked = overlay.querySelector('input[name="atc-size"]:checked');
    return checked ? checked.value : "";
  }

  /* ---------- event delegation ---------- */
  function handleOverlayClick(e) {
    if (!overlay) return;

    const target = e.target;

    // Close if overlay background clicked
    if (target === overlay) {
      close();
      return;
    }

    const actionBtn = target.closest("[data-action]");
    if (!actionBtn) return;

    const action = actionBtn.getAttribute("data-action");

    switch (action) {
      case "close":
      case "cancel":
        close();
        break;

      case "continue":
        // Go to step 2
        currentStep = 2;
        render();
        break;

      case "back":
        // Go back to step 1
        currentStep = 1;
        selectedSize = "";
        render();
        break;

      case "add-to-cart": {
        // Validate size
        const size = getSelectedSize();
        if (!size) {
          const errorEl = overlay.querySelector("#sizeError");
          if (errorEl) {
            errorEl.classList.add("visible");
          }
          return;
        }

        selectedSize = size;

        // Actually add to cart now
        if (currentProduct && window.MADOLOGY_CART) {
          window.MADOLOGY_CART.addItem({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            quantity: currentProduct.quantity,
            img: currentProduct.image,
            image: currentProduct.image,
            color: currentProduct.color || "Default",
            size: selectedSize
          });

          // Update cart UI
          if (typeof updateCartCount === "function") {
            updateCartCount();
          }
          if (typeof renderCart === "function") {
            renderCart();
          }
          // Dispatch a custom event so other parts of the app can react
          document.dispatchEvent(new CustomEvent("cart-updated"));
        }

        close();
        break;
      }

      default:
        break;
    }
  }

  /* ---------- public API ---------- */
  function open(product) {
    if (!product) return;

    // Clear any previous size error
    currentStep = 1;
    selectedSize = "";
    currentProduct = {
      id: product.id || product.img || product.image || Date.now().toString(),
      name: product.name,
      price: product.price,
      image: product.image || product.img,
      quantity: product.quantity || 1,
      color: product.color || "Default"
    };

    render();
  }

  /* ---------- init ---------- */
  function init() {
    document.addEventListener("click", handleOverlayClick);
  }

  return {
    init,
    open,
    close
  };
})();

/* Auto-initialize when DOM is ready */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ATC_MODAL.init());
} else {
  ATC_MODAL.init();
}