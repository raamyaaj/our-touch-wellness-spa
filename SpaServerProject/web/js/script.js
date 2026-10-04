// ==========================================================================
// 1. TOGGLE NAVIGATION FORM BETWEEN LOGIN AND REGISTER
// ==========================================================================
function toggleForm(formType) {
    const loginForm = document.getElementById('login-section');
    const registerForm = document.getElementById('register-section');
    
    if (formType === 'register') {
        if(loginForm) loginForm.style.display = 'none';
        if(registerForm) registerForm.style.display = 'block';
    } else {
        if(loginForm) loginForm.style.display = 'block';
        if(registerForm) registerForm.style.display = 'none';
    }
}

// ==========================================================================
// 2. CUSTOM SYSTEM POPUP MODAL ENGINE
// ==========================================================================
function showSystemAlert(message, title = "System Notification", icon = "✨") {
    document.getElementById('sys-modal-icon').innerText = icon;
    document.getElementById('sys-modal-title').innerText = title;
    document.getElementById('sys-modal-text').innerText = message;
    document.getElementById('system-modal').style.display = 'flex';

    return new Promise((resolve) => {
        document.getElementById('sys-modal-ok-btn').onclick = function() {
            document.getElementById('system-modal').style.display = 'none';
            resolve(true);
        };
    });
}

// ==========================================================================
// 3. SECURE AUTHENTICATION HANDLER: LOG IN FORM SUBMIT
// ==========================================================================
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    
    let response = await fetch('/submit-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`
    });
    
    let result = await response.json();
    
    if (result.status === "success") {
        // Tandaan ang pangalan ng kliyente para magamit sa booking form mamaya
        localStorage.setItem('activeSpaUser', user);
        
        if (result.role === "ADMIN") {
            await showSystemAlert(`Welcome Admin! Admin Access Granted. Opening Secured Panel.`, "Access Success", "🔑");
            window.location.href = '/admin-dashboard.html';
        } else {
            await showSystemAlert(`Welcome ${user}! System login validation success.`, "Login Verified", "👋");
            window.location.href = '/user-dashboard.html';
        }
    } else {
        await showSystemAlert(result.message, "Authentication Failed", "❌");
    }
});

// ==========================================================================
// 4. SECURE AUTHENTICATION HANDLER: SIGN UP REGISTRATION FORM SUBMIT
// ==========================================================================
document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = document.getElementById('reg-username').value.trim();
    const contact = document.getElementById('reg-contact').value.trim();
    const pass = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;

    if (contact.length !== 11) {
        await showSystemAlert("Ang Contact Number ay dapat eksaktong 11 digits.", "Validation Error", "📱");
        return;
    }
    if (pass !== confirmPass) {
        await showSystemAlert("Hindi nagtutugma ang Password at Confirm Password.", "Password Mismatch", "🔒");
        return;
    }

    let response = await fetch('/submit-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(user)}&contact=${encodeURIComponent(contact)}&password=${encodeURIComponent(pass)}&confirmPassword=${encodeURIComponent(confirmPass)}`
    });

    let result = await response.json();
    if (result.status === "success") {
        await showSystemAlert("Account Created Successfully! Mangyaring mag-log in.", "Success", "✨");
        toggleForm('login');
        document.getElementById('registerForm').reset();
    } else {
        await showSystemAlert(result.message, "Registration Error", "⚠️");
    }
});




// CUSTOM ENGINE: Papalit sa default browser confirm() na gumagamit ng Custom HTML Modal design mo
function showSystemConfirm(message, title = "Confirmation Required", icon = "❓") {
    document.getElementById('sys-modal-icon').innerText = icon;
    document.getElementById('sys-modal-title').innerText = title;
    document.getElementById('sys-modal-text').innerText = message;
    
    document.getElementById('system-modal').style.display = 'flex';

    return new Promise((resolve) => {
        document.getElementById('sys-modal-ok-btn').onclick = function() {
            document.getElementById('system-modal').style.display = 'none';
            resolve(true); // Yes/Confirm
        };
        document.getElementById('sys-modal-cancel-btn').onclick = function() {
            document.getElementById('system-modal').style.display = 'none';
            resolve(false); // Cancel/No
        };
    });
}
// ==========================================================================
// 5. LIVE DATABASE CONTROL ENGINE: MANAGING ADMIN SUB-TABS VIA MYSQL
// ==========================================================================

// 1. PINDUTAN: USER APPROVED / LIST (MAY ARCHIVE AT RESTORE CONTROLS STATE)
async function loadAdminUsers() {
    let response = await fetch('/admin/get-users');
    let users = await response.json();
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = "";
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray;">Walang rehistradong customer account.</td></tr>`;
        return;
    }
    
    users.forEach(u => {
        let statusStyle = u.status === "Archived" ? "background:#ffebee; color:#c62828;" : "background:#e8f5e9; color:#2e7d32;";
        let actionBtn = u.status === "Archived" 
            ? `<button class="btn-gen" style="padding:6px 12px; font-size:12px;" onclick="toggleUserStatus('${u.username}', '${u.status}')">🔄 Restore</button>`
            : `<button class="btn-delete" style="padding:6px 12px; font-size:12px;" onclick="toggleUserStatus('${u.username}', '${u.status}')">📦 Archive</button>`;

        tbody.innerHTML += `
            <tr>
                <td><b>${u.username}</b></td>
                <td>${u.contact}</td>
                <td><span style="${statusStyle} padding:4px 10px; border-radius:12px; font-weight:bold; font-size:12px;">${u.status}</span></td>
                <td><div class="action-btns">${actionBtn}</div></td>
            </tr>`;
    });
}

