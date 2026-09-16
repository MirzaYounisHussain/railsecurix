# MASTER PROJECT IMPLEMENTATION PLAN
**Project:** AI-Based Behavioral Bot Detection and Adaptive Cybersecurity for Secure Online Ticket Booking  
**Document:** Master Plan & Technical Specification (`plan.md`)  
**Target:** B.Tech CSE / Cybersecurity Research Prototype  
**Date:** September 2026  
**Status:** Approved for Execution (Phase 0 Complete)  

---

## 1. Project Purpose & Objective

The objective of this research project is to build an integrated cybersecurity prototype capable of distinguishing genuine human interaction from automated scripting (bots) in a high-demand online ticket booking environment (simulated Tatkal-style railway reservation).

### Primary Research Question
> *"Can multi-signal behavioral telemetry (keystroke dynamics, cursor kinematics, scroll hesitation, and form dwell patterns) distinguish human travelers from scripted automation with high detection sensitivity while maintaining an empirical False Positive Rate (FPR) below 2%?"*

### Core Research Rules
- **Locally Controlled Simulation Only:** No interaction, scraping, bypass, or traffic against the live IRCTC or any production railway portal.
- **Selenium as Data Generator Only:** Selenium is strictly an instrumented generator of automated sessions across diverse behavioral profiles; the detector does NOT look for Selenium browser flags.
- **Multi-Signal Fusion:** Detection relies on cross-correlation across physical interaction dimensions rather than a single heuristic.
- **Zero Fabricated Results:** All experimental tables, metrics, latencies, and confusion matrices must reflect empirical measurements from executed tests.

---

## 2. Core Novelty Statement & Research Positioning

Rather than claiming behavioral biometrics or machine learning are novel in isolation, this project contributes:

> **"An integrated, domain-specific behavioral bot detection and adaptive defense framework that combines multi-signal telemetry (keystroke, cursor trajectory, scroll hesitation, and form dwell times), session-level ML classification, explainable feature attribution, and graduated security responses specifically evaluated across diverse automation profiles in high-demand online ticket booking."**

### Novelty Pillars
1. **Multi-Signal Fusion:** Synchronized feature extraction over 4 distinct interaction channels (typing cadence, 2D cursor kinematics, scroll dynamics, form navigation dwell time).
2. **Session-Level Behavioral Aggregation:** Mapping fine-grained raw events to robust session distributions to avoid event-level noise.
3. **Anti-Leakage Partitioning:** Strict session-level and user-level train/validation/test holdout, including evaluating generalization on unseen automation profiles.
4. **Explainable Risk Scoring:** Instant mapping of model confidence to a 0–100 risk score paired with top contributing behavioral feature explanations.
5. **Graduated Adaptive Defense:** Replacement of destructive binary IP blocking with a 3-tier adaptive posture (*Allow* $\rightarrow$ *Verify* $\rightarrow$ *Rate-Limit / Restrict*).
6. **Ablation-Backed Defense Efficacy:** Empirical validation proving the necessity of multi-signal telemetry over single-modality baselines.

---

## 3. Technology Stack & Dependencies

| Layer | Component / Tool | Version / Specification | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | Semantic HTML5, CSS3, Vanilla JavaScript | Native browser standards | Zero heavyweight frontend framework overhead; transparent, fine-grained DOM event capture without virtual DOM interference. |
| **Backend** | Python 3.10+, Flask | Flask 3.0+, Werkzeug | Lightweight, modular blueprint architecture, explicit request pipeline, minimal latency. |
| **Database** | SQLite (WAL mode) | Native Python `sqlite3` | Zero-configuration local persistence, easily portable to PostgreSQL via ANSI SQL schema design. |
| **Automation** | Selenium WebDriver | Selenium 4.18+, Chrome/Chromium | Controllable test generation tool for executing human-like and rapid bot profiles against localhost. |
| **Data Science** | Pandas, NumPy, SciPy | Latest stable | Efficient vectorization, statistical distributions (mean, std, IQR, entropy, curvature). |
| **Machine Learning** | Scikit-learn, XGBoost | Scikit-learn 1.4+, XGBoost 2.0+ | Fast tabular classification, native tree feature importances, interpretable baselines (Logistic Regression). |
| **Dashboard** | Streamlit | Streamlit 1.32+ | Interactive real-time research monitoring, telemetry exploration, and live model diagnostics. |
| **Testing** | Pytest, Pytest-Cov | Pytest 8.0+ | Comprehensive automated test suite across unit, integration, ML schema, and API boundaries. |

