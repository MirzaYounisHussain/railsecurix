# ARCHITECTURE AUDIT & FLAW ANALYSIS
**Project:** AI-Based Behavioral Bot Detection and Adaptive Cybersecurity for Secure Online Ticket Booking  
**Domain:** High-Demand Online Ticket Reservation (Simulated Railway / Tatkal Prototype)  
**Date:** September 2026  
**Document Version:** 1.0.0  

---

## 1. Executive Summary & Audit Scope

This document presents a rigorous architectural, machine learning, security, and privacy audit for the research prototype. The system aims to distinguish legitimate human booking interactions from automated scripted booking tools (bots) using multi-signal behavioral telemetry, session-level aggregation, machine learning classification, explainable risk scoring, and graduated adaptive security responses.

Before any code implementation, every architectural dimension was analyzed to surface latent failure modes, data leakage risks, adversarial manipulation vulnerabilities, and false-positive risks for human travelers.

---

## 2. Flaw Analysis (Problem → Why → Fix)

### Flaw 1: Client-Side Telemetry Tampering & Event Forgery
* **Problem:** Telemetry events (keystrokes, mouse coordinates, scroll offsets) originate in client-side JavaScript. A sophisticated bot operator could forge synthetic JSON payloads directly to the telemetry endpoint, claiming human-like timings.
* **Why:** The browser environment is inherently untrusted. If the backend accepts raw JSON telemetry without temporal validation, cryptographic session binding, or sequence consistency checks, attackers can bypass client instrumentation entirely.
* **Fix:** 
  1. Bind telemetry batches to server-issued cryptographically signed session tokens (`HMAC-SHA256`).
  2. Implement monotonic sequence counters and client-server clock drift validation.
  3. Validate physical plausibility on the backend (e.g., maximum human mouse velocity, minimum physical latency between disparate form fields).
  4. Design the ML model on *multi-signal correlation* (e.g., keystroke events matching focus/blur events and page dwell times simultaneously), making multi-channel synthetic forgery exponentially harder.

---

### Flaw 2: ML Data Leakage via Session Fragmentation
* **Problem:** Splitting datasets randomly at the event or intermediate window level between training and test sets leaks session-specific dynamics, leading to artificially inflated test metrics (e.g., 99.9% accuracy) that collapse in real deployment.
* **Why:** Events from the same user session share identical hardware properties, network latency jitter, browser resolution, and baseline behavioral cadence. Standard random splits allow the model to memorize session traits rather than generalize to new human/bot profiles.
* **Fix:** 
  1. Strictly partition data at the **Session and User Level** (GroupKFold / Leave-One-Group-Out).
  2. Guarantee that all records for `session_id_X` reside exclusively in either Train, Validation, or Test.
  3. Explicitly reserve at least one unseen bot automation profile (e.g., `BOT_PROFILE_VARIABLE_DELAY` or `BOT_PROFILE_ALTERNATE_NAVIGATION`) entirely for the held-out test split to test true generalization.

---

### Flaw 3: Detection Shortcut & Feature Leakage (`is_selenium`, User-Agent, Window Flags)
* **Problem:** If features capture browser automation markers (such as `navigator.webdriver`, headless user-agents, or missing plugins) rather than behavioral characteristics, the model becomes a brittle Selenium detector rather than a behavioral classifier.
* **Why:** B.Tech / Academic research must solve the behavioral problem: distinguishing *human behavior* from *scripted behavior*. Modern bots easily disguise `navigator.webdriver` with stealth plugins; a detector relying on environment flags fails when confronted with stealth automation.
* **Fix:**
  1. Ban all environment/automation flags (e.g., `navigator.webdriver`, `window.cdc_adoQpoasnfa76pfcZLmcfl_Array`, user-agent string tokens) from the ML feature vector.
  2. The feature schema must consist *strictly* of aggregated physical and behavioral signals: inter-key timings, mouse trajectory entropy, curvature, acceleration variance, scroll hesitation, form dwell times, and submission latency.
  3. Document this constraint in the data dictionary and enforce it with automated schema validation unit tests.

---