// LOHIKA NG ARCHIVE / RESTORE TOGGLE BUTTON (MAY MAGANDANG MODAL CONFIRMATION)
async function toggleUserStatus(username, currentStatus) {
    let actionText = currentStatus === "Archived" ? "i-Restore patungong Approved status" : "ilagay sa Archive container";
    let iconEmoji = currentStatus === "Archived" ? "🔄" : "📦";
    
    // Custom Confirmation Box Popup Engine Trigger
    const proceed = await showSystemConfirm(`Sigurado ka bang nais mong ${actionText} ang account ni "${username}" sa database?`, "System Control Update", iconEmoji);
    
    if (proceed) {
        await fetch('/admin/toggle-user-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(username)}&currentStatus=${encodeURIComponent(currentStatus)}`
        });
        await showSystemAlert("Matagumpay na na-update ang account state status sa database!", "Database Updated", "✔️");
        loadAdminUsers(); // I-refresh ang talahanayan ng Users list
    }
}



// 2. PINDUTAN: SCHEDULES MONITORING (DAHIL MA-E-EDIT NA ANG LIVE STATUS DROPDOWN)
// 1. UPDATE SA SCHEDULES INTERFACE: I-load ang mga records at punan ang Form Dropdown ng Admin
async function loadAdminSchedules() {
    try {
        // A. KUNIN ANG TOTOONG ACTIVE SERVICES PARA MAPUNAN ANG DROPDOWN NG MODAL FORM
        let resServices = await fetch('/api/get-services');
        let activeServices = await resServices.json();
        const adminDropdown = document.getElementById('serv-type');
        
        if (adminDropdown) {
            let dropdownHTML = "";
            activeServices.forEach(s => {
                dropdownHTML += `<option value="${s.name}">${s.name} (₱${s.price})</option>`;
            });
            adminDropdown.innerHTML = dropdownHTML;
        }

        // B. KUNIN ANG MGA SCHEDULES PARA SA TABLE LAYOUT
        let response = await fetch('/admin/get-schedules');
        let schedules = await response.json();
        const tbody = document.getElementById('table-body');
        if (!tbody) return;
        
        tbody.innerHTML = "";
        if (schedules.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">Walang nakatala na active spa appointments.</td></tr>`;
            return;
        }
        
        schedules.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td><b>#${s.id}</b></td>
                    <td>${s.name}</td>
                    <td>${s.date}</td>
                    <td>${s.service}</td>
                    <td>${s.promo}</td>
                    <td>
                        <select class="form-group" style="padding:4px; margin:0; border-radius:6px; font-weight:bold;" onchange="updateBookingStatus(${s.id}, this.value)">
                            <option value="Active" ${s.status === 'Active' ? 'selected' : ''}>📅 Active</option>
                            <option value="Completed" ${s.status === 'Completed' ? 'selected' : ''}>✔️ Completed</option>
                            <option value="Cancelled" ${s.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
                        </select>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error("Error sa pagload ng admin schedules:", err);
    }
}

// 2. EVENT LISTENER PARA SA APPOINTMENT FORM SUBMISSION NG ADMIN (MAY CUSTOM MODAL CONFIRMATION)
document.getElementById('adminBookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('cust-name').value.trim();
    const dateInput = document.getElementById('serv-date').value;
    const serviceType = document.getElementById('serv-type').value;
    const promoType = document.getElementById('promo-type').value;

    if (!dateInput) {
        await showSystemAlert("Mangyaring pumili ng Petsa para sa appointment.", "Missing Input", "📅");
        return;
    }

    // Custom Confirmation Box Popup Engine bago mag-save sa MySQL
    const proceed = await showSystemConfirm(`Sigurado ka bang nais mong irehistro ang bagong appointment na ito para kay "${customerName}"?`, "Confirm New Appointment", "📅");
    
    if (proceed) {
        let response = await fetch('/admin/create-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `customerName=${encodeURIComponent(customerName)}&appointmentDate=${encodeURIComponent(dateInput)}&serviceType=${encodeURIComponent(serviceType)}&promoType=${encodeURIComponent(promoType)}`
        });

        let result = await response.json();

        if (result.status === "success") {
            if(typeof closeForm === 'function') closeForm(); // Isara ang modal window popup
            await showSystemAlert("Ang bagong appointment ay matagumpay na naisave sa database!", "Database Success", "✔️");
            loadAdminSchedules(); // I-refresh ang table listahan ng schedules
        } else {
            await showSystemAlert("Paumanhin, nabigong i-save: " + result.message, "Database Error", "❌");
        }
    }
});



