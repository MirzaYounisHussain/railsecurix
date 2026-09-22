/**
 * RailSim Express - Railway Booking Interactions & Workflow Script
 * Handles station swapping, quick date chips, dynamic class selection,
 * passenger roster management, and simulated payment.
 * Preserves all DOM events for behavioral telemetry collection.
 */

document.addEventListener('DOMContentLoaded', () => {
    initStationSwap();
    initQuickDateChips();
    initClassSelector();
    initPassengerManagement();
    initSimulatedPayment();
});

/**
 * 1. Station Swap Button Helper (From <-> To)
 */
function initStationSwap() {
    const swapBtn = document.getElementById('swapStationsBtn');
    const sourceSelect = document.getElementById('sourceStation');
    const destSelect = document.getElementById('destStation');

    if (swapBtn && sourceSelect && destSelect) {
        swapBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const tempVal = sourceSelect.value;
            sourceSelect.value = destSelect.value;
            destSelect.value = tempVal;

            // Trigger change event for telemetry tracking
            sourceSelect.dispatchEvent(new Event('change', { bubbles: true }));
            destSelect.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }
}

/**
 * 2. Quick Date Selector Chips (Today, Tomorrow, +2 Days)
 */
function initQuickDateChips() {
    const dateChips = document.querySelectorAll('.date-chip');
    const travelDateInput = document.getElementById('travelDate');

    if (!dateChips.length || !travelDateInput) return;

    dateChips.forEach(chip => {
        chip.addEventListener('click', () => {
            dateChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const offset = parseInt(chip.getAttribute('data-days-offset') || '0', 10);
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + offset);

            const yyyy = targetDate.getFullYear();
            const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
            const dd = String(targetDate.getDate()).padStart(2, '0');

            travelDateInput.value = `${yyyy}-${mm}-${dd}`;
            travelDateInput.dispatchEvent(new Event('input', { bubbles: true }));
            travelDateInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
    });
}

/**
 * 3. Class Availability Matrix Interaction on Train Results
 */
function initClassSelector() {
    const availTiles = document.querySelectorAll('.avail-tile');
    const selectedClassInput = document.getElementById('selectedClassInput');
    const selectedTrainInput = document.getElementById('selectedTrainInput');

    availTiles.forEach(tile => {
        tile.addEventListener('click', () => {
            const parentCard = tile.closest('.train-card');
            if (!parentCard) return;

            // Deselect other tiles in same train card
            parentCard.querySelectorAll('.avail-tile').forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');

            const trainId = tile.getAttribute('data-train-id');
            const classCode = tile.getAttribute('data-class-code');
            const fare = tile.getAttribute('data-fare');

            if (selectedClassInput) selectedClassInput.value = classCode;
            if (selectedTrainInput) selectedTrainInput.value = trainId;

            const bookBtn = parentCard.querySelector('.book-train-btn');
            if (bookBtn) {
                bookBtn.disabled = false;
                bookBtn.classList.remove('btn-secondary');
                bookBtn.classList.add('btn-railway');
                bookBtn.textContent = `Book ${classCode} (₹${fare})`;
            }
        });
    });
}

/**
 * 4. Dynamic Passenger Management (Add/Remove & Live Fare Update)
 */
function initPassengerManagement() {
    const addPassengerBtn = document.getElementById('addPassengerBtn');
    const passengerList = document.getElementById('passengerList');
    const baseFareElem = document.getElementById('baseFareAmount');
    const totalFareElem = document.getElementById('totalFareAmount');

    if (!passengerList) return;

    function updateFareSummary() {
        const rowCount = passengerList.querySelectorAll('.passenger-row').length;
        if (baseFareElem && totalFareElem) {
            const baseFarePerPassenger = parseFloat(baseFareElem.getAttribute('data-per-passenger') || '650');
            const reservationCharge = 40;
            const total = (baseFarePerPassenger + reservationCharge) * rowCount;
            totalFareElem.textContent = `₹${total.toFixed(0)}`;
        }
    }

    if (addPassengerBtn) {
        addPassengerBtn.addEventListener('click', () => {
            const currentRows = passengerList.querySelectorAll('.passenger-row').length;
            if (currentRows >= 6) {
                alert('Maximum 6 passengers allowed per booking in simulated quota.');
                return;
            }

            const newIndex = currentRows + 1;
            const row = document.createElement('div');
            row.className = 'passenger-row card';
            row.style.padding = '1rem';
            row.style.marginBottom = '1rem';
            row.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <strong>Passenger #${newIndex}</strong>
                    <button type="button" class="btn btn-secondary remove-passenger-btn" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #ef4444;">Remove</button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Full Name *</label>
                        <input type="text" name="passenger_name[]" class="form-control" placeholder="Name as on Gov ID" required autocomplete="off">
                    </div>
                    <div class="form-group">
                        <label>Age *</label>
                        <input type="number" name="passenger_age[]" class="form-control" min="1" max="120" placeholder="Age" required>
                    </div>
                    <div class="form-group">
                        <label>Gender *</label>
                        <select name="passenger_gender[]" class="form-control" required>
                            <option value="">Select</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                            <option value="T">Transgender</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Berth Preference</label>
                        <select name="passenger_berth[]" class="form-control">
                            <option value="NO_PREF">No Preference</option>
                            <option value="LOWER">Lower Berth</option>
                            <option value="MIDDLE">Middle Berth</option>
                            <option value="UPPER">Upper Berth</option>
                            <option value="SIDE_LOWER">Side Lower</option>
                            <option value="SIDE_UPPER">Side Upper</option>
                        </select>
                    </div>
                </div>
            `;
            passengerList.appendChild(row);
            updateFareSummary();

            // Bind remove button
            row.querySelector('.remove-passenger-btn').addEventListener('click', () => {
                row.remove();
                updateFareSummary();
            });
        });
    }

    // Attach listeners to any pre-existing remove buttons
    document.querySelectorAll('.remove-passenger-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const rows = passengerList.querySelectorAll('.passenger-row');
            if (rows.length > 1) {
                e.target.closest('.passenger-row').remove();
                updateFareSummary();
            } else {
                alert('At least one passenger is required.');
            }
        });
    });

    updateFareSummary();
}

/**
 * 5. Simulated Payment Submission
 */
function initSimulatedPayment() {
    const paymentForm = document.getElementById('simulatedPaymentForm');
    const payBtn = document.getElementById('payNowBtn');
    const paymentStatusBox = document.getElementById('paymentStatusBox');

    if (paymentForm && payBtn) {
        paymentForm.addEventListener('submit', () => {
            payBtn.disabled = true;
            payBtn.innerHTML = `Authorizing Simulated Payment...`;
            if (paymentStatusBox) {
                paymentStatusBox.style.display = 'block';
            }
        });
    }
}