### Flaw 4: High False Positive Risk for Diverse Human Users (Accessibility & Edge Cases)
* **Problem:** Legitimate users who use password managers, autofill, screen readers, assistive accessibility devices, or single-key navigation could exhibit high typing speeds or low mouse movement, causing the model to misclassify them as bots.
* **Why:** Assuming "human" conforms strictly to a single normative pattern (smooth continuous mouse trajectories and moderate keystroke cadence) discriminates against users with motor impairments or those using assistive productivity tools.
* **Fix:**
  1. Include autofill and assistive navigation behaviors in the human training dataset.
  2. Add multi-signal fallback logic: if mouse distance is low but page dwell time and form field focus order indicate human comprehension, the risk score is dampened.
  3. Enforce the **Graduated Adaptive Security Response** rule: Never block outright on a single anomaly. Trigger a lightweight verification challenge (e.g., cognitive puzzle or interactive re-auth) instead of blocking.
  4. Optimize the decision threshold specifically against the False Positive Rate (target FPR < 2% on human validation sessions).

---

### Flaw 5: Privacy Violations via Keystroke Logging and Sensitive Data Ingestion
* **Problem:** Traditional behavioral biometric loggers often capture actual character values (`key='a'`, `key='P@ssw0rd'`) or form field inputs, introducing severe GDPR/DPDP privacy violations and credential leakage risks.
* **Why:** Capturing raw key values or passenger personal identification in telemetry tables creates an unacceptable security liability and violates the research prototype specification.
* **Fix:**
  1. The client-side telemetry script (`telemetry.js`) records **only** time deltas: `down_time`, `up_time`, `interval_ms`, and non-identifying event types (`keydown`, `keyup`).
  2. Keystroke capture is completely disabled or sanitized on sensitive inputs (`<input type="password">`, simulated card fields).
  3. Raw key codes are mapped to an abstract category (e.g., `alpha`, `digit`, `navigation`, `backspace`) or omitted entirely in favor of purely temporal inter-key deltas ($\Delta t$).
  4. All session logs store anonymized UUIDs with no unhashed PII.

---

### Flaw 6: Binary Blocking Denial-of-Service and Security Deadlocks
* **Problem:** Traditional security filters apply a binary decision: Allow vs. IP Ban. A single false positive locks out a genuine passenger during a high-demand Tatkal booking window, causing irreversible user frustration.
* **Why:** ML classification has non-zero uncertainty. A binary hard-stop treats probabilistic inference as absolute ground truth.
* **Fix:**
  1. Implement a three-tiered **Risk Engine**:
     - **Low Risk (Score 0–39):** Frictionless instant booking path.
     - **Medium Risk (Score 40–69):** Adaptive verification checkpoint (cognitive challenge or session re-confirmation) before seat allocation.
     - **High Risk (Score 70–100):** Graduated containment: dynamic rate-limiting (token bucket delay), queuing delay, and temporary session throttle.
  2. Implement progressive escalation: a session must repeatedly fail verification or demonstrate sustained high-frequency automation before being locked out for the active booking window.
  3. No permanent bans based on behavioral inference alone.

---

### Flaw 7: Bot Profile Overfitting & Static Timing Exploits
* **Problem:** If the training bots only use fixed delays (e.g., `time.sleep(0.5)`), the ML model simply learns to detect exact 500 ms intervals. An adversary adding `random.uniform(0.1, 0.9)` would easily defeat the system.
* **Why:** Lack of diversity in the bot generator suite creates brittle decision boundaries.
* **Fix:**
  1. Build a multi-profile Bot Simulator with at least 5 distinct automation personas:
     - `BOT_PROFILE_FAST`: Zero-delay, instant DOM filling.
     - `BOT_PROFILE_FIXED_DELAY`: Rigid, constant delays between actions.
     - `BOT_PROFILE_VARIABLE_DELAY`: Randomized uniform/normal delay distributions.
     - `BOT_PROFILE_FAST_FORM`: Human-like browsing navigation but script-speed passenger form submission.
     - `BOT_PROFILE_ALTERNATE_NAVIGATION`: Direct URL jumps and unexpected booking stage skips.
  2. Evaluate using cross-profile generalization tests (train on profiles 1–3, test on 4–5).

---

