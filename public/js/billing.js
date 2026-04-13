// Billing Cart Logic — jQuery
// This file must load AFTER jQuery (in footer.ejs)

let cart = [];

$(document).ready(function() {
    
    // --- Product Search ---
    $('#search-product').on('input', function() {
        const query = $(this).val().toLowerCase();
        $('.product-card-container').each(function() {
            const name = $(this).data('name');
            const category = $(this).data('category');
            if (name.indexOf(query) !== -1 || category.indexOf(query) !== -1) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    });

    // --- Bill-level discount ---
    $('#bill-discount').on('input', recalcTotals);
    $('#bill-discount-type').on('change', recalcTotals);
    
    // --- Checkout ---
    $('#checkout-btn').on('click', function() {
        if (cart.length === 0) return;
        
        const subtotal = calculateSubtotal();
        const billDiscountVal = parseFloat($('#bill-discount').val()) || 0;
        const billDiscountType = $('#bill-discount-type').val();
        let billDiscount = billDiscountType === 'percent' ? (subtotal * billDiscountVal / 100) : billDiscountVal;
        if (billDiscount < 0) billDiscount = 0;
        const total = Math.max(subtotal - billDiscount, 0);

        $(this).prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> Processing...');

        // Build items for server
        const items = cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
            discount: item.itemDiscount,
            total: item.total
        }));

        $.ajax({
            url: '/billing/checkout',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                items: items,
                subtotal: subtotal,
                discount: billDiscount,
                discount_type: billDiscountType,
                total: total
            }),
            success: function(response) {
                if (response.success) {
                    window.open('/invoices/print/' + response.saleId, '_blank');
                    cart = [];
                    renderCart();
                    $('#bill-discount').val(0);
                } else {
                    alert('Error: ' + response.message);
                }
                $('#checkout-btn').prop('disabled', false).text('Checkout & Print');
            },
            error: function(xhr) {
                alert('Request failed: ' + (xhr.responseJSON ? xhr.responseJSON.message : xhr.statusText));
                $('#checkout-btn').prop('disabled', false).text('Checkout & Print');
            }
        });
    });
});

// --- Add to cart (called from onclick) ---
window.addToCart = function(id, name, price, maxStock) {
    if (maxStock <= 0) {
        alert('Item is out of stock!');
        return;
    }
    const existing = cart.find(function(item) { return item.product_id === id; });
    if (existing) {
        if (existing.quantity >= maxStock) {
            alert('Cannot exceed available stock (' + maxStock + ')');
            return;
        }
        existing.quantity += 1;
        existing.total = (existing.quantity * existing.price) - existing.itemDiscount;
    } else {
        cart.push({
            product_id: id,
            name: name,
            price: price,
            quantity: 1,
            maxStock: maxStock,
            itemDiscount: 0,
            total: price
        });
    }
    renderCart();
};

// --- Update quantity ---
window.updateQty = function(index, newQty) {
    var qty = parseInt(newQty, 10);
    var item = cart[index];
    if (isNaN(qty) || qty < 1) {
        $('#qty-' + index).val(item.quantity);
        return;
    }
    if (qty > item.maxStock) {
        alert('Stock limit: ' + item.maxStock);
        qty = item.maxStock;
        $('#qty-' + index).val(qty);
    }
    item.quantity = qty;
    item.total = (item.quantity * item.price) - item.itemDiscount;
    if (item.total < 0) item.total = 0;
    renderCart();
};

// --- Update item discount ---
window.updateItemDiscount = function(index, val) {
    var disc = parseFloat(val) || 0;
    if (disc < 0) disc = 0;
    var item = cart[index];
    item.itemDiscount = disc;
    item.total = (item.quantity * item.price) - disc;
    if (item.total < 0) item.total = 0;
    renderCart();
};

// --- Remove item ---
window.removeItem = function(index) {
    cart.splice(index, 1);
    renderCart();
};

// --- Subtotal ---
function calculateSubtotal() {
    var sum = 0;
    for (var i = 0; i < cart.length; i++) {
        sum += cart[i].total;
    }
    return sum;
}

// --- Recalculate totals (displayed) ---
function recalcTotals() {
    var subtotal = calculateSubtotal();
    $('#cart-subtotal').text('$' + subtotal.toFixed(2));

    var billDiscountVal = parseFloat($('#bill-discount').val()) || 0;
    var billDiscountType = $('#bill-discount-type').val();
    var billDiscount = billDiscountType === 'percent' ? (subtotal * billDiscountVal / 100) : billDiscountVal;
    if (billDiscount < 0) billDiscount = 0;

    var total = subtotal - billDiscount;
    if (total < 0) total = 0;

    $('#cart-total').text('$' + total.toFixed(2));
    $('#checkout-btn').prop('disabled', cart.length === 0);
}

// --- Render cart table ---
function renderCart() {
    var tbody = $('#cart-body');
    tbody.empty();

    if (cart.length === 0) {
        tbody.append('<tr><td colspan="5" class="text-center text-muted py-5"><i class="bi bi-cart-x fs-1 d-block mb-2 opacity-50"></i>Cart is empty</td></tr>');
        $('#cart-subtotal').text('$0.00');
        $('#cart-total').text('$0.00');
        $('#checkout-btn').prop('disabled', true);
        return;
    }

    for (var i = 0; i < cart.length; i++) {
        var item = cart[i];
        var tr = '<tr>' +
            '<td>' +
                '<div class="fw-bold">' + item.name + '</div>' +
                '<small class="text-muted">$' + item.price.toFixed(2) + ' each</small>' +
            '</td>' +
            '<td>' +
                '<input type="number" id="qty-' + i + '" class="form-control form-control-sm text-center" ' +
                    'value="' + item.quantity + '" min="1" max="' + item.maxStock + '" ' +
                    'onchange="updateQty(' + i + ', this.value)" style="width: 70px;">' +
            '</td>' +
            '<td>' +
                '<input type="number" class="form-control form-control-sm text-center" ' +
                    'value="' + item.itemDiscount.toFixed(2) + '" min="0" step="0.01" ' +
                    'onchange="updateItemDiscount(' + i + ', this.value)" style="width: 80px;">' +
            '</td>' +
            '<td class="text-end fw-bold text-success">$' + item.total.toFixed(2) + '</td>' +
            '<td class="text-end">' +
                '<button class="btn btn-sm btn-outline-danger border-0" onclick="removeItem(' + i + ')"><i class="bi bi-x-lg"></i></button>' +
            '</td>' +
        '</tr>';
        tbody.append(tr);
    }

    recalcTotals();
}