---

## 4. Technical Architecture & Component Flow

```
+----------------------------------------------------------------------------------------------------+
|                                      CLIENT BROWSER (LOCALHOST)                                    |
|  +--------------------------------+  +--------------------------------+  +----------------------+  |
|  | Booking Flow UI (HTML/CSS/JS)  |  | Behavioral Collector (JS)      |  | Adaptive Challenge   |  |
|  | - Search, Selection, Passenger |  | - Keystroke timings (dt only)  |  | - Cognitive puzzle   |  |
|  | - Simulated Payment & Summary  |  | - Cursor movement & speed      |  | - Re-verification    |  |
|  +---------------+----------------+  | - Scroll & form field dwell    |  +----------^-----------+  |
|                  |                   +---------------+----------------+             |              |
+------------------|-----------------------------------|------------------------------|--------------+
                   | HTTP Request (Form/JSON)          | Telemetry Batch (JSON/Beacon)| Verification
                   v                                   v                              |
+-------------------------------------------------------------------------------------|--------------+
|                                    FLASK BACKEND & SECURITY GATEWAY                 |              |
|  +----------------------------------------------------------------------------------+-----------+  |
|  | Request Interceptor & Session Security Layer                                                 |  |
|  | - HMAC Session Validation, Monotonic Sequence Check, Token-Bucket Rate Limiter               |  |
|  +-----------------------+----------------------------------+-----------------------------------+  |
|                          |                                  |                                      |
|  +-----------------------v--------+  +----------------------v---------+  +----------------------+  |
|  | Booking Engine Blueprint       |  | Telemetry Collector Blueprint  |  | Adaptive Security    |  |
|  | - /api/search, /api/book       |  | - /api/telemetry/event         |  | - Allow (0-39)       |  |
|  | - State: PENDING/CONFIRMED     |  | - Raw Event Buffer             |  | - Challenge (40-69)  |  |
|  +-----------------------+--------+  +----------------------+---------+  | - Rate-limit (70-100)|  |
|                          |                                  |            +----------^-----------+  |
+--------------------------|----------------------------------|-----------------------|--------------+
                           |                                  v                       |
+--------------------------|------------------+  +------------------------------------|--------------+
|       PERSISTENCE LAYER (SQLITE)            |  |      ML INFERENCE & RISK PIPELINE  |              |
|  - users, trains, bookings, passengers      |  |  +---------------------------------+-----------+  |
|  - sessions, raw_events, behavior_features  |  |  | Feature Engineering Engine (Aggregator)     |  |
|  - risk_assessments, security_actions       |  |  +-----------------+---------------------------+  |
|                                             |  |                    v                              |
|                                             |  |  +-------------------------------------------+  |
|                                             |  |  | Scikit-learn Classifier (Random Forest)   |  |
|                                             |  |  | - Probability Score P(Bot | X)            |  |
|                                             |  |  +-----------------+-------------------------+  |
|                                             |  |                    v                              |
|                                             |  |  +-------------------------------------------+  |
|                                             |  |  | Risk Engine (0-100 Score & Top Signals)   |  |
|                                             |  |  +-------------------------------------------+  |
+---------------------------------------------+  +---------------------------------------------------+
```

---

## 5. Folder Structure

