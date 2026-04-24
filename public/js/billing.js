// billing.js - Handles cart logic for multi-item sales, per-item and total discount

document.addEventListener("DOMContentLoaded", function () {
  let cart = [];

  function renderCart() {
    const cartItemsDiv = document.getElementById("cart-items");
    if (cart.length === 0) {
      cartItemsDiv.innerHTML = '<div class="text-muted">Cart is empty.</div>';
      return;
    }
    let html = `<table class="table table-bordered"><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th><th>Remove</th></tr></thead><tbody>`;
    cart.forEach((item, idx) => {
      const subtotal = (item.price * item.quantity).toFixed(2);
      html += `<tr>
        <td>${idx + 1}</td>
        <td>${item.name}</td>
        <td><input type="number" class="form-control form-control-sm" name="items[${idx}][quantity]" value="${item.quantity}" min="1" required></td>
        <td><input type="number" class="form-control form-control-sm" name="items[${idx}][price]" value="${item.price}" step="0.01" required></td>
        <td>${subtotal}</td>
        <td><button type="button" class="btn btn-danger btn-sm remove-item" data-idx="${idx}">Remove</button></td>
      </tr>`;
    });
    html += "</tbody></table>";
    cartItemsDiv.innerHTML = html;
  }

  // Use price, quantity, and discount fields for add-to-cart
  const productSelect = document.getElementById("product-select");
  const addQtyInput = document.getElementById("add-qty");
  const addPriceInput = document.getElementById("add-price");
  // Auto-fill price field when product is selected
  productSelect.addEventListener("change", function () {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const price =
      selectedOption && selectedOption.value
        ? selectedOption.getAttribute("data-price")
        : "";
    addPriceInput.value = price;
  });

  // Also update price if page loads with a product selected
  if (productSelect.value) {
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    addPriceInput.value = selectedOption.getAttribute("data-price") || "";
  }

  // Add item from product select
  document.getElementById("add-item").addEventListener("click", function () {
    const select = productSelect;
    const selectedOption = select.options[select.selectedIndex];
    const productId = selectedOption.value;
    if (!productId) {
      alert("Select a product");
      return;
    }
    const name = selectedOption.getAttribute("data-name");
    const price = parseFloat(addPriceInput.value);
    const stock = parseInt(selectedOption.getAttribute("data-stock"), 10);
    const quantity = parseInt(addQtyInput.value, 10);
    // No discount field
    if (isNaN(quantity) || quantity < 1) {
      alert("Invalid quantity");
      return;
    }
    if (quantity > stock) {
      alert("Not enough stock");
      return;
    }
    cart.push({ product_id: productId, name, price, quantity });
    renderCart();
    // Reset add-to-cart fields
    addQtyInput.value = "";
    addPriceInput.value = "";
  });

  // Remove item (event delegation)
  document.getElementById("cart-items").addEventListener("click", function (e) {
    if (e.target && e.target.classList.contains("remove-item")) {
      const idx = parseInt(e.target.getAttribute("data-idx"), 10);
      cart.splice(idx, 1);
      renderCart();
    }
  });

  // On form submit, update cart values from inputs and submit via AJAX
  document
    .getElementById("billing-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      // Update cart from table inputs
      const cartItemsDiv = document.getElementById("cart-items");
      const rows = cartItemsDiv.querySelectorAll("tbody tr");
      rows.forEach((row, i) => {
        const qtyInput = row.querySelector('input[name$="[quantity]"]');
        const priceInput = row.querySelector('input[name$="[price]"]');
        cart[i].quantity = parseInt(qtyInput.value, 10);
        cart[i].price = parseFloat(priceInput.value);
      });
      // Prepare form data
      const formData = new FormData(this);
      formData.set("cart", JSON.stringify(cart));
      // Send AJAX request
      fetch("/sales/create", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success && data.saleId) {
            // Redirect to invoice page for printing
            window.location.href = "/sales/invoice/" + data.saleId;
          } else {
            alert(data.message || "Sale failed.");
          }
        })
        .catch(() => {
          alert("Sale failed.");
        });
    });
});
