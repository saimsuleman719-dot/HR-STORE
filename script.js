
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  const nav = $("#nav");
  const menuToggle = $("#menuToggle");
  const cartDrawer = $("#cartDrawer");
  const overlay = $("#overlay");
  const cartItems = $("#cartItems");
  const cartCount = $("#cartCount");
  const cartTotal = $("#cartTotal");
  const searchInput = $("#productSearch");
  const emptyState = $("#emptyState");
  const toast = $("#toast");

  const cart = new Map();
  let activeCategory = "all";
  let toastTimer;

  $("#year").textContent = new Date().getFullYear();

  // Notifications
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // Mobile navigation
  function closeMenu() {
    nav.classList.remove("open");
    menuToggle.textContent = "☰";
    menuToggle.setAttribute("aria-expanded", "false");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    menuToggle.textContent = isOpen ? "✕" : "☰";
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".nav a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  // Smooth scrolling with reduced-motion accessibility
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function scrollToSection(target) {
    if (!target) return;

    target.scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  }

  // Back to Home button near the footer
  $("#backHomeButton").addEventListener("click", (event) => {
    event.preventDefault();
    closeMenu();
    scrollToSection($("#home"));
  });

  // Reveal sections as they enter the viewport
  const revealElements = $$(".reveal");

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -25px 0px"
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("visible");
    });
  }

  // Highlight navigation links while scrolling
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          $$(".nav > a[href^='#']").forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        });
      },
      {
        rootMargin: "-25% 0px -65% 0px"
      }
    );

    $$("main section[id]").forEach((section) => {
      sectionObserver.observe(section);
    });
  }

  // Product filtering and search
  const products = $$(".product-card");
  const filterButtons = $$(".filter-btn");

  function filterProducts() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    products.forEach((product) => {
      const categoryMatches =
        activeCategory === "all" ||
        product.dataset.category === activeCategory;

      const searchMatches =
        product.dataset.name.toLowerCase().includes(query) ||
        product.textContent.toLowerCase().includes(query);

      const visible = categoryMatches && searchMatches;

      product.hidden = !visible;

      if (visible) visibleCount++;
    });

    emptyState.hidden = visibleCount !== 0;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filter;

      filterButtons.forEach((filter) => {
        filter.classList.toggle("active", filter === button);
      });

      filterProducts();
    });
  });

  searchInput.addEventListener("input", filterProducts);

  // Selecting a category from the overview cards
  $$("[data-category-link]").forEach((link) => {
    link.addEventListener("click", () => {
      activeCategory = link.dataset.categoryLink;

      filterButtons.forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.filter === activeCategory
        );
      });

      filterProducts();
    });
  });

  // Shopping cart drawer
  function openCart() {
    cartDrawer.classList.add("open");
    overlay.classList.add("show");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#closeCart").focus();
  }

  function closeCart() {
    cartDrawer.classList.remove("open");
    overlay.classList.remove("show");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  $("#cartButton").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeCart();
    }
  });

  function formatPrice(amount) {
    return "Rs. " + amount.toLocaleString("en-PK");
  }

  function addToCart(name, price) {
    const item = cart.get(name);

    if (item) {
      item.quantity += 1;
    } else {
      cart.set(name, {
        name,
        price,
        quantity: 1
      });
    }

    renderCart();
    showToast(`${name} added to your cart.`);
  }

  function updateQuantity(name, change) {
    const item = cart.get(name);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
      cart.delete(name);
    }

    renderCart();
  }

  function renderCart() {
    const items = Array.from(cart.values());

    const count = items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    cartCount.textContent = count;
    cartTotal.textContent = formatPrice(total);

    if (items.length === 0) {
      cartItems.innerHTML =
        '<p class="cart-empty">Your cart is empty. Explore our products to get started.</p>';
      return;
    }

    cartItems.replaceChildren();

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";

      const details = document.createElement("div");
      const title = document.createElement("h4");
      const price = document.createElement("p");
      const controls = document.createElement("div");

      title.textContent = item.name;
      price.textContent = `${formatPrice(item.price)} each`;
      controls.className = "cart-controls";

      const minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", `Remove one ${item.name}`);
      minus.addEventListener("click", () => {
        updateQuantity(item.name, -1);
      });

      const quantity = document.createElement("span");
      quantity.textContent = item.quantity;

      const plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", `Add one ${item.name}`);
      plus.addEventListener("click", () => {
        updateQuantity(item.name, 1);
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.className = "remove-item";
      remove.addEventListener("click", () => {
        cart.delete(item.name);
        renderCart();
      });

      controls.append(minus, quantity, plus, remove);
      details.append(title, price, controls);

      const subtotal = document.createElement("strong");
      subtotal.textContent = formatPrice(item.price * item.quantity);

      row.append(details, subtotal);
      cartItems.append(row);
    });
  }

  $$(".add-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.product;
      const price = Number(button.dataset.price);

      if (!name || !Number.isFinite(price) || price < 0) return;

      addToCart(name, price);
    });
  });

  // Prepare a bundle enquiry in the contact form
  $$(".bundle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const bundle = button.dataset.bundle;

      $("#contactSubject").value = "Pricing and bundles";
      $("#contactForm").elements.message.value =
        `Hello HR STORE, I would like information about the ${bundle}. Please confirm its current contents, availability, and price.`;

      scrollToSection($("#contact"));
      showToast(`${bundle} enquiry prepared. Complete the contact form.`);
    });
  });

  // Prepare an enquiry for the cart items
  $("#checkoutButton").addEventListener("click", () => {
    if (cart.size === 0) {
      showToast("Your cart is empty. Add products first.");
      return;
    }

    const items = Array.from(cart.values());

    const summary = items.map((item) =>
      `${item.name} x ${item.quantity} — ${formatPrice(item.price * item.quantity)}`
    ).join("\n");

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    $("#contactSubject").value = "Product availability";
    $("#contactForm").elements.message.value =
      `Hello HR STORE, please confirm availability and final pricing for these items:\n\n${summary}\n\nEstimated total: ${formatPrice(total)}`;

    closeCart();
    scrollToSection($("#contact"));
    showToast("Your item enquiry is ready. Complete the contact form.");
  });

  // Feedback form: frontend validation demo
  $("#feedbackForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = form.elements.name.value.trim();
    const rating = form.elements.rating.value;

    $("#feedbackStatus").textContent =
      `Thank you, ${name}! Your ${rating}-star feedback passed validation. It has not been saved to a server.`;

    console.log(
      "Demo feedback:",
      Object.fromEntries(new FormData(form))
    );

    showToast("Feedback form validated successfully.");
    form.reset();
  });

  // Contact form: frontend validation demo
  $("#contactForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = form.elements.name.value.trim();

    $("#contactStatus").textContent =
      `Thank you, ${name}! Your enquiry passed validation. Connect a backend to send it to HR STORE.`;

    console.log(
      "Demo contact enquiry:",
      Object.fromEntries(new FormData(form))
    );

    showToast("Contact form validated successfully.");
    form.reset();
  });

  // Header shadow while scrolling
  window.addEventListener("scroll", () => {
    $("#header").style.boxShadow =
      window.scrollY > 25
        ? "0 7px 25px #0004"
        : "none";
  }, { passive: true });
});