// LOHIKA NG LIVE CHANGING DROPDOWN NG APPOINTMENT STATUS (MAY CUSTOM MODAL CONFIRMATION)
async function updateBookingStatus(id, newStatus) {
    const proceed = await showSystemConfirm(`Sigurado ka bang nais mong baguhin ang status ng entry booking #${id} patungong "${newStatus}"?`, "Update Schedule Status", "📝");
    
    if (proceed) {
        await fetch('/admin/update-booking-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `id=${id}&status=${encodeURIComponent(newStatus)}`
        });
        await showSystemAlert("Matagumpay na nabago ang schedule status sa database!", "Schedule Updated", "✔️");
        loadAdminSchedules(); // I-refresh uli ang schedules table
    } else {
        loadAdminSchedules(); // I-reload para mabalik sa dating value ang dropdown kung kinansela ng admin
    }
}

// ==========================================================================
// 6. LIVE SERVICES CATALOG LOADER FOR CLIENT GRID AND ADMIN DROP-DOWNS
// ==========================================================================

// ==========================================================================
// 6. LIVE SERVICES & PROMOS CATALOG LOADER FOR CLIENT GRID AND DROP-DOWNS
// ==========================================================================
async function setupPortfolios() {
    try {
        // A. KUNIN ANG TOTOONG SERVICES MULA SA MYSQL
        let response = await fetch('/api/get-services');
        let activeServices = await response.json();
        
        const userServGrid = document.getElementById('user-services-list');
        const custDropdown = document.getElementById('cust-serv-type');
        const adminDropdown = document.getElementById('serv-type');

        // 1. UPDATE SA CUSTOMER SERVICES TAB GRID LAYOUT
        if (userServGrid) {
            userServGrid.innerHTML = "";
            if (activeServices.length === 0) {
                userServGrid.innerHTML = `<p style='color:gray; text-align:center; grid-column: 1/-1;'>Paumanhin, kasalukuyang walang bukas na serbisyo.</p>`;
            } else {
                activeServices.forEach(s => {
                    userServGrid.innerHTML += `
                        <div class="card">
                            <h3>${s.name}</h3>
                            <p>${s.desc || 'Premium spa relaxation treatment package.'}</p>
                            <p class="price" style="font-size:22px; font-weight:700; color:var(--spa-gold); margin-top:10px;">₱${s.price.toLocaleString()}</p>
                            <button class="form-btn" style="margin-top:15px;" onclick="selectServiceFromCard('${s.name}')">Select & Book Now</button>
                        </div>`;
                });
            }
        }

        // 2. UPDATE SA SERVICES DROPDOWNS (Para sa Customer at Admin Form)
        let dropdownHTML = "";
        activeServices.forEach(s => {
            dropdownHTML += `<option value="${s.name}">${s.name} (₱${s.price})</option>`;
        });
        if (custDropdown) custDropdown.innerHTML = dropdownHTML;
        if (adminDropdown) adminDropdown.innerHTML = dropdownHTML;

        // ==================================================================
        // 🚀 INILAGAY DITO: FETCH AT PAG-RENDER NG MGA AKTIBONG PROMO VOUCHERS
        // ==================================================================
        let promoResponse = await fetch('/api/get-promos');
        let activePromos = await promoResponse.json();
        
        // I-target ang container ng "Special Packages & Vouchers" sa iyong HTML
        const userPromoGrid = document.getElementById('user-promos-list') || document.querySelector('.promo-grid-container'); 
        const custPromoDropdown = document.getElementById('cust-promo-type');

        // 1. I-render ang Promo Cards sa Gallery View
		if (userPromoGrid) {
		    userPromoGrid.innerHTML = "";
		    if (activePromos.length === 0 || activePromos.status === "error") {
		        userPromoGrid.innerHTML = `<p style='color:gray; text-align:center; grid-column: 1/-1;'>Kasalukuyang walang aktibong promo o voucher deal.</p>`;
		    } else {
		        activePromos.forEach(p => {
		            userPromoGrid.innerHTML += `
		                <div class="card promo-card">
		                    <h3 style="color:var(--spa-pink);">🎟️ ${p.name}</h3> <!-- 🟢 TAMA: p.name mula sa Java -->
		                    <p>${p.desc || 'Special limited time relaxation discount deal.'}</p>
		                    <button class="form-btn" style="margin-top:15px; background-color:var(--spa-gold);" onclick="selectPromoFromCard('${p.name}')">Apply Promo & Book</button>
		                </div>`;
		        });
		    }
		}

		// 2. I-populate ang Promo Dropdown sa Customer Booking Form (Gagamit ng p.name)
		if (custPromoDropdown) {
		    let promoDropdownHTML = `<option value="Regular Rate">Regular Rate</option>`;
		    if (Array.isArray(activePromos)) {
		        activePromos.forEach(p => {
		            promoDropdownHTML += `<option value="${p.name}">${p.name}</option>`; // 🟢 TAMA: p.name mula sa Java
		        });
		    }
		    custPromoDropdown.innerHTML = promoDropdownHTML;
		}

    } catch (error) {
        console.error("Error sa pag-load ng services at promos portfolio catalog:", error);
    }
}


