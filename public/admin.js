async function load() {
            try {
                const token = localStorage.getItem('token');
                const apiBaseUrl = window.MADOLOGY_API_BASE_URL || localStorage.getItem('apiBaseUrl') || 'http://localhost:3000';

                if (!token) {
                    throw new Error('You must log in as an admin first.');
                }

                const res = await fetch(`${apiBaseUrl}/admin/orders`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const payload = await res.json();

                if (!res.ok) {
                    throw new Error(payload.message || 'Failed to load orders');
                }

                const { orders } = payload;
                const container = document.getElementById('content');

                if (!orders || orders.length === 0) {
                    container.innerText = 'No orders yet.';
                    return;
                }

                container.innerHTML = '';
                orders.forEach((o) => {
                    const div = document.createElement('div');
                    div.className = 'order';

                    const customer = o.customer || {};
                    const user = o.user || {};
                    const userName = customer.fullName || user.name || 'Unknown';
                    const userEmail = customer.email || user.email || '';
                    const customerPhone = customer.phone || user.phone || 'Missing';
                    const customerAddress = customer.address || user.address || 'Missing';
                    const customerLatitude = Number(customer.latitude ?? user.latitude);
                    const customerLongitude = Number(customer.longitude ?? user.longitude);
                    const hasMapLocation = Number.isFinite(customerLatitude) && Number.isFinite(customerLongitude);
                    const mapsUrl = hasMapLocation ? `https://www.google.com/maps?q=${customerLatitude},${customerLongitude}` : '';
                    const mapsButton = hasMapLocation
                        ? ` <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="maps-link">Open in Google Maps</a>`
                        : '';
                    const addressDisplay = customerAddress && customerAddress !== 'Missing'
                        ? `${customerAddress}${mapsButton}`
                        : 'Missing';
                    const created = new Date(o.createdAt).toLocaleString();

                    let itemsHtml = '<table><thead><tr><th>Image</th><th>Product</th><th>Size</th><th>Color</th><th>Qty</th><th>Price</th><th>Item Total</th></tr></thead><tbody>';
                    let total = 0;

                    (o.items || []).forEach((it) => {
                        const itemTotal = (it.itemTotal !== undefined ? it.itemTotal : (it.price || 0) * (it.quantity || 1));
                        total += itemTotal;
                        const imgHtml = it.img ? `<img src="${it.img}" alt="${it.name || ''}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">` : '-';
                        itemsHtml += `<tr><td>${imgHtml}</td><td>${it.name || '-'}</td><td>${it.size || '-'}</td><td>${it.color || '-'}</td><td>${it.quantity}</td><td>${it.price || 0} L.E</td><td>${itemTotal} L.E</td></tr>`;
                    });

                    const orderTotal = typeof o.totalAmount === 'number' ? o.totalAmount : total;
                    itemsHtml += `</tbody><tfoot><tr><th colspan="6">Total</th><th>${orderTotal} L.E</th></tr></tfoot></table>`;

                    div.innerHTML = `
            <h3>Order ${o._id}</h3>
            <div class="meta">Customer: ${userName} ${userEmail ? '(' + userEmail + ')' : ''} - Phone: ${customerPhone} - Address: ${addressDisplay} - Created: ${created} - Status: ${o.status || 'pending'}</div>
            ${itemsHtml}
          `;

                    container.appendChild(div);
                });
            } catch (err) {
                document.getElementById('content').innerText = 'Error loading orders: ' + err.message;
            }
        }

        load();