### Flaw 8: Latency Overhead at Booking Checkout
* **Problem:** Real-time feature extraction and complex ML inference at the critical payment/confirmation step could introduce latency, frustrating users and degrading high-concurrency throughput.
* **Why:** Aggregating thousands of raw events synchronously on each HTTP request causes database contention and CPU bottlenecks.
* **Fix:**
  1. Implement asynchronous event batching: the browser sends telemetry in compressed batches (e.g., every 3–5 seconds or at page transition).
  2. Extract features incrementally into a cached session state vector.
  3. Keep the inference model lightweight (Scikit-learn `RandomForestClassifier` with optimized `n_estimators=100`, max_depth constraints), ensuring sub-15ms inference latency.
  4. Benchmark and log `inference_latency_ms` on every risk assessment.

---

### Flaw 9: Academic Novelty Dilution vs. Practical Contribution
* **Problem:** Claiming that "behavioral biometrics" or "bot detection" is brand-new will be rejected by academic reviewers, as keystroke dynamics and mouse dynamics have existed for decades.
* **Why:** Broad, unsubstantiated claims weaken research credibility.
* **Fix:**
  1. Explicitly position the novelty as:
     > *"An integrated, domain-specific behavioral bot detection and adaptive defense framework that combines multi-signal telemetry (keystroke, cursor trajectory, scroll hesitation, and form dwell times), session-level ML classification, explainable feature attribution, and graduated security responses specifically evaluated across diverse automation profiles in high-demand online ticket booking."*
  2. Ground the experimental rigor in an **ablation study** (Experiment 9: keyboard only vs. mouse only vs. session only vs. combined) to empirically prove the value of multi-signal fusion.

---

### Flaw 10: Scope Creep vs. Reproducible Prototype Delivery
* **Problem:** Attempting to build an end-to-end distributed enterprise system with microservices, Redis clusters, Kafka streams, and deep neural networks risks project failure within the B.Tech timeline.
* **Why:** Over-engineering distracts from the core research questions: multi-signal efficacy, false-positive control, and adaptive defense.
* **Fix:**
  1. Follow the **Simplicity First** rule: Clean, modular Python Flask backend, normalized SQLite database (PostgreSQL-ready), streamlined HTML/CSS/JS frontend, Scikit-learn ML pipeline, and Streamlit analytics dashboard.
  2. Modularize components cleanly so each phase can be developed, tested with Pytest, and verified independently.

---

## 3. Architectural Decisions Summary Table

| Decision Area | Proposed Architecture | Replaced Alternative | Rationale |
| :--- | :--- | :--- | :--- |
| **Backend Framework** | Flask (Modular Blueprints) | FastAPI / Django | Lightweight, zero unnecessary overhead, transparent request lifecycle. |
| **Database** | SQLite with WAL mode & SQL schema | MongoDB / Complex ORM | Self-contained, zero external daemon requirement for local research, seamless reproducibility. |
| **Telemetry Transport** | Beacon API / JSON POST with Session Signature | WebSocket / Raw Socket | Resilient across page unloads, low battery/CPU overhead, standard HTTP semantics. |
| **Primary ML Classifier**| Random Forest (Scikit-learn) | Deep LSTM / Transformer | High tabular accuracy, fast inference (<10ms), native feature importances for explainability. |
| **Baseline Comparisons**| Logistic Regression & XGBoost | Black-box Ensembles | Scientifically grounded baselines to quantify non-linear gain. |
| **Explainability** | Tree Feature Importances + Rule-based Signal Attribution | SHAP only | Fast real-time user-facing explanations; SHAP reserved for offline deep-dive. |
| **Security Mitigation** | Graduated: Allow $\rightarrow$ Verify $\rightarrow$ Rate-Limit | Instant IP Ban | Protects legitimate passengers from false-positive lockouts. |
| **Evaluation Framework**| Group-KFold by Session + Unseen Profile Holdout | Random Train/Test Split | Prevents catastrophic data leakage; evaluates real generalization. |

---

## 4. Audit Sign-off & Next Steps

This audit establishes the guardrails and architectural principles for the prototype. The next immediate step is to document the formal system architecture and experimental specification in `plan.md`, accompanied by the executable phase runner `implementation_plan.sh` and the permanent project guidelines skill `SKILL.md`.