```
MDC project/
├── frontend/                        # Web user interface
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css            # Clean, professional ticket booking theme
│   │   ├── js/
│   │   │   ├── telemetry.js         # Privacy-preserving behavioral collector
│   │   │   ├── booking.js           # Interactive railway booking workflow
│   │   │   └── challenge.js         # Adaptive verification challenge UI
│   │   └── img/                     # Original branding assets (no official logos)
│   └── templates/                   # Jinja2 HTML templates
│       ├── base.html
│       ├── index.html               # Home
│       ├── register.html            # Registration
│       ├── login.html               # Login
│       ├── search.html              # Train search
│       ├── results.html             # Train results & seat availability
│       ├── passenger.html           # Passenger details entry
│       ├── review.html              # Booking summary
│       ├── payment.html             # Simulated payment
│       ├── confirmation.html        # Booking confirmation
│       ├── challenge.html           # Adaptive verification modal/page
│       └── status.html              # User & session diagnostics
├── backend/                         # Flask application & APIs
│   ├── __init__.py
│   ├── app.py                       # Application factory & runner
│   ├── config.py                    # Environment & threshold configuration
│   ├── blueprints/
│   │   ├── auth.py                  # Authentication & password hashing
│   │   ├── booking.py               # Railway search & booking workflow
│   │   ├── telemetry.py             # Ingestion endpoint for behavioral telemetry
│   │   └── security.py              # Adaptive defense & challenge endpoints
│   ├── middleware/
│   │   ├── session_guard.py         # Session validation & token tracking
│   │   └── rate_limiter.py          # Dynamic graduated rate-limiting
│   └── utils/
│       ├── crypto.py                # Password hashing & HMAC session tokens
│       └── logger.py                # Structured logging
├── database/                        # Schema & database connectivity
│   ├── __init__.py
│   ├── db.py                        # SQLite connection manager (WAL mode)
│   ├── schema.sql                   # Normalized relational DDL
│   └── seed_data.py                 # Initial train schedules & station data
├── behavior_tracking/               # Client & server behavioral collectors
│   ├── __init__.py
│   ├── collector.py                 # Server-side event receiver & validator
│   └── sanitization.py              # Sensitive field filtering & privacy shield
├── bot_simulator/                   # Controlled automation generator
│   ├── __init__.py
│   ├── driver.py                    # Headless/visible Selenium driver factory
│   ├── profiles/
│   │   ├── base_bot.py              # Abstract bot runner
│   │   ├── fast_bot.py              # Zero-delay instant DOM filler
│   │   ├── fixed_delay_bot.py       # Deterministic fixed-delay bot
│   │   ├── variable_delay_bot.py    # Randomized timing distribution bot
│   │   ├── fast_form_bot.py         # Human navigation with ultra-fast form filling
│   │   └── alternate_nav_bot.py     # Non-linear flow & sequence jumping bot
│   └── runner.py                    # Multi-session batch automation generator
├── data/                            # Datasets partitioned by session
│   ├── raw/                         # Raw session event batches (JSONL)
│   ├── processed/                   # Session-level feature tables (CSV/Parquet)
│   └── sample/                      # Minimal sample data for test suites
├── features/                        # Feature engineering pipeline
│   ├── __init__.py
│   ├── extractor.py                 # Raw event stream to session feature vector
│   ├── schema.py                    # Pydantic/dataclass schema for feature validation
│   └── dictionary.py                # Canonical feature dictionary & documentation
├── ml/                              # Machine learning training & inference
│   ├── __init__.py
│   ├── training/
│   │   ├── train.py                 # Anti-leakage training script (GroupKFold)
│   │   └── split.py                 # Session-level partitioner (Train/Val/Test)
│   ├── inference/
│   │   ├── predictor.py             # Real-time inference engine
│   │   └── model_loader.py          # Versioned model loader with fallback
│   ├── models/                      # Serialized model artifacts (.joblib, .json)
│   └── evaluation/
│       ├── metrics.py               # Accuracy, Precision, Recall, F1, FPR, Latency
│       └── ablation.py              # Multi-signal vs single-modality experiment runner
├── risk_engine/                     # Risk scoring & feature attribution
│   ├── __init__.py
│   ├── scorer.py                    # Probability to 0-100 risk score mapper
│   ├── explainability.py            # Local feature attribution & risk signal generator
│   └── thresholds.py                # Configurable risk thresholds (Low/Med/High)
├── security/                        # Adaptive security enforcement
│   ├── __init__.py
│   ├── policy.py                    # Allow -> Verify -> Restrict policy engine
│   └── challenges.py                # Cognitive challenge generator & validator
├── dashboard/                       # Streamlit analytics & research dashboard
│   ├── app.py                       # Interactive Streamlit dashboard
│   └── components/                  # Metric cards, confusion matrices, ROC plots
├── tests/                           # Pytest automated test suite
│   ├── conftest.py                  # Fixtures (in-memory DB, test client)
│   ├── test_auth.py                 # Registration & login tests
│   ├── test_booking.py              # Train search & booking workflow tests
│   ├── test_telemetry.py            # Event ingestion & privacy filter tests
│   ├── test_features.py             # Feature extractor & schema validation tests
│   ├── test_ml.py                   # Model training, inference, and anti-leakage tests
│   ├── test_risk_engine.py          # Risk scoring & explanation tests
│   ├── test_adaptive_defense.py     # Graduated response & rate limiting tests
│   └── test_e2e.py                  # End-to-end integration tests
├── docs/                            # Comprehensive research documentation
│   ├── ARCHITECTURE_AUDIT.md
│   ├── RESEARCH_METHODOLOGY.md
│   ├── FEATURE_DICTIONARY.md
│   └── EVALUATION_RESULTS.md
├── .agents/skills/ticket-bot-security/
│   └── SKILL.md                     # Permanent agent guidelines & rules
├── config/                          # Configuration presets
│   └── default.env
├── requirements.txt                 # Exact pinned dependencies
├── implementation_plan.sh           # Executable phase runner script
└── README.md                        # Setup, execution, and replication guide
```

