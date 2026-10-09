// Estado local del carrito
let cart = [];

// Formateador de moneda (Pesos chilenos)
const formatMoney = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount);
};

// Renderizar productos en el catálogo
function renderProducts(category = "todos") {
  const grid = document.getElementById("productGrid");
  const filtered = category === "todos" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === category);

  grid.innerHTML = filtered.map(item => `
    <article class="product-card">
      <div class="card-img-container">
        <img class="card-img" src="${item.image}" alt="${item.name}" loading="lazy">
        ${item.tag ? `<span class="card-badge">${item.tag}</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${item.name}</h3>
        <p class="card-desc">${item.desc}</p>
        <div class="card-footer">
          <span class="card-price">${formatMoney(item.price)}</span>
          <button class="btn-add" onclick="addToCart(${item.id})">+ Agregar</button>
        </div>
      </div>
    </article>
  `).join("");
}

// Agregar producto al carrito
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  openCartDrawer();
}

// Modificar cantidades en el carrito
function changeQty(productId, delta) {
  const index = cart.findIndex(item => item.id === productId);
  if (index === -1) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
}

// Actualizar la interfaz del carrito
function updateCartUI() {
  const countBadge = document.getElementById("cartCount");
  const totalDisplay = document.getElementById("cartTotalDisplay") || document.querySelector(".cart-total-amount");
  const list = document.getElementById("cartItemsList");

  // Sumar la cantidad real de todos los productos en el carrito
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 👉 Actualizar el número de la burbujita:
  if (countBadge) {
    countBadge.textContent = totalQty;
  }

  // Actualizar el total en dinero ($1.500):
  if (totalDisplay) {
    totalDisplay.textContent = formatMoney(totalPrice);
  }

  // Si no hay productos
  if (cart.length === 0) {
    if (list) list.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Tu canasta está vacía 🧁</p>`;
    return;
  }

  // Renderizar la lista de productos dentro del carrito
  if (list) {
    list.innerHTML = cart.map(item => `
      <div class="cart-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid var(--border-subtle, #eee);">
        <div class="cart-item-info">
          <h4 style="font-size: 0.95rem; margin-bottom: 0.2rem;">${item.name}</h4>
          <p style="font-size: 0.85rem; color: var(--text-muted, #777);">${formatMoney(item.price)} c/u</p>
        </div>
        <div class="cart-item-qty" style="display: flex; align-items: center; gap: 0.5rem;">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
          <span style="font-weight: 600;">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
    `).join("");
  }
}

// Controles para abrir y cerrar el carrito
function openCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  
  if (drawer) drawer.classList.add("open");
  if (backdrop) backdrop.classList.add("show");
  document.body.classList.add("cart-is-open");
}

function closeCartDrawer() {
  const drawer = document.getElementById("cartDrawer");
  const backdrop = document.getElementById("cartBackdrop");
  
  if (drawer) drawer.classList.remove("open");
  if (backdrop) backdrop.classList.remove("show");
  document.body.classList.remove("cart-is-open");
}