// Function kapag pinindot ni customer ang button sa loob ng Spa card sa gallery (Landas 2 -> Landas 1 router)
function selectServiceFromCard(serviceName) {
    const dropdown = document.getElementById('cust-serv-type');
    if (dropdown) {
        dropdown.value = serviceName; // Awtomatikong pipiliin ang pangalan ng serbisyo
    }
    
    // I-reset ang promo sa Regular Rate dahil service card ang pinindot
    const promoInput = document.getElementById('cust-promo-type');
    if (promoInput) {
        promoInput.value = "Regular Rate";
    }
    
    // 🟢 GREEN LIGHT ACTION: Gagamitin ang tamang target ID para sa dynamic lower panel at auto-scroll focus
    if (typeof showUserTab === 'function') {
        showUserTab('user-booking-section'); 
    }
}

// 🔑 UNIVERSAL VARIABLE: Ito ang hahawak ng ID ng ine-edit na service para hindi mawala!
let currentEditingServiceId = ""; 

// 1. DYNAMIC RENDERING NG TABLE NA MAY KASAMANG LIVE EDIT BUTTONS (FOR ADMIN SERVICES)
async function loadAdminServices() {
    try {
        let response = await fetch('/api/get-services');
        let services = await response.json();
        const tbody = document.getElementById('services-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = "";
        if (services.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray;">Walang listed spa services sa database.</td></tr>`;
            return;
        }
        
        services.forEach(s => {
            let safeDesc = (s.desc || "").replace(/'/g, "\\'");
            
            tbody.innerHTML += `
                <tr>
                    <td><b>${s.name}</b></td>
                    <td class="gold-text">₱${s.price.toLocaleString()}</td>
                    <td><span style="background:#e8f5e9; color:#2e7d32; padding:4px 10px; border-radius:12px; font-weight:bold; font-size:12px;">Active</span></td>
                    <td>
                        <div class="action-btns" style="display:flex; gap:8px;">
                            <!-- TAMA: Diretsong ipinapasa ang s.id sa parameter -->
                            <button class="btn-edit" onclick="openEditServiceModal(${s.id}, '${s.name}', ${s.price}, '${safeDesc}')">✏️ Edit</button>
                            <button class="btn-delete" style="background-color:#c62828;" onclick="alert('Feature coming soon...')">📦 Archive</button>
                        </div>
                    </td>
                </tr>`;
        });
    } catch (err) {
        console.error("Failed fetching spa menu layout lines:", err);
    }
}


// 2. AUTOMATIC NA MAPUNAN ANG INPUT FIELDS KAPAG PININDOT ANG EDIT BUTTON
function openEditServiceModal(id, name, price, desc) {
    document.getElementById('service-form-title').innerText = "Modify Spa Service";
    
    // TAMA: Itatabi sa ating universal variable ang ID ng service
    currentEditingServiceId = id; 
    
    document.getElementById('service-name-input').value = name;
    document.getElementById('service-price-input').value = price;
    document.getElementById('service-desc-input').value = desc;
    
    document.getElementById('service-form-box').style.display = 'flex';
}

// Siguraduhin ding kapag pinindot ang "Add New Service" button sa HTML ay nae-empty itong variable:
function openServiceModal() { 
    document.getElementById('service-form-title').innerText = "Add New Spa Service";
    currentEditingServiceId = ""; // I-reset sa blangko kapag bagong add!
    document.getElementById('adminServiceForm').reset();
    document.getElementById('service-form-box').style.display = 'flex'; 
}

// 3. ADMIN FORM SUBMISSION (AUTO-CLOSE THEN CONFIRM MODAL)
document.getElementById('adminServiceForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Kunin ang ID mula sa ating universal memory variable
    const id = currentEditingServiceId; 
    const name = document.getElementById('service-name-input').value.trim();
    const price = document.getElementById('service-price-input').value;
    const desc = document.getElementById('service-desc-input').value.trim();

    if (typeof closeServiceForm === 'function') {
        closeServiceForm();
    }

    let dialogMessage = id ? `buhayin at baguhin ang mga impormasyon ng serbisyong "${name}"` : `idagdag ang bagong serbisyong "${name}" sa iyong spa treatment menu portfolio`;

    const proceed = await showSystemConfirm(`Sigurado ka bang nais mong ${dialogMessage}?`, "Confirm Database Operation", "💆");

    if (proceed) {
        let response = await fetch('/admin/add-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `serviceId=${encodeURIComponent(id)}&serviceName=${encodeURIComponent(name)}&servicePrice=${encodeURIComponent(price)}&serviceDesc=${encodeURIComponent(desc)}`
        });

        let result = await response.json();

        if (result.status === "success") {
            let successMsg = id ? `Matagumpay na na-update ang mga pagbabago kay "${name}"!` : `Ang bagong serbisyong "${name}" ay matagumpay na nailista sa database!`;
            await showSystemAlert(successMsg, "Database Success", "✔️");
            
            loadAdminServices(); 
            if (typeof setupPortfolios === 'function') setupPortfolios(); 
        } else {
            await showSystemAlert("Paumanhin, nabigong i-save ang treatment package: " + result.message, "Database Error", "❌");
            document.getElementById('service-form-box').style.display = 'flex';
        }
    } else {
        document.getElementById('service-form-box').style.display = 'flex';
    }
});