---

## 6. Database Schema Design (SQLite / ANSI SQL)

The schema is normalized to 3NF, uses appropriate indexes on query paths, and avoids storing any sensitive personal or payment credentials.

```sql
-- Users table (securely hashed credentials)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_uuid TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trains schedule table
CREATE TABLE IF NOT EXISTS trains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_number TEXT UNIQUE NOT NULL,
    train_name TEXT NOT NULL,
    source_station TEXT NOT NULL,
    dest_station TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    total_seats_1a INTEGER DEFAULT 10,
    total_seats_2a INTEGER DEFAULT 20,
    total_seats_3a INTEGER DEFAULT 40,
    total_seats_sl INTEGER DEFAULT 60,
    fare_base REAL NOT NULL
);

-- Active browser/user sessions
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    session_label TEXT CHECK(session_label IN ('human', 'bot', 'unlabeled')) DEFAULT 'unlabeled',
    bot_profile TEXT,
    ip_address TEXT,
    user_agent TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Raw behavioral event batches (anonymized deltas only)
CREATE TABLE IF NOT EXISTS behavior_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT NOT NULL,
    event_type TEXT NOT NULL,          -- 'keystroke', 'mousemove', 'click', 'scroll', 'form_dwell'
    timestamp_ms INTEGER NOT NULL,
    payload_json TEXT NOT NULL,        -- Strict delta measurements, NO typed characters or PII
    FOREIGN KEY(session_token) REFERENCES sessions(session_token)
);

-- Aggregated session-level feature vectors (one row per session evaluation)
CREATE TABLE IF NOT EXISTS behavior_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    features_json TEXT NOT NULL,       -- Serialized dictionary of 25+ computed features
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_token) REFERENCES sessions(session_token)
);

-- Risk assessments evaluated by the ML inference engine
CREATE TABLE IF NOT EXISTS risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT NOT NULL,
    model_version TEXT NOT NULL,
    bot_probability REAL NOT NULL,
    risk_score INTEGER NOT NULL,       -- 0 to 100
    risk_category TEXT NOT NULL,       -- 'LOW', 'MEDIUM', 'HIGH'
    top_signals_json TEXT NOT NULL,    -- Human-readable explainability list
    inference_latency_ms REAL NOT NULL,
    assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_token) REFERENCES sessions(session_token)
);

-- Adaptive security enforcement actions
CREATE TABLE IF NOT EXISTS security_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT NOT NULL,
    action_taken TEXT NOT NULL,        -- 'ALLOW', 'CHALLENGE_ISSUED', 'CHALLENGE_PASSED', 'RATE_LIMITED', 'RESTRICTED'
    challenge_type TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_token) REFERENCES sessions(session_token)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pnr_number TEXT UNIQUE NOT NULL,
    session_token TEXT NOT NULL,
    user_id INTEGER,
    train_id INTEGER NOT NULL,
    travel_date TEXT NOT NULL,
    travel_class TEXT NOT NULL,
    total_fare REAL NOT NULL,
    booking_status TEXT NOT NULL,      -- 'PENDING', 'CONFIRMED', 'RESTRICTED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(train_id) REFERENCES trains(id)
);

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    passenger_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    berth_preference TEXT,
    seat_allocated TEXT,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_events_session ON behavior_events(session_token);
CREATE INDEX IF NOT EXISTS idx_assessments_session ON risk_assessments(session_token);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr_number);
```

