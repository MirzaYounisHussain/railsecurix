# Open Source License Attribution

## Upstream Project Attribution

Certain frontend UI components, layouts, and PDF generation utilities in RailSim Express have been adapted and integrated from the open-source project:

- **Source Repository:** [https://github.com/SuryaThejas-07/Railway-Reservation-System](https://github.com/SuryaThejas-07/Railway-Reservation-System)
- **Original Author:** Surya Thejas (Copyright © 2024 Surya Thejas)
- **License:** MIT License

---

## Original License Text

```text
MIT License

Copyright (c) 2024 Surya Thejas

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Component Integration & Modification Record

| Component | Source Origin | Modifications in RailSim Express |
| :--- | :--- | :--- |
| **`SeatSelector.tsx`** | `src/components/SeatSelector.tsx` | Integrated with Flask backend seat locking (`/api/seats/lock`) to prevent race conditions; added dynamic fare calculation from SQLite. |
| **`ticketPDF.ts`** | `src/utils/ticketPDF.ts` | Rebranded with RailSim Express headers, security verification notice, authentic train schedule metadata, and simulated QR payload. |
| **`PNRStatus.tsx`** | `src/pages/PNRStatus.tsx` | Connected to Flask SQLite REST endpoint (`/api/bookings/pnr/<pnr>`) instead of Firestore; enhanced with real-time route progress indicator. |
| **`TrainCard.tsx`** | `src/components/TrainCard.tsx` | Replaced Firestore listeners with Flask search API (`/api/trains/search`); styled with Indian railway class badges. |
| **UI Primitives** | `src/components/ui/*` | Standard shadcn/ui React components (buttons, dialogs, badges, cards, inputs). |

---

## Original Contributions in RailSim Express

The following subsystems are original to the RailSim Express cybersecurity prototype:
1. **Python Flask 3.0 REST API Backend:** Server-side authoritative booking verification, idempotent booking validator, and session authentication.
2. **Local SQLite WAL Relational Database:** Strict 3NF schema, ACID compliance, and transactional 5-minute seat locking.
3. **Multi-Signal Behavioral Telemetry Engine:** Client-side biometric listeners recording keystroke dynamics, cursor kinematics, and form dwell patterns.
4. **Scikit-Learn Machine Learning Bot Detector:** Random Forest classifier with session-based splitting (preventing data leakage) and multi-signal ablation evaluation.
5. **0–100 Explainable Risk Scoring Engine:** Feature importance attribution and calibrated threat assessment.
6. **Graduated Adaptive Cybersecurity Gateway:** Tiered response (`ALLOW` $\to$ `VERIFY` $\to$ `RATE-LIMIT / RESTRICT`) protecting human travelers from permanent lockouts.