// Preparar y enviar mensaje a WhatsApp
// Actualizar función de checkout
// Actualizar función de checkout
function checkoutWhatsApp() {
  try {
    // 1. Validar que la canasta tenga productos
    if (!cart || cart.length === 0) {
      alert("Agrega al menos un producto a la canasta antes de pedir.");
      return;
    }

    // 2. Obtener datos de forma segura (sin fallar si falta un elemento)
    const name = document.getElementById("custName")?.value.trim() || "";
    const deliveryType = document.getElementById("custDeliveryType")?.value || "";
    const address = document.getElementById("custAddress")?.value.trim() || "";
    const geoLink = document.getElementById("custGeoLink")?.value || "";
    const floor = document.getElementById("custFloor")?.value.trim() || "";
    const phone = document.getElementById("custPhone")?.value.trim() || "";

    // Notas según lo que esté escrito en el formulario
    const notesDelivery = document.getElementById("custNotesDelivery")?.value.trim() || "";
    const notesPickup = document.getElementById("custNotesPickup")?.value.trim() || "";
    const generalNotes = document.getElementById("custNotes")?.value.trim() || "";
    const notes = notesDelivery || notesPickup || generalNotes;

    // 3. Validaciones básicas obligatorias
    if (!name) {
      alert("Por favor ingresa tu nombre y apellido.");
      return;
    }

    if (!deliveryType) {
      alert("Por favor selecciona una modalidad de entrega.");
      return;
    }

    if (deliveryType === "Despacho a Domicilio" && !address && !geoLink) {
      alert("Por favor ingresa tu dirección de entrega o comparte tu ubicación GPS.");
      return;
    }

    // 4. Número de WhatsApp de destino (prefijo 56 para Chile)
    const phoneTarget = typeof WHATSAPP_PHONE !== "undefined" ? WHATSAPP_PHONE : "56986593972";

    // 5. Construcción del mensaje
    let text = `*¡Hola! Quiero hacer un encargo en Miel & Canela* 🍰\n\n`;
    text += `*Cliente:* ${name}\n`;
    text += `*Modalidad:* ${deliveryType}\n`;

    if (deliveryType === "Despacho a Domicilio") {
      if (address) text += `*Dirección:* ${address}\n`;
      if (geoLink) text += `*Ubicación GPS:* ${geoLink}\n`;
    } else {
      if (floor) text += `*Piso / Referencia:* ${floor}\n`;
      if (phone) text += `*Teléfono de contacto:* ${phone}\n`;
    }

    if (notes) {
      text += `*Detalles o notas:* ${notes}\n`;
    }

    text += `\n*Detalle del pedido:*\n`;
    cart.forEach(item => {
      const priceText = typeof formatMoney === "function" 
        ? formatMoney(item.price * item.qty) 
        : `$${item.price * item.qty}`;
      text += `• ${item.qty}x ${item.name} (${priceText})\n`;
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const totalText = typeof formatMoney === "function" ? formatMoney(total) : `$${total}`;
    text += `\n*Total a pagar: ${totalText}*`;

    // 6. Redirigir a WhatsApp
    const url = `https://wa.me/${phoneTarget}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

  } catch (err) {
    console.error("Error en checkoutWhatsApp:", err);
    alert("Ocurrió un error al generar el pedido. Revisa la consola del navegador.");
  }
}

// Ocultar dirección si es retiro + botón GPS
document.addEventListener("DOMContentLoaded", () => {
  
  // ... resto de tu código existente ...
  const deliverySelect = document.getElementById("custDeliveryType");
  const addressGroup = document.getElementById("addressGroup");
  const pickupGroup = document.getElementById("pickupGroup");
  const deliveryHint = document.getElementById("deliveryHint");

if (deliverySelect) {
  deliverySelect.addEventListener("change", (e) => {
    const selected = e.target.value;

    if (selected === "Despacho a Domicilio") {
      addressGroup.style.display = "block";
      pickupGroup.style.display = "none";
      if (deliveryHint) deliveryHint.style.display = "none";
    } else if (selected === "Retiro en Departamento Vicuña Mackenna") {
      addressGroup.style.display = "none";
      pickupGroup.style.display = "block";
      if (deliveryHint) deliveryHint.style.display = "none";
    } else {
      addressGroup.style.display = "none";
      pickupGroup.style.display = "none";
      if (deliveryHint) deliveryHint.style.display = "block";
    }
  });
}

  // Obtener enlace de Google Maps con las coordenadas del cliente
  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización.");
        return;
      }

      geoBtn.textContent = "Obteniendo ubicación...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          geoLinkInput.value = `https://maps.google.com/?q=${lat},${lon}`;
          geoBtn.textContent = "✅ Ubicación GPS lista";
          geoBtn.style.backgroundColor = "#d4edda";
        },
        (error) => {
          console.error(error);
          geoBtn.textContent = "📍 Reintentar ubicación GPS";
          alert("No se pudo obtener la ubicación. Por favor escribe tu dirección manualmente.");
        }
      );
    });
  }
});
// Ocultar dirección si es retiro + botón GPS
document.addEventListener("DOMContentLoaded", () => {
  // ... resto de tu código existente ...

  const deliverySelect = document.getElementById("custDeliveryType");
  const addressGroup = document.getElementById("addressGroup");
  const geoBtn = document.getElementById("geoBtn");
  const deliveryType = document.getElementById("custDeliveryType")?.value || "";

  if (!deliveryType) {
    alert("Por favor selecciona una modalidad de entrega (Despacho o Retiro).");
    return;
  }

  // Obtener enlace de Google Maps con las coordenadas del cliente
  if (geoBtn) {
    geoBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización.");
        return;
      }

      geoBtn.textContent = "Obteniendo ubicación...";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          geoLinkInput.value = `https://maps.google.com/?q=${lat},${lon}`;
          geoBtn.textContent = "✅ Ubicación GPS lista";
          geoBtn.style.backgroundColor = "#d4edda";
        },
        (error) => {
          console.error(error);
          geoBtn.textContent = "📍 Reintentar ubicación GPS";
          alert("No se pudo obtener la ubicación. Por favor escribe tu dirección manualmente.");
        }
      );
    });
  }
});

// Inicialización de Eventos al cargar
document.addEventListener("DOMContentLoaded", () => {
  renderProducts();

  // Filtros de categoría
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(btn.dataset.category);
    });
  });

  // Eventos Carrito
  document.getElementById("openCartBtn").addEventListener("click", openCartDrawer);
  document.getElementById("closeCartBtn").addEventListener("click", closeCartDrawer);
  document.getElementById("cartBackdrop").addEventListener("click", closeCartDrawer);
  document.getElementById("checkoutWhatsappBtn").addEventListener("click", checkoutWhatsApp);
});