---

## 7. Behavioral Telemetry Schema & Client Harvester

### Privacy-Preserving Event Capture Rules
1. **Never Capture Keystroke Values:** Do NOT log `event.key`, `event.code`, or text input contents. Log solely `delta_time = keyup_time - keydown_time` and `interkey_interval = keydown_current - keydown_previous`.
2. **Exclude Password & Card Fields:** Telemetry listener attaches an ignore filter to any `<input type="password">` or `<input data-sensitive="true">`.
3. **Normalized Mouse Coordinates:** Store cursor positions normalized to screen resolution $(x / W, y / H)$ and timestamp $\Delta t$.
4. **Buffered Batch Transmission:** Browser buffers events locally and dispatches via `navigator.sendBeacon` or asynchronous `POST /api/telemetry/event` every 3 seconds or on critical stage changes (e.g., train selection, form submission).

### Telemetry Event Types & Payload Schemas
- **Keystroke:** `{"type": "keystroke", "dwell_ms": 78, "interval_ms": 142, "is_backspace": false}`
- **Mouse Movement:** `{"type": "mousemove", "dx": 14, "dy": -8, "dt_ms": 32, "speed": 0.5}`
- **Click:** `{"type": "click", "x_norm": 0.45, "y_norm": 0.62, "dwell_ms": 65}`
- **Scroll:** `{"type": "scroll", "dy": 120, "dt_ms": 80}`
- **Form Focus/Dwell:** `{"type": "form_dwell", "field_id": "passenger_age", "dwell_ms": 1820}`
- **Page Transition:** `{"type": "navigation", "from_page": "search", "to_page": "passenger", "dwell_ms": 5400}`

---

## 8. Feature Engineering Specification (Feature Dictionary)

Raw event streams are reduced to a fixed-length numerical feature vector representing the session's behavioral signature:

| Feature Name | Modality | Calculation / Definition | Expected Human Pattern | Expected Bot Pattern |
| :--- | :--- | :--- | :--- | :--- |
| `typing_speed_cpm` | Keystroke | Keystrokes per minute across form fields | 120–400 CPM | $>1000$ CPM or deterministic |
| `interkey_mean_ms` | Keystroke | Mean time delta between consecutive keystrokes | 150–350 ms | $<30$ ms (fast) or exact constant (fixed) |
| `interkey_std_ms` | Keystroke | Standard deviation of inter-key intervals | High variance ($>40$ ms) | Near zero ($\sigma < 5$ ms) |
| `interkey_entropy` | Keystroke | Shannon entropy of discretized inter-key delays | High entropy ($H > 2.5$) | Low entropy ($H < 1.0$) |
| `backspace_count` | Keystroke | Count of correction/backspace events | $>0$ on complex inputs | Typically $0$ (direct text paste) |
| `mouse_total_distance` | Mouse | Total Euclidean path traversed $(\sum \sqrt{\Delta x^2 + \Delta y^2})$ | Substantial ($>500$ px) | $0$ (headless/DOM clicks) or minimal |
| `mouse_mean_speed` | Mouse | Average cursor velocity $(\text{px} / \text{ms})$ | Smooth human range ($0.2–1.5$) | Infinite / zero |
| `mouse_speed_std` | Mouse | Velocity standard deviation | High acceleration variability | Constant or null |
| `mouse_curvature_ratio`| Mouse | Ratio of actual trajectory length to straight-line distance | $>1.15$ (curved human trajectories) | $1.00$ (straight automated vectors) or $0$ |
| `mouse_pause_count` | Mouse | Number of cursor stops longer than 200 ms | Multiple pauses during reading | Zero pauses |
| `click_count` | Click | Total number of recorded mouse clicks | Moderate (e.g., 5–15) | Minimum required clicks only |
| `click_interval_mean` | Click | Average duration between consecutive clicks | 1.5–6.0 seconds | Instantaneous ($<0.1$ s) or uniform |
| `click_interval_std` | Click | Standard deviation of inter-click durations | High variance | Near zero variance |
| `scroll_count` | Scroll | Total wheel/touch scroll events | $>3$ during results browsing | $0$ (automated element targeting) |
| `scroll_interval_mean` | Scroll | Average time between scroll bursts | 300–1200 ms | $0$ or constant |
| `form_completion_time` | Form | Total seconds elapsed on passenger details page | 10–45 seconds | $<1.5$ seconds |
| `field_dwell_mean` | Form | Mean seconds spent interacting with each field | 1.8–5.0 seconds | $<0.2$ seconds |
| `field_dwell_std` | Form | Variance across form field dwell times | Varied per field difficulty | Homogeneous |
| `page_dwell_time` | Navigation | Seconds spent on train results prior to booking | 4–20 seconds | $<0.8$ seconds |
| `request_frequency` | Session | Application-level requests per minute | 2–10 req/min | $>30$ req/min |
| `booking_sequence_valid`| Navigation | Boolean: followed strict normal booking flow | 1 (True) | Often skips intermediate search steps |

---

## 9. Machine Learning Pipeline & Anti-Leakage Safeguards

### Anti-Leakage Partitioning Strategy
1. **Grouping by Session ID:** Splitting is performed exclusively using `GroupKFold` or `StratifiedGroupKFold` grouped by `session_token` and `user_id`. No events or feature representations from session $S_k$ may appear in both Train and Test.
2. **Unseen Automation Profile Evaluation:** 
   - **Training Set:** Human sessions + Bot Profiles (`FAST`, `FIXED_DELAY`, `FAST_FORM`).
   - **Held-Out Test Set:** Distinct Human sessions + Bot Profile (`VARIABLE_DELAY` and `ALTERNATE_NAVIGATION`).
   - This validates whether the model generalizes to randomized or unseen automation styles.

### Model Architecture
- **Primary Model:** Scikit-learn `RandomForestClassifier`
  - `n_estimators=100`, `max_depth=12`, `min_samples_split=4`, `class_weight="balanced"`.
  - Provides native Mean Decrease in Impurity (MDI) feature importances for explainability.
  - Sub-10ms inference latency on standard CPU.
- **Baseline Models for Scientific Comparison:**
  - `LogisticRegression(penalty="l2", C=1.0)`: Linear baseline to test whether non-linear combinations are essential.
  - `XGBClassifier(n_estimators=100, max_depth=6)`: Gradient boosted tree baseline for performance benchmarking.

### Ground Truth Labeling Strategy
- `0` = Genuine Human Session
- `1` = Automated Bot Session

