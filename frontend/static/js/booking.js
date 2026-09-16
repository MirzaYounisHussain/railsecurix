/**
 * RailSim Express - Interactive Booking Workflow Script
 * Handles train selection, passenger addition, dynamic fare updates, and simulated payment.
 */

document.addEventListener('DOMContentLoaded', () => {
    initStationSwap();
    initClassSelector();
    initPassengerManagement();
    initSimulatedPayment();
});

/**
 * 1. Station Swap Button Helper
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
        });
    }
}

/**
 * 2. Class Selection Block Interactions on Search Results
 */
function initClassSelector() {
    const classBlocks = document.querySelectorAll('.class-block');
    const selectedClassInput = document.getElementById('selectedClassInput');
    const selectedTrainInput = document.getElementById('selectedTrainInput');

    classBlocks.forEach(block => {
        block.addEventListener('click', () => {
            // Unselect sibling blocks in the same card
            const parentCard = block.closest('.train-card');
            if (parentCard) {
                parentCard.querySelectorAll('.class-block').forEach(b => b.classList.remove('selected'));
            }
            block.classList.add('selected');

            const trainId = block.getAttribute('data-train-id');
            const classCode = block.getAttribute('data-class-code');
            const fare = block.getAttribute('data-fare');

            if (selectedClassInput) selectedClassInput.value = classCode;
            if (selectedTrainInput) selectedTrainInput.value = trainId;

            const bookBtn = parentCard.querySelector('.book-train-btn');
            if (bookBtn) {
                bookBtn.disabled = false;
                bookBtn.textContent = `Book ${classCode} - ₹${fare}`;
            }
        });
    });
}

/**
 * 3. Dynamic Passenger Form (Add/Remove Passengers & Fare Update)
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
            totalFareElem.textContent = `₹${total.toFixed(2)}`;
        }
    }

    if (addPassengerBtn) {
        addPassengerBtn.addEventListener('click', () => {
            const currentRows = passengerList.querySelectorAll('.passenger-row').length;
            if (currentRows >= 6) {
                alert('Maximum 6 passengers allowed per booking.');
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
                        <input type="text" name="passenger_name[]" class="form-control" placeholder="Name as on Gov ID" required>
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

    // Attach listener to any initial remove buttons
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
 * 4. Simulated Payment Processing
 */
function initSimulatedPayment() {
    const paymentForm = document.getElementById('simulatedPaymentForm');
    const payBtn = document.getElementById('payNowBtn');
    const paymentStatusBox = document.getElementById('paymentStatusBox');

    if (paymentForm && payBtn) {
        paymentForm.addEventListener('submit', (e) => {
            payBtn.disabled = true;
            payBtn.innerHTML = `
                <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 6px;"></span>
                Authorizing Simulated Payment...
            `;
            if (paymentStatusBox) {
                paymentStatusBox.style.display = 'block';
            }
            // Form submits naturally to confirmation endpoint after short visual feedback
        });
    }
}
