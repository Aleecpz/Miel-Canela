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
  const totalDisplay = document.getElementById("cartTotalDisplay");
  const list = document.getElementById("cartItemsList");

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  countBadge.textContent = totalQty;
  totalDisplay.textContent = formatMoney(totalPrice);

  if (cart.length === 0) {
    list.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Tu canasta está vacía 🧁</p>`;
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-item-row">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>${formatMoney(item.price)} c/u</p>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join("");
}

// Controles para abrir y cerrar el carrito
function openCartDrawer() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartBackdrop").classList.add("show");
}

function closeCartDrawer() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartBackdrop").classList.remove("show");
}

// Preparar y enviar mensaje a WhatsApp
// Actualizar función de checkout
// Actualizar función de checkout
function checkoutWhatsApp() {
  if (cart.length === 0) {
    alert("Agrega al menos un producto a la canasta.");
    return;
  }

  // Lectura segura: si el elemento no existe en el HTML, no revienta el código
  const name = document.getElementById("custName")?.value.trim() || "";
  const date = document.getElementById("custDate")?.value.trim() || "";
  const notes = document.getElementById("custNotes")?.value.trim() || "";
  const deliveryType = document.getElementById("custDeliveryType")?.value || "Despacho a Domicilio";
  const address = document.getElementById("custAddress")?.value.trim() || "";
  const geoLink = document.getElementById("custGeoLink")?.value || "";
  const phone = document.getElementById("custPhone")?.value.trim() || "";

  if (!name) {
    alert("Por favor escribe tu nombre para registrar el pedido.");
    return;
  }

  if (deliveryType === "Despacho a Domicilio" && !address && !geoLink) {
    alert("Por favor ingresa tu dirección o usa el botón de ubicación GPS.");
    return;
  }

  if (deliveryType === "Retiro en Vicuña Mackenna" && !phone) {
    alert("Por favor ingresa tu número de contacto para coordinar el retiro.");
    return;
  }

  // Verificar que la variable del teléfono de WhatsApp exista
  const targetPhone = typeof WHATSAPP_PHONE !== "undefined" ? WHATSAPP_PHONE : "+56986593972";

  // Armar el mensaje
  let text = `*¡Hola! Quiero hacer un encargo en Miel & Canela* 🍰\n\n`;
  text += `*Cliente:* ${name}\n`;
  if (date) text += `*Fecha/Hora deseada:* ${date}\n`;
  text += `*Modalidad:* ${deliveryType}\n`;

  if (deliveryType === "Despacho a Domicilio") {
    if (address) text += `*Dirección:* ${address}\n`;
    if (geoLink) text += `*Ubicación GPS:* ${geoLink}\n`;
  } else {
    text += `*Teléfono de contacto:* ${phone}\n`;
  }

  if (notes) text += `*Notas:* ${notes}\n`;

  text += `\n*Detalle del pedido:*\n`;
  cart.forEach(item => {
    text += `• ${item.qty}x ${item.name} (${formatMoney(item.price * item.qty)})\n`;
  });

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  text += `\n*Total a pagar: ${formatMoney(total)}*`;

  // Abrir WhatsApp
  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

// Ocultar dirección si es retiro + botón GPS
document.addEventListener("DOMContentLoaded", () => {
  
  // ... resto de tu código existente ...

  const deliverySelect = document.getElementById("custDeliveryType");
  const addressGroup = document.getElementById("addressGroup");
  const pickupGroup = document.getElementById("pickupGroup");

  if (deliverySelect) {
    deliverySelect.addEventListener("change", (e) => {
      if (e.target.value === "Retiro en Vicuña Mackenna") {
        addressGroup.style.display = "none";
        pickupGroup.style.display = "block";
      } else {
        addressGroup.style.display = "block";
        pickupGroup.style.display = "none";
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
  const geoLinkInput = document.getElementById("custGeoLink");

  // Ocultar campo de dirección si eligen 'Retiro'
  if (deliverySelect) {
    deliverySelect.addEventListener("change", (e) => {
      addressGroup.style.display = e.target.value === "Retiro en Vicuña Mackenna" ? "none" : "block";
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