---

## 10. Risk Engine & Adaptive Defense Design

### Risk Score Formulation
The model outputs a probability estimate $P(\text{Bot} \mid X) \in [0, 1]$.  
The normalized Bot Risk Score $R \in [0, 100]$ is computed as:
$$R = \text{round}(P(\text{Bot} \mid X) \times 100)$$

### Graduated Response State Machine

```
   [ Incoming Booking Request ]
                |
                v
       [ Extract Features ]
                |
                v
      [ ML Model Inference ]
                |
                v
        [ Risk Score R ]
                |
    +-----------+-----------+
    |           |           |
    v           v           v
 [R < 40]   [40 <= R < 70]  [R >= 70]
 LOW RISK    MEDIUM RISK    HIGH RISK
    |           |               |
    v           v               v
 Allow       Interactive      Graduated
 Instant     Verification     Containment:
 Booking     (Puzzle/OTP)     - Delay Queue
                |             - Dynamic Throttle
                v             - 10s Token Bucket
         Passed? / Failed?
```

- **Low Risk (0–39):** Frictionless flow. Direct transition to simulated payment and booking confirmation.
- **Medium Risk (40–69):** Adaptive Challenge. An in-context cognitive verification modal is served (e.g., pattern selection or lightweight re-verification). Successful completion allows booking; failure increases risk score by $+25$.
- **High Risk (70–100):** Graduated Containment. 
  - Dynamic rate-limiting: injected processing delay (e.g., 5–10 second artificial latency queue).
  - Session throttled: prevents rapid multiple seat hold attempts.
  - If sustained high risk continues, the session is temporarily restricted for the active booking window (10 minutes).
  - **Crucial Rule:** No permanent user or IP bans on single behavioral predictions.

### Explainability Engine
Every risk evaluation produces human-interpretable risk attribution signals:
```json
{
  "risk_score": 84,
  "risk_category": "HIGH",
  "decision": "RATE_LIMITED",
  "primary_signals": [
    "Form completion time (0.42s) is 95% faster than human baseline (18.4s)",
    "Mouse trajectory entropy (0.02) indicates near-zero cursor motion",
    "Inter-key typing interval variance (1.8ms) exhibits synthetic regularity"
  ]
}
```

---

## 11. Security & Privacy Hardening

1. **Password Security:** Salted and hashed using `werkzeug.security.generate_password_hash` (PBKDF2-SHA256 with 260,000 rounds).
2. **Session Authentication:** Cryptographically signed session cookies with `HttpOnly`, `SameSite=Lax`, and secret key rotation support.
3. **Telemetry Tampering Defense:** Client-side telemetry batches are verified against the active server session; sequence IDs prevent replay attacks; timestamps are validated for causal monotonicity.
4. **Input Sanitization:** Parameterized SQL queries throughout to eliminate SQL injection; escaping in Jinja2 templates to prevent Cross-Site Scripting (XSS).
5. **Privacy by Design:** Zero capture of plain text passwords, credit card numbers, or government IDs. All session metadata uses anonymized UUIDs. Telemetry stores purely temporal and spatial deltas.

---

## 12. Experimental Plan & Research Validation

The research methodology encompasses 9 empirical experiments:

| Experiment | Title | Description & Method | Success / Evaluation Criteria |
| :--- | :--- | :--- | :--- |
| **Exp 1** | Fast Automation vs. Human | Evaluate detection against `BOT_PROFILE_FAST` (zero delay). | Detection Recall $>98\%$, Accuracy $>98\%$. |
| **Exp 2** | Fixed-Delay Automation vs. Human | Evaluate detection against `BOT_PROFILE_FIXED_DELAY` (static sleeps). | Recall $>95\%$, inter-key variance feature importance. |
| **Exp 3** | Variable-Delay Automation vs. Human | Evaluate detection against `BOT_PROFILE_VARIABLE_DELAY` (jittered sleeps). | Test model robustness against randomized timing. |
| **Exp 4** | Fast-Form Automation vs. Human | Evaluate against `BOT_PROFILE_FAST_FORM` (human navigation, fast inputs). | Verify form dwell time & field-to-field delta signal efficacy. |
| **Exp 5** | Algorithm Comparison | Compare Random Forest vs. Logistic Regression vs. XGBoost. | Compare ROC-AUC, F1-score, and inference latency (ms). |
| **Exp 6** | Risk Threshold Optimization | Tune decision boundaries ($R_{\text{low}}, R_{\text{high}}$) on validation ROC curve. | Minimize False Positive Rate ($\text{FPR} < 2\%$). |
| **Exp 7** | Human False Positive Audit | Evaluate model exclusively on 30+ genuine human sessions. | FPR must remain $\le 2\%$; analyze edge case misclassifications. |
| **Exp 8** | Generalization to Unseen Bot | Train on profiles 1–3; test exclusively on held-out profile 4 (`ALTERNATE_NAV`). | Quantify performance drop on novel attack vectors. |
| **Exp 9** | Multi-Signal Feature Ablation | Train 5 variants: (a) Key only, (b) Mouse only, (c) Session only, (d) Key+Mouse, (e) All signals. | Empirically demonstrate superior F1 and lower FPR of multi-signal fusion. |

---

## 13. Testing & Verification Strategy

### 1. Automated Testing (Pytest)
- **Unit Tests:** Password hashing, feature aggregation math, schema validation, risk formula mapping.
- **Integration Tests:** Authentication routes, booking state transitions, telemetry batch ingestion, session lifecycle.
- **ML Verification Tests:** Model serialization, zero NaN handling, GroupKFold leakage assertions, latency benchmarks ($<15$ ms).
- **Security Tests:** Rate limiter token exhaustion, invalid HMAC rejection, SQL injection parameterization checks.

### 2. Browser End-to-End Testing (Antigravity Browser Agent)
- Real-time verification of booking flow: Registration $\rightarrow$ Search $\rightarrow$ Selection $\rightarrow$ Passenger entry $\rightarrow$ Payment $\rightarrow$ Confirmation.
- Observation of client-side `telemetry.js` network payloads.
- Demonstration of adaptive challenge triggering upon automated rapid interaction.

---

## 14. Development Milestones & Implementation Roadmap

```
PHASE 00: Planning & Architecture Audit  [COMPLETE]
PHASE 01: Simulated Booking Website (Frontend HTML/CSS/JS)
PHASE 02: Backend & Database (Flask, SQLite, Schemas, Seed Data)
PHASE 03: Behavioral Telemetry Collector (telemetry.js & Ingestion API)
PHASE 04: Human Data Collection Workflow & Protocol
PHASE 05: Controlled Bot Simulator (Selenium Multi-Profile Suite)
PHASE 06: Dataset Processing Pipeline (Clean, Session-Grouped Datasets)
PHASE 07: Feature Engineering & Feature Dictionary Validation
PHASE 08: Machine Learning Baseline & Training Pipeline
PHASE 09: Risk Scoring Engine & Threshold Calibration
PHASE 10: Explainability & Risk Attribution Module
PHASE 11: Adaptive Security & Graduated Defense Gateway
PHASE 12: Streamlit Research & Monitoring Dashboard
PHASE 13: Full Automated & E2E Testing Suite (Pytest + Browser)
PHASE 14: Experimental Evaluation & Ablation Study Execution
PHASE 15: Final Documentation, Research Report & Interactive Demo
```

---

## 15. Acceptance Criteria

A milestone is considered complete ONLY when:
1. All relevant source files are written and lint-free.
2. Pytest unit/integration test suite passes with 0 failures.
3. Live application runs on `localhost:5000` without console or server errors.
4. Telemetry events accurately capture and aggregate without PII leaks.
5. All ML metrics represent genuine empirical evaluation outputs from executed scripts.
6. Documentation is synchronized with the codebase.