// ==========================================================================
// 🚀 100% FIXED ROUTER FOR PROMO CARD SELECTION (Dropdown-Compatible)
// ==========================================================================
function selectPromoFromCard(promoName) {
    // I-target ang select dropdown engine sa iyong booking form
    const promoDropdown = document.getElementById('cust-promo-type');
    
    if (promoDropdown) {
        // 🟢 TAMA: Sapilitang itutugma ang pinindot na promo name sa option list
        promoDropdown.value = promoName;
        
        // Backup validation: Kung hindi mahanap ang promo sa dropdown list, i-set sa Regular Rate
        if (promoDropdown.value !== promoName) {
            console.log("Promo match not found in dropdown list options, using fallback.");
            promoDropdown.value = "Regular Rate";
        }
    }
    
    // 🟢 FIXED: Dadalhin agad ang screen pababa sa booking section gamit ang tamang ID
    if (typeof showUserTab === 'function') {
        showUserTab('user-booking-section'); 
    }
}



// ==========================================================================
// 7. SECURE APPOINTMENT FORMS SUBMISSION & DYNAMIC RECEIPT GENERATOR (PATIBAYIN)
// ==========================================================================
document.getElementById('customerBookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const inputName = document.getElementById('cust-book-name')?.value.trim();
    const loggedInUser = localStorage.getItem('activeSpaUser') || "Client Account";
    const finalCustomerName = inputName ? inputName : loggedInUser;
    
    const onlyDate = document.getElementById('cust-book-date')?.value;
    const onlyTime = document.getElementById('cust-book-time')?.value;
    const service = document.getElementById('cust-serv-type')?.value;
    const promo = document.getElementById('cust-promo-type')?.value || "Regular Rate";

    if (!onlyDate || !onlyTime) {
        await showSystemAlert("Mangyaring pumili ng tamang Petsa at Oras ng iyong appointment.", "Missing Input", "📅");
        return;
    }

    const formattedDate = `${onlyDate} ${onlyTime}:00`;

    try {
        let response = await fetch('/api/create-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(finalCustomerName)}&date=${encodeURIComponent(formattedDate)}&service=${encodeURIComponent(service)}&promo=${encodeURIComponent(promo)}`
        });

        let result = await response.json();

        if (result.status === "success") {
            // Punan ang Receipt Modal gaya ng dati
            document.getElementById('rec-id').innerText = result.id;
            document.getElementById('rec-name').innerText = result.name;
            document.getElementById('rec-date').innerText = result.date;
            document.getElementById('rec-service').innerText = result.service;
            document.getElementById('rec-promo').innerText = result.promo;
            document.getElementById('rec-total').innerText = result.total;

            // Ipakita ang Receipt modal window popup
            document.getElementById('receipt-modal').style.display = 'flex';

            // 🚀 ANG BAGONG KONDISYON: Kung may napiling promo, magpapakita ng Verification Notification
            if (promo !== "Regular Rate") {
                // Gagamitin natin ang custom system popup mo para maganda ang hitsura
                setTimeout(async () => {
                    await showSystemAlert(
                        `Paalala: Ang iyong napiling promo (${promo}) ay susuriin muna ng ating spa staff pagdating mo upang matiyak kung pasok ito sa promo mechanics at time schedule. Salamat!`,
                        "Promo Verification Notice",
                        "🎟️"
                    );
                }, 800); // Lalabas ang paalala 1 segundo pagkabukas ng resibo
            }

        } else {
            alert("Error mula sa server: " + result.message);
        }
    } catch (err) {
        console.error("Fetch booking insertion failed error:", err);
        alert("Hindi makakonekta sa Java Server.");
    }
});




// ITO ANG TOTONG PAPALIT SA BINURA MONG PLACEHOLDER:
async function loadAdminAuditLogs() {
    let response = await fetch('/admin/get-audit-logs');
    let logs = await response.json();
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = "";
    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan='2' style='text-align:center; color:gray;'>[SYSTEM] No logs records trace stream found.</td></tr>`;
        return;
    }
    
    logs.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td style="color: #0f0; font-family: monospace;">[${l.timestamp}]</td>
                <td style="color: #fff; font-family: monospace;">${l.message}</td>
            </tr>`;
    });
}

