
        const API_URL = 'http://localhost:3000';

        function formatRupees(n) {
            const x = Number(n);
            if (Number.isNaN(x)) return '₹0.00';
            return '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // MOCK SESSION STATE FOR DEMO
        let products = [];
        let categories = [];
        let cart = [];
        let orderHistory = [];
        const hiddenOrders = new Set();
        let vendorId = 1; // Default to Maker Hub
        let vendorsList = [];
        const userId = 1;   // Aarav Shah (customer) — matches seed User

        document.addEventListener('DOMContentLoaded', () => {
            initApp();
            
            // Layout View Switcher
            document.querySelectorAll('.role-switcher button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.role-switcher button').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    switchView(e.target.dataset.role);
                });
            });

            // Collapsible DBMS Schema details
            document.getElementById('schema-toggle-btn').addEventListener('click', function() {
                const content = document.getElementById('schema-content');
                if (content.style.display === 'block') {
                    content.style.display = 'none';
                    this.querySelector('span').innerText = '+';
                } else {
                    content.style.display = 'block';
                    this.querySelector('span').innerText = '-';
                }
            });
        });

        async function initApp() {
            await loadCategories();
            await loadProducts();
            switchView('customer');
        }

        function switchView(role) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(`view-${role}`).classList.add('active');

            const vendorSwitch = document.getElementById('vendor-switch');
            if (role === 'vendor') {
                vendorSwitch.style.display = 'block';
                loadVendorSwitcher();
            } else {
                vendorSwitch.style.display = 'none';
            }

            if(role === 'customer') {
                renderCustomerProducts();
                renderCart();
                fetchOrderHistory(); // populate the lifecycle view
            } else if(role === 'vendor') {
                loadVendorDashboard();
            } else if(role === 'admin') {
                loadAdminDashboard();
            }
        }

        /* --- API Helper --- */
        async function req(path, options = {}) {
            try {
                const res = await fetch(`${API_URL}${path}`, {
                    headers: { 'Content-Type': 'application/json' },
                    ...options
                });
                return await res.json();
            } catch (err) {
                console.error("API Error", err);
                return null;
            }
        }

        /* --- DATA LOADERS --- */
        async function loadProducts() {
            const res = await req('/products');
            if(res) products = res;
        }
        
        async function loadCategories() {
            const res = await req('/categories');
            if(res) {
                categories = res;
                // Add filter buttons dynamically
                const filterContainer = document.getElementById('category-filters');
                if(filterContainer) {
                    filterContainer.innerHTML = `<button class="filter-btn active" onclick="filterProducts('All', this)">All</button>`;
                    categories.forEach(c => {
                        filterContainer.innerHTML += `<button class="filter-btn" onclick="filterProducts('${c.name}', this)">${c.name}</button>`;
                    });
                }
                
                // Add options to add product form
                const catSelect = document.getElementById('add-p-cat');
                if(catSelect) {
                    catSelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
                }
            }
        }


        /* ============================
           CUSTOMER EXPERIENCE LOGIC 
           ============================ */
        let currentCategory = 'All';

        function renderCustomerProducts(searchWord = '') {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = '';
            
            // Frontend generic JS State manipulation filtering out inactive natively
            let pFiltered = products.filter(p => p.active);
            
            if (currentCategory !== 'All') {
                pFiltered = pFiltered.filter(p => p.category_name === currentCategory);
            }
            if (searchWord) {
                pFiltered = pFiltered.filter(p => p.name.toLowerCase().includes(searchWord.toLowerCase()));
            }

            pFiltered.forEach(p => {
                const div = document.createElement('div');
                div.className = 'product-card';
                div.innerHTML = `
                    <div class="stock-badge ${p.stock < 5 ? 'low' : ''}">${p.stock > 0 ? p.stock + ' in stock' : 'Out of Stock'}</div>
                    <div class="product-emoji">${p.emoji || '📦'}</div>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-vendor">sold by ${p.vendor_name}</div>
                    <div class="product-price">${formatRupees(p.price)}</div>
                    <button class="btn" style="width:100%" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
                `;
                grid.appendChild(div);
            });
        }

        function filterProducts(cat, btn) {
            currentCategory = cat;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            if(btn) btn.classList.add('active');
            renderCustomerProducts(document.getElementById('search-input').value);
        }

        document.getElementById('search-input')?.addEventListener('input', (e) => {
            renderCustomerProducts(e.target.value);
        });

        function addToCart(pid) {
            const p = products.find(x => x.id === pid);
            if(p.stock <= 0) return alert('Out of stock');
            
            const existing = cart.find(x => x.product_id === pid);
            if(existing) {
                if(existing.quantity < p.stock) existing.quantity++;
                else alert('Maximum stock reached for this product.');
            } else {
                cart.push({
                    product_id: p.id,
                    name: p.name,
                    price: p.price,
                    quantity: 1,
                    vendor_id: p.vendor_id
                });
            }
            renderCart();
        }

        function renderCart() {
            const crt = document.getElementById('cart-items');
            crt.innerHTML = '';
            
            if (cart.length === 0) {
                crt.innerHTML = '<div style="color: #999; margin-top:10px;">Cart is empty.</div>';
                document.getElementById('cart-total-amt').innerText = formatRupees(0);
                return;
            }

            let total = 0;
            cart.forEach((c, idx) => {
                total += c.price * c.quantity;
                crt.innerHTML += `
                    <div class="cart-item">
                        <div>
                            <div><strong>${c.name}</strong></div>
                            <div style="font-size:0.8rem; color:#777;">${formatRupees(c.price)} × ${c.quantity}</div>
                        </div>
                        <button onclick="cart.splice(${idx}, 1); renderCart()" style="border:none;background:none;color:var(--danger);font-weight:bold;cursor:pointer;">X</button>
                    </div>
                `;
            });
            document.getElementById('cart-total-amt').innerText = formatRupees(total);
        }

        async function placeOrder() {
            if(cart.length === 0) return alert("Your cart is empty!");
            
            const res = await req('/orders', {
                method: 'POST',
                body: JSON.stringify({ user_id: userId, cart_items: cart })
            });

            if(res && res.success) {
                alert("Success! Order securely placed into the database.");
                cart = [];
                renderCart();
                await loadProducts(); // Refresh stock variables!
                renderCustomerProducts(document.getElementById('search-input').value);
                fetchOrderHistory(); // Refresh Lifecycle UI!
            } else {
                alert("Transaction Failed: " + (res?.error || 'Unknown network error'));
            }
        }

        async function clearHistory() {
            if(confirm("Are you sure you want to clear your entire order history?")) {
                const res = await req('/orders');
                if (res) {
                    const myOrders = res.filter(o => Number(o.user_id) === userId);
                    myOrders.forEach(o => hiddenOrders.add(o.order_id));
                }
                const historyList = document.getElementById('order-history-list');
                if (historyList) {
                    historyList.innerHTML = '<p>No recent orders found.</p>';
                }
            }
        }

        async function fetchOrderHistory() {
            // Get orders and demonstrate progress bar UI dynamically
            const res = await req('/orders');
            if(res) {
                const historyList = document.getElementById('order-history-list');
                historyList.innerHTML = '';
                
                // Group by basic order
                const myOrders = res.filter(o => Number(o.user_id) === userId && !hiddenOrders.has(o.order_id));

                if (myOrders.length === 0) {
                    historyList.innerHTML = '<p>No recent orders found.</p>';
                    return;
                }

                const shows = myOrders.slice(0, 4); 
                
                shows.forEach(o => {
                    const s = o.item_status;
                    historyList.innerHTML += `
                        <div style="margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                            <div style="font-weight:bold; color:var(--accent)">${o.product_name}</div>
                            <div style="font-size:0.8rem; margin-bottom:5px;">Qty: ${o.quantity} | Total: ${formatRupees((o.quantity * (o.price_at_time ?? o.price)) || 0)}</div>
                            <div class="status-bar">
                                <span class="${s=='Placed'||s=='Confirmed'||s=='Shipped'||s=='Delivered'?'active':''}">Placed</span> →
                                <span class="${s=='Confirmed'||s=='Shipped'||s=='Delivered'?'active':''}">Confirmed</span> →
                                <span class="${s=='Shipped'||s=='Delivered'?'active':''}">Shipped</span> →
                                <span class="${s=='Delivered'?'active':''}">Delivered!</span>
                            </div>
                        </div>
                    `;
                });
            }
        }


        /* ============================
           VENDOR DASHBOARD LOGIC 
           ============================ */
        let vendorChartInstance = null;
        
        async function loadVendorSwitcher() {
            const vRes = await req('/vendors');
            if(vRes) {
                vendorsList = vRes;
                const selectElement = document.getElementById('vendor-switch');
                selectElement.innerHTML = '';
                
                vRes.forEach(v => {
                    const opt = document.createElement('option');
                    opt.value = v.vendor_id;
                    opt.textContent = v.company_name;
                    if (Number(v.vendor_id) === Number(vendorId)) opt.selected = true;
                    selectElement.appendChild(opt);
                });
            }
        }

        async function changeVendor(vid) {
            vendorId = Number(vid);
            loadVendorDashboard();
        }
        
        async function loadVendorDashboard() {
            // Reload core resources
            await loadProducts();
            
            const vRes = await req(`/vendor/${vendorId}/dashboard`);
            const res = vRes || {}; // graceful fallback

            if(!res.approved) {
                document.getElementById('vendor-content').style.display = 'none';
                document.getElementById('vendor-pending').style.display = 'block';
                return;
            }
            
            // Reset visibility
            document.getElementById('vendor-content').style.display = 'block';
            document.getElementById('vendor-pending').style.display = 'none';

            // Top-line financials
            document.getElementById('v-rev').innerText = formatRupees(res.revenue);
            document.getElementById('v-orders').innerText = res.orders;
            document.getElementById('v-comm').innerText = formatRupees(res.commission);
            document.getElementById('v-net').innerText = formatRupees(res.netPayout);

            // Populate Vendor Catalog
            const tbody = document.getElementById('vendor-products-tbody');
            tbody.innerHTML = '';
            
            const vProds = products.filter(p => p.vendor_id === vendorId);
            vProds.forEach(p => {
                const tr = document.createElement('tr');
                if(p.stock < 5) tr.className = 'row-low-stock'; 
                
                tr.innerHTML = `
                    <td>${p.emoji || ''} ${p.name}</td>
                    <td>${p.category_name}</td>
                    <td>${formatRupees(p.price)}</td>
                    <td style="font-weight:bold">${p.stock}</td>
                    <td><span style="color:${p.active?'var(--success)':'#999'}">${p.active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn" style="padding:4px 8px; font-size:12px; background:var(--accent);" onclick="toggleProductActive(${p.id}, ${!p.active})">Toggle</button>
                        <button class="btn" style="padding:4px 8px; font-size:12px; background:var(--danger);" onclick="deleteProduct(${p.id})">Del</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Populate Received Orders
            const ordRes = await req('/orders');
            if(ordRes) {
                const vOrds = ordRes.filter(o => o.vendor_id === vendorId);
                const otbody = document.getElementById('vendor-orders-tbody');
                otbody.innerHTML = '';
                vOrds.forEach(o => {
                    otbody.innerHTML += `
                        <tr>
                            <td>#${o.order_id}-${o.item_id}</td>
                            <td>${o.product_name}</td>
                            <td>${o.quantity}</td>
                            <td>
                                <select onchange="updateOrderStatus(${o.item_id}, this.value)" style="padding:5px;">
                                    <option value="Placed" ${o.item_status=='Placed'?'selected':''}>Placed</option>
                                    <option value="Confirmed" ${o.item_status=='Confirmed'?'selected':''}>Confirmed</option>
                                    <option value="Shipped" ${o.item_status=='Shipped'?'selected':''}>Shipped</option>
                                    <option value="Delivered" ${o.item_status=='Delivered'?'selected':''}>Delivered</option>
                                </select>
                            </td>
                        </tr>
                    `;
                });
            }

            // Chart Render!
            const ctx = document.getElementById('vendorSalesChart');
            if(vendorChartInstance) vendorChartInstance.destroy();
            
            if(ctx && res.chartData && res.chartData.length > 0) {
                let labels = res.chartData.map(d => new Date(d.date).toLocaleDateString());
                let data = res.chartData.map(d => parseFloat(d.daily_total));

                vendorChartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Daily Fulfillment Value (₹)',
                            data: data,
                            backgroundColor: '#cba37c',
                            borderRadius: 4
                        }]
                    },
                    options: { 
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }
        }

        async function toggleProductActive(id, state) {
            await req(`/products/${id}`, { method:'PUT', body: JSON.stringify({active: state}) });
            loadVendorDashboard();
        }
        
        async function deleteProduct(id) {
            if(confirm("Confirm database deletion?")) {
                await req(`/products/${id}`, { method:'DELETE' });
                loadVendorDashboard();
            }
        }
        
        async function updateOrderStatus(itemId, status) {
            await req(`/orders/${itemId}/status`, { method:'PUT', body: JSON.stringify({type: 'item', status}) });
            alert(`Live status escalated to -> ${status}`);
        }

        async function handleAddProduct(e) {
            e.preventDefault();
            const data = {
                vendor_id: vendorId,
                category_id: document.getElementById('add-p-cat').value,
                name: document.getElementById('add-p-name').value,
                price: document.getElementById('add-p-price').value,
                stock: document.getElementById('add-p-stock').value,
                emoji: document.getElementById('add-p-emoji').value,
            };
            await req('/products', { method: 'POST', body: JSON.stringify(data)});
            alert("Record successfully persisted.");
            document.getElementById('add-product-form').reset();
            loadVendorDashboard();
        }


        /* ============================
           ADMIN CONTROL PANEL LOGIC 
           ============================ */
        async function loadAdminDashboard() {
            // Table 1: Vendors DB
            const vRes = await req('/vendors');
            if(vRes) {
                const tbody = document.getElementById('admin-vendors-tbody');
                tbody.innerHTML = '';
                vRes.forEach(v => {
                    tbody.innerHTML += `
                        <tr>
                            <td style="font-weight:bold;">${v.company_name}</td>
                            <td>
                                <span style="background:${v.status=='Approved'?'var(--success)':'#f39c12'}; color:white; padding:4px 8px; border-radius:12px; font-size:12px;">
                                    ${v.status}
                                </span>
                            </td>
                            <td>${v.commission_rate}%</td>
                            <td>
                                ${v.status === 'Pending' ? `
                                <button class="btn" style="padding:4px 8px; font-size:12px;" onclick="approveVendor(${v.vendor_id}, 'Approved')">Approve ✔️</button> 
                                ` : '<span style="color:#aaa; font-style:italic">Active Account</span>'}
                            </td>
                        </tr>
                    `;
                });
            }

            // Table 2 & KPI Data: Live Transaction DB
            const tRes = await req('/admin/transactions');
            if(tRes && Array.isArray(tRes)) {
                const tbody = document.getElementById('admin-trans-tbody');
                tbody.innerHTML = '';
                
                let totalPlat = 0, totalPO = 0;

                if (tRes.length === 0) {
                    document.getElementById('a-gross').innerText = formatRupees(0);
                    document.getElementById('a-comm').innerText = formatRupees(0);
                    document.getElementById('a-payout').innerText = formatRupees(0);
                }
                
                tRes.forEach(t => {
                    totalPlat += Number(t.commission);
                    totalPO += Number(t.payout);
                    
                    tbody.innerHTML += `
                        <tr>
                            <td>[TXN-${t.commission_id}]</td>
                            <td>${t.vendor}</td>
                            <td style="font-weight:bold;">${formatRupees(t.amount)}</td>
                            <td style="color:var(--success)">${formatRupees(t.commission)}</td>
                            <td>${formatRupees(t.payout)}</td>
                        </tr>
                    `;
                });
                
                document.getElementById('a-gross').innerText = formatRupees(totalPlat + totalPO);
                document.getElementById('a-comm').innerText = formatRupees(totalPlat);
                document.getElementById('a-payout').innerText = formatRupees(totalPO);
            }
        }

        async function approveVendor(id, status) {
            await req(`/vendors/${id}/approve`, { method:'PUT', body: JSON.stringify({status}) });
            alert("Vendor Approval Matrix Updated in MySQL Database.");
            loadAdminDashboard();
        async function handleVendorApply(e) {
            e.preventDefault();
            const payload = {
                user_id: userId,
                store_name: document.getElementById('apply-v-name').value,
                vendor_type: document.getElementById('apply-v-type').value
            };
            const res = await req('/vendors', { method: 'POST', body: JSON.stringify(payload) });
            if (res && res.success) {
                alert("Vendor Application successfully submitted! Pending Admin approval.");
                document.getElementById('vendor-apply-form').reset();
                switchView('customer');
            } else {
                alert("Failed to submit application: " + (res?.error || "Unknown"));
            }
        }

    
