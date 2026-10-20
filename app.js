
// Estado local del carrito
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  // 1. Cargar productos desde el localStorage (trae el Waffle desde personalizar.html)
  loadCartFromStorage();

  // 2. Renderizar el catálogo y actualizar la interfaz del carrito
  renderProducts();
  updateCartUI();

  // 3. Si la URL trae "?cart=open", abre la canasta desplegable automáticamente
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("cart") === "open") {
    openCartDrawer();
  }

  // ... resto de tus escuchadores de eventos (botones, modal, filtros, etc.) ...
});


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

// Renderizar productos en el catálogo
function renderProducts(category = "todos") {
  const grid = document.getElementById("productGrid");
  if (!grid || typeof PRODUCTS === "undefined") return;

  const filtered = (category === "todos" || category === "waffles2")
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === category);

  grid.innerHTML = filtered.map(item => {
    // Si el producto permite agregar directo al carrito o personalizar
    const buttonHtml = item.isCustomizable
      ? `<a href="personalizar.html" class="btn-add" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">Personalizar</a>`
      : `<button class="btn-add" onclick="addToCart(${item.id})">+ Agregar</button>`;

    const toppingsBadge = item.toppingsCount 
      ? `<span style="background-color: #FFF3CD; color: #856404; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; display: inline-block; margin-bottom: 0.4rem;">✨ ${item.toppingsCount} Toppings</span>`
      : '';

    return `
      <article class="product-card">
        <div class="card-img-container">
          <img class="card-img" src="${item.image}" alt="${item.name}" loading="lazy">
          ${item.tag ? `<span class="card-badge">${item.tag}</span>` : ''}
        </div>
        <div class="card-body">
          ${toppingsBadge}
          <h3 class="card-title">${item.name}</h3>
          <p class="card-desc">${item.desc || ''}</p>
          <div class="card-footer">
            <span class="card-price">${formatMoney(item.price)}</span>
            ${buttonHtml}
          </div>
        </div>
      </article>
    `;
  }).join("");
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

function checkoutWhatsApp() {
  try {
    // 1. Validar que la canasta tenga productos
    if (!cart || cart.length === 0) {
      alert("Agrega al menos un producto a la canasta antes de pedir.");
      return;
    }

    // 2. Capturar datos del formulario
    const name = document.getElementById("custName")?.value.trim() || "";
    const deliveryType = document.getElementById("custDeliveryType")?.value || "";
    const address = document.getElementById("custAddress")?.value.trim() || "";
    const geoLink = document.getElementById("custGeoLink")?.value || "";
    const floor = document.getElementById("custFloor")?.value.trim() || "";
    const phone = document.getElementById("custPhone")?.value.trim() || "";

    // Método de pago y efectivo
    const paymentMethod = document.getElementById("custPaymentSelect")?.value || "";
    const cashAmount = document.getElementById("custCashAmount")?.value.trim() || "";

    // Notas
    const notesDelivery = document.getElementById("custNotesDelivery")?.value.trim() || "";
    const notesPickup = document.getElementById("custNotesPickup")?.value.trim() || "";
    const generalNotes = document.getElementById("custNotes")?.value.trim() || "";
    const notes = notesDelivery || notesPickup || generalNotes;

    // 3. Validaciones obligatorias
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

    if (deliveryType === "Reparto en Departamento Vicuña Mackenna" && !floor) {
      alert("Por favor ingresa el número de piso o referencia.");
      return;
    }
    if (paymentMethod === "" && !cashAmount) {
      alert("Por favor selecciona un método de pago.");
      return;
    }
    if (paymentMethod === "Efectivo" && !cashAmount) {
      alert("Por favor ingresa el monto con el que pagarás en efectivo.");
      return;
    }

    // 4. DECLARACIÓN INICIAL DE LA VARIABLE TEXT (Aquí se soluciona el error)
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

    // Agregar el método de pago
    if (paymentMethod) {
      text += `*Método de pago:* ${paymentMethod}\n`;
      if (paymentMethod === "Efectivo" && cashAmount) {
        text += `*Paga con:* ${cashAmount}\n`;
      }
    }

    if (notes) {
      text += `*Detalles o notas:* ${notes}\n`;
    }

    // Detalle de los productos en la canasta
    text += `\n*Detalle del pedido:*\n`;
    cart.forEach(item => {
      text += `• ${item.qty}x ${item.name} (${formatMoney(item.price * item.qty)})\n`;
    });

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    text += `\n*Total a pagar: ${formatMoney(total)}*`;

    // 5. Redirigir a WhatsApp
    const phoneTarget = typeof WHATSAPP_PHONE !== "undefined" ? WHATSAPP_PHONE : "56986593972";
    const url = `https://wa.me/${phoneTarget}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");

  } catch (err) {
    console.error("Error en checkoutWhatsApp:", err);
    alert("Ocurrió un error al generar el pedido. Revisa la consola.");
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
    } else if (selected === "Reparto en Departamento Vicuña Mackenna") {
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

document.addEventListener("DOMContentLoaded", () => {
  const paymentSelect = document.getElementById("custPaymentSelect");
  const cashGroup = document.getElementById("cashGroup");

  if (paymentSelect && cashGroup) {
    paymentSelect.addEventListener("change", (e) => {
      // Si selecciona "Efectivo", muestra la caja; si no, la oculta
      if (e.target.value === "Efectivo") {
        cashGroup.style.display = "block";
      } else {
        cashGroup.style.display = "none";
        // Limpiamos el texto si cambia a transferencia
        const cashInput = document.getElementById("custCashAmount");
        if (cashInput) cashInput.value = "";
      }
    });
  }
});

// ==========================================
// CARGAR OPINIONES EN LA PÁGINA PRINCIPAL
// ==========================================
async function loadHomeReviews() {
  const container = document.getElementById("reviewsContainer");
  if (!container) return;

  const SUPABASE_URL = 'https://cbuwsnihxglprygvkuoh.supabase.co';
  // Reemplaza con tu Publishable Key o Legacy Anon Key activa
  const SUPABASE_KEY = 'sb_publishable_2UXXu9R3hHY9mab9siUV-g_NguxbVXw'; 

  if (typeof window.supabase === "undefined") {
    container.innerHTML = `<p style="text-align:center; color: #777;">Librería de Supabase no disponible.</p>`;
    return;
  }

  try {
    const supabaseHome = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: opiniones, error } = await supabaseHome
      .from('opiniones')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!opiniones || opiniones.length === 0) {
      container.innerHTML = `<p style="text-align:center; color: #777;">Aún no hay opiniones publicadas.</p>`;
      return;
    }

    // Tomar solo las primeras 3 para no recargar la página principal
// Tomar solo las primeras 3 para no recargar la página principal
    const ultimas = opiniones.slice(0, 3);

    container.innerHTML = ultimas.map(op => `
      <div style="background: #fff; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 4px 12px rgba(0,0,0,0.03); aspect-ratio: 1 / 1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box; overflow: hidden;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem; gap: 0.5rem;">
            <strong style="color: #2D2825; font-size: 0.95rem; line-height: 1.2; word-break: break-word;">${escapeHomeHtml(op.nombre)}</strong>
            <span style="font-size: 0.85rem; flex-shrink: 0;">${"⭐".repeat(op.estrellas || 5)}</span>
          </div>
          <!-- Texto de opinión con scroll interno discreto en caso de ser muy largo -->
          <p style="margin: 0; color: #555; font-size: 0.88rem; line-height: 1.45; max-height: 110px; overflow-y: auto; scrollbar-width: none; font-style: italic;">
            "${escapeHomeHtml(op.comentario)}"
          </p>
        </div>
        <!-- Fecha al pie de la tarjeta -->
        <span style="display: block; font-size: 0.75rem; color: #aaa; margin-top: 0.5rem;">
          ${op.created_at ? new Date(op.created_at).toLocaleDateString('es-CL') : 'Reciente'}
        </span>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error al cargar opiniones en la Home:", err);
    container.innerHTML = `<p style="text-align:center; color: #777;">No se pudieron cargar las opiniones.</p>`;
  }
}

function escapeHomeHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Ejecutar automáticamente al cargar la página principal
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadHomeReviews);
} else {
  loadHomeReviews();
}

// Cargar la canasta guardada en localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem("miel_cart");
  if (savedCart) {
    try {
      const items = JSON.parse(savedCart);
      if (Array.isArray(items)) {
        cart = items; // Carga los productos guardados (incluyendo el Waffle personalizado)
      }
    } catch (e) {
      console.error("Error al leer la canasta guardada:", e);
    }
  }
}

// Guardar el estado actual de la canasta en localStorage
function syncCartStorage() {
  localStorage.setItem("miel_cart", JSON.stringify(cart));
}

// Sobrescribimos updateCartUI para que siempre sincronice el localStorage
const originalUpdateCartUI = typeof updateCartUI === "function" ? updateCartUI : null;

// Modifica la función updateCartUI existente para agregar la sincronización
function updateCartUI() {
  const countBadge = document.getElementById("cartCount");
  const totalDisplay = document.getElementById("cartTotalDisplay") || document.querySelector(".cart-total-amount");
  const list = document.getElementById("cartItemsList");

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (countBadge) countBadge.textContent = totalQty;
  if (totalDisplay) totalDisplay.textContent = formatMoney(totalPrice);

  // Sincronizamos con localStorage cada vez que cambia el carrito
  syncCartStorage();

  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `<p style="text-align: center; color: var(--text-muted, #777); margin-top: 2rem;">Tu canasta está vacía 🧁</p>`;
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item-row" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid var(--border-subtle, #eee);">
      <div class="cart-item-info">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.2rem; line-height: 1.3;">${item.name}</h4>
        <p style="font-size: 0.85rem; color: var(--text-muted, #777);">${formatMoney(item.price)} c/u</p>
      </div>
      <div class="cart-item-qty" style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">-</button>
        <span style="font-weight: 600;">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
    </div>
  `).join("");
}

// Ajusta changeQty para manejar IDs de texto (como "waffle_171000...")
function changeQty(productId, delta) {
  const index = cart.findIndex(item => String(item.id) === String(productId));
  if (index === -1) return;

  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
}


document.addEventListener("DOMContentLoaded", () => {
  // Buscar el selector o elemento de la opción
  const waffleOptionSelect = document.getElementById("waffles2"); // Reemplaza con el ID de tu selector

  if (waffleOptionSelect) {
    waffleOptionSelect.addEventListener("change", (e) => {
      // Si el usuario elige la opción de personalizar
      if (e.target.value === "waffles2") { // Reemplaza por el valor correspondiente
        // Redirige automáticamente a la página de personalización
        window.location.href = "personalizar.html";
      }
    });
  }
});