// ==========================================================================
// 8. ADMIN APPOINTMENT FORM SUBMISSION (AUTO-CLOSE THEN CONFIRM MODAL)
// ==========================================================================
document.getElementById('adminBookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('cust-name').value.trim();
    const dateInput = document.getElementById('serv-date').value;
    const serviceType = document.getElementById('serv-type').value;
    const promoType = document.getElementById('promo-type').value;

    if (!dateInput) {
        await showSystemAlert("Mangyaring pumili ng Petsa para sa appointment.", "Missing Input", "📅");
        return;
    }

    // 🚀 HAKBANG 1: Awtomatikong isara agad ang Form Card Overlay para malinis ang screen!
    if (typeof closeForm === 'function') {
        closeForm(); 
    }

    // 🚀 HAKBANG 2: Pagkasara ng form, saka lalabas ang Custom Confirmation Modal Popup sa gitna
    const proceed = await showSystemConfirm(
        `Sigurado ka bang nais mong irehistro ang bagong appointment na ito para kay "${customerName}"?`, 
        "Confirm New Appointment", 
        "📅"
    );
    
    if (proceed) {
        // Kung pinindot ang Confirm/Yes, ipapadala ang datos sa Java backend
        let response = await fetch('/admin/create-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `customerName=${encodeURIComponent(customerName)}&appointmentDate=${encodeURIComponent(dateInput)}&serviceType=${encodeURIComponent(serviceType)}&promoType=${encodeURIComponent(promoType)}`
        });

        let result = await response.json();

        if (result.status === "success") {
            await showSystemAlert("Ang bagong appointment ay matagumpay na naisave sa database!", "Database Success", "✔️");
            loadAdminSchedules(); // I-refresh ang talahanayan ng schedules
        } else {
            await showSystemAlert("Paumanhin, nabigong i-save: " + result.message, "Database Error", "❌");
            // Kung nagka-error ang database insert, opsyonal na buksan muli ang form para maitama ng admin
            document.getElementById('booking-form-box').style.display = 'flex';
        }
    } else {
        // Kung pinindot ang Cancel/No, ibalik o buksan muli ang Form Overlay kung nais magbago ng isip ni admin
        document.getElementById('booking-form-box').style.display = 'flex';
    }
});


document.addEventListener("DOMContentLoaded", function() {
    // Kung nandoon sa page ang mga elementong ito, i-load ang data
    if (document.getElementById('user-services-list') || document.getElementById('cust-promo-type')) {
        setupPortfolios();
    }
    
    // Para naman sa admin logs at monitoring panels
    if (document.getElementById('audit-table-body')) {
        loadAdminAuditLogs();
    }
    if (document.getElementById('table-body')) {
        loadAdminSchedules();
    }
    if (document.getElementById('users-table-body')) {
        loadAdminUsers();
    }
    if (document.getElementById('services-table-body')) {
        loadAdminServices();
    }
});


// ==========================================================================
// 🚀 THE REELS DYNAMIC MULTI-VIDEO CAROUSEL CONTROLLER ENGINE
// ==========================================================================
const videoList = ["images/vid1.mp4", "images/vid2.mp4", "images/vid3.mp4"];
let currentVideoIndex = 0;
let videoTimerInterval = null; // Memory container para sa automatic tracking handles

function changeVideo(direction) {
    const videoElement = document.getElementById("slider-video");
    if (!videoElement) return;

    // Kwentahin ang susunod na pwesto ng clip index track handles
    currentVideoIndex += direction;
    if (currentVideoIndex >= videoList.length) currentVideoIndex = 0;
    if (currentVideoIndex < 0) currentVideoIndex = videoList.length - 1;

    // 1. Lagyan ng banayad na fade animation out bago magpalit ng links
    videoElement.style.opacity = "0.3";

    setTimeout(() => {
        // Diretsong palitan ang src ng video at ipilit ang refresh stream
        videoElement.src = videoList[currentVideoIndex];
        videoElement.load();
        
        // 2. Patakbuhin muli at ibalik ang opacity sa normal rendering level
        let playPromise = videoElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                videoElement.style.opacity = "1";
            }).catch(error => {
                console.log("Auto-play tracking safe catch:", error);
                videoElement.style.opacity = "1";
            });
        }
    }, 250);

    // 3. RESET TIMER: Kapag pinindot manu-mano ng user ang arrow buttons, 
    // ire-reset natin ang 8-second timer para hindi magkasabay ang kusa at manwal na paglipat!
    resetVideoTimer();
}

// FUNCTION PARA SA AUTOMATION RESTART MANAGEMENT
function resetVideoTimer() {
    if (videoTimerInterval) {
        clearInterval(videoTimerInterval);
    }
    videoTimerInterval = setInterval(() => {
        changeVideo(1);
    }, 8000); // Lilipat nang kusa bawat 8 segundo
}

// SIGURADUHING TATAKBO ANG ENGINE PAGKALOAD NG WINDOW
document.addEventListener("DOMContentLoaded", function() {
    const videoElement = document.getElementById("slider-video");
    if (videoElement) {
        // Simulan ang automatic rotation loop framework
        resetVideoTimer();
    }
});


// ==========================================================================
// 🚀 UPDATED PANEL SWITCHER WITH AUTOMATIC SMOOTH AUTO-SCROLL FOCUS
// ==========================================================================
function showUserTab(targetTabId) {
    // 1. Itago ang lahat ng mga sub-tabs sa ibaba
    const allTabs = document.querySelectorAll('.spa-tab');
    allTabs.forEach(tab => {
        tab.style.display = "none";
    });

    // 2. Sapilitang ilitaw ang pinindot na link sa ibaba ng screen
    const selectedTab = document.getElementById(targetTabId);
    if (selectedTab) {
        if (targetTabId === "user-booking-section") {
            selectedTab.style.display = "flex"; // Centered look para sa booking form box
        } else {
            selectedTab.style.display = "block";
        }
        
        // ==================================================================
        // 🚀 SMART AUTO-SCROLL Engine:
        // Kung Home ang pinindot, isasadsad natin ang window sa pinaka-itaas (0,0).
        // Kung ibang tab naman, hihilahin ang screen para mag-focus sa content.
        // ==================================================================
        setTimeout(() => {
            if (targetTabId === 'user-home-content') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                selectedTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50); // Banayad na delay para makabwelo ang HTML display engine
    }

    // 3. I-update ang neon active lines sa top nav bar navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));

    // Hanapin kung aling link ang dapat maging active ang kulay sa taas
    if (targetTabId === 'user-home-content') document.getElementById('nav-home')?.classList.add('active');
    if (targetTabId === 'user-services-section') document.getElementById('nav-serv')?.classList.add('active');
    if (targetTabId === 'user-promos-section') document.getElementById('nav-promo')?.classList.add('active');
    if (targetTabId === 'user-booking-section') document.getElementById('nav-book')?.classList.add('active');
}


// ==========================================================================
// 🚀 CUSTOM SYSTEM CONFIRMATION ENGINE (May OK at Cancel targets handling)
// ==========================================================================
function showSystemConfirm(message, title = "Confirmation Required", icon = "❓") {
    document.getElementById('sys-modal-icon').innerText = icon;
    document.getElementById('sys-modal-title').innerText = title;
    document.getElementById('sys-modal-text').innerText = message;
    
    // Sapilitang ipakita ang modal overlay box screen at ang Cancel button links
    const cancelBtn = document.getElementById('sys-modal-cancel-btn');
    if (cancelBtn) cancelBtn.style.display = "inline-block"; // Siguraduhing litaw ang cancel button
    
    document.getElementById('system-modal').style.display = 'flex';

    return new Promise((resolve) => {
        document.getElementById('sys-modal-ok-btn').onclick = function() {
            document.getElementById('system-modal').style.display = 'none';
            resolve(true); // Isusumite na "Oo / Confirm"
        };
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                document.getElementById('system-modal').style.display = 'none';
                resolve(false); // Isusumite na "Hindi / Cancel"
            };
        }
    });
}

// ==========================================================================
// 🚀 SECURED USER LOG OUT CHECKER WITH CORRECT LINK REDIRECTION
// ==========================================================================
async function confirmUserLogout(event) {
    event.preventDefault(); // Harangin muna ang default empty anchor scroll jumps

    const proceed = await showSystemConfirm(
        "Sigurado ka bang nais mo nang mag-log out at umalis sa iyong secure dashboard session?",
        "Confirm Log Out",
        "🚪"
    );

    if (proceed) {
        localStorage.removeItem('activeSpaUser'); // Burahin ang active session name ng customer account token
        
        // 🟢 DIRECT REDIRECT URL POINTER:
        // Siguraduhing may / sa unahan para tumakbo sa main server port entry handle (http://localhost:8080/login.html)
        window.location.href = "/login.html"; 
    }
}


// ==========================================================================
// 🚀 FORGOT PASSWORD CUSTOM MODAL NOTIFICATION TRIGGER
// ==========================================================================
async function showForgotPasswordAlert() {
    if (typeof showSystemAlert === 'function') {
        // Gagamitin ang iyong custom system overlay popup modal window box
        await showSystemAlert(
            "Paalala: Upang i-reset o mabawi ang iyong nakalimutang password, mangyaring makipag-ugnayan sa Our TOUCH Wellness SPA admin o staff sa shop para sa database verification verification control handle. Salamat!",
            "Account Recovery Notice",
            "🔒"
        );
    } else {
        // Fallback alert box kung sakaling may loading latency ang scripts mo
        alert("Mangyaring makipag-ugnayan sa spa admin upang i-reset ang iyong password.");
    }
}


// ==========================================================================
// 🚀 TEXT-BASED PASSWORD SHOW / HIDE CONTROLLER LOGIC ENGINE
// ==========================================================================
function togglePasswordVisibility() {
    const passwordInput = document.getElementById("login-password");
    const toggleButton = document.getElementById("toggle-password-btn");
    
    if (!passwordInput || !toggleButton) return;

    if (passwordInput.type === "password") {
        // 🟢 SHOW PASSWORD: Gawing plain text para makita ang sulat at palitan ang label
        passwordInput.type = "text";
        toggleButton.innerText = "HIDE";
        toggleButton.style.color = "#757575"; // Banayad na gray kapag naka-show na
    } else {
        // 🔴 HIDE PASSWORD: Ibalik sa nakatagong bullet characters at ibalik ang label
        passwordInput.type = "password";
        toggleButton.innerText = "SHOW";
        toggleButton.style.color = "var(--spa-magenta)"; // Magenta label glow highlight kapag nakatago
    }
}
// ==========================================================================
// 🚀 SECURE ACCOUNT RETRIEVAL SUBMISSION LOOPS MECHANICS
// ==========================================================================
document.getElementById('recoveryForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = document.getElementById('rec-username-input').value.trim();
    const contact = document.getElementById('rec-contact-input').value.trim();

    if (contact.length !== 11) {
        await showSystemAlert("Ang Contact Number ay dapat eksaktong 11 digits.", "Validation Error", "📱");
        return;
    }

    try {
        let response = await fetch('/api/recover-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `username=${encodeURIComponent(user)}&contact=${encodeURIComponent(contact)}`
        });

        let result = await response.json();

        if (result.status === "success") {
            // Isara ang input recovery modal box window setup
            document.getElementById('recovery-modal').style.display = 'none';
            document.getElementById('recoveryForm').reset();

            // Isambulat sa screen ang nahanap na original password credentials!
            await showSystemAlert(
                `Account Found! Ang nakarehistro mong Password ay: "${result.password}". Mangyaring ingatan ito at huwag ipapakita sa iba.`,
                "Password Retrieved",
                "🔓"
            );
        } else {
            await showSystemAlert(result.message, "Recovery Failed", "❌");
        }
    } catch (err) {
        console.error("Account recovery fetching query failed:", err);
        await showSystemAlert("Hindi makakonekta sa Java Server. Siguraduhing buhay ang backend program mo.", "Server Connection Error", "🔌");
    }
});

// ==========================================================================
// 🚀 REAL-TIME SEARCH FILTER FOR ADMIN CUSTOMER ACCOUNTS TABLE
// ==========================================================================
function filterAdminUsers() {
    const input = document.getElementById('search-users-input');
    const filter = input ? input.value.toLowerCase().trim() : '';
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        // Laktawan ang row kung ito ay ang "Walang rehistradong customer account" indicator notice box
        if (rows[i].cells.length < 3) continue; 
        
        const usernameText = rows[i].cells[0].textContent.toLowerCase();
        const contactText = rows[i].cells[1].textContent.toLowerCase();
        
        // I-verify kung may tumutugma sa itinayp ni admin
        if (usernameText.includes(filter) || contactText.includes(filter)) {
            rows[i].style.display = ""; // Ipakita ang row
        } else {
            rows[i].style.display = "none"; // Itago ang row
        }
    }
}

// ==========================================================================
// 🚀 REAL-TIME SEARCH FILTER FOR ADMIN APPOINTMENTS / SCHEDULES TABLE
// ==========================================================================
function filterAdminSchedules() {
    const input = document.getElementById('search-schedules-input');
    const filter = input ? input.value.toLowerCase().trim() : '';
    const tbody = document.getElementById('table-body'); // I-target ang iyong main table-body ID
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        // Laktawan ang row kung ito ay ang default fallback notice text row
        if (rows[i].cells.length < 5) continue; 
        
        const idText = rows[i].cells[0].textContent.toLowerCase();
        const clientNameText = rows[i].cells[1].textContent.toLowerCase();
        const serviceText = rows[i].cells[3].textContent.toLowerCase();
        const promoText = rows[i].cells[4].textContent.toLowerCase();
        
        // Dynamic string validation matching rules parameter engine lookup links
        if (idText.includes(filter) || clientNameText.includes(filter) || serviceText.includes(filter) || promoText.includes(filter)) {
            rows[i].style.display = ""; // Ipakita ang row
        } else {
            rows[i].style.display = "none"; // Itago ang row
        }
    }
}

// ==========================================================================
// 🚀 REAL-TIME SEARCH FILTER FOR ADMIN SERVICES / CATALOG TABLE
// ==========================================================================
function filterAdminServices() {
    const input = document.getElementById('search-services-input');
    const filter = input ? input.value.toLowerCase().trim() : '';
    const tbody = document.getElementById('services-table-body'); // Tina-target ang iyong services tbody ID
    if (!tbody) return;
    
    const rows = tbody.getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        // Laktawan ang row kung ito ay ang default fallback notice text row
        if (rows[i].cells.length < 3) continue; 
        
        const serviceNameText = rows[i].cells[0].textContent.toLowerCase();
        const priceText = rows[i].cells[1].textContent.toLowerCase();
        
        // Suriin kung tumutugma ang pangalan ng serbisyo o presyo sa itinype ni admin
        if (serviceNameText.includes(filter) || priceText.includes(filter)) {
            rows[i].style.display = ""; // Ipakita ang row sa talahanayan
        } else {
            rows[i].style.display = "none"; // Itago ang row sa talahanayan
        }
    }
}
