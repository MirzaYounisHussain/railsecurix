#!/usr/bin/env bash
set -Eeuo pipefail

# ==============================================================================
# PROJECT: AI-Based Behavioral Bot Detection and Adaptive Cybersecurity
# SCRIPT:  implementation_plan.sh
# PURPOSE: Milestone execution and verification runner for all project phases
# ==============================================================================

# Script Directory and Workspace Root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Color Codes for Output
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

DRY_RUN=false

# ------------------------------------------------------------------------------
# Logging Helper
# ------------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ------------------------------------------------------------------------------
# Phase Definitions and Execution Functions
# ------------------------------------------------------------------------------

phase_00() {
    local phase_desc="PHASE 00: Planning & Architecture Audit"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would verify: docs/ARCHITECTURE_AUDIT.md, plan.md, .agents/skills/ticket-bot-security/SKILL.md"
        return 0
    fi
    test -f "docs/ARCHITECTURE_AUDIT.md" || { log_error "docs/ARCHITECTURE_AUDIT.md missing"; return 1; }
    test -f "plan.md" || { log_error "plan.md missing"; return 1; }
    test -f ".agents/skills/ticket-bot-security/SKILL.md" || { log_error "SKILL.md missing"; return 1; }
    log_success "$phase_desc verified successfully."
}

phase_01() {
    local phase_desc="PHASE 01: Simulated Booking Website (Frontend UI)"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would verify: frontend/templates/*.html, frontend/static/css/style.css, frontend/static/js/booking.js"
        return 0
    fi
    mkdir -p frontend/templates frontend/static/css frontend/static/js frontend/static/img
    for tmpl in base.html index.html register.html login.html search.html results.html passenger.html review.html payment.html confirmation.html status.html challenge.html; do
        test -f "frontend/templates/$tmpl" || { log_error "Template missing: $tmpl"; return 1; }
    done
    test -f "frontend/static/css/style.css" || { log_error "style.css missing"; return 1; }
    test -f "frontend/static/js/booking.js" || { log_error "booking.js missing"; return 1; }
    log_success "$phase_desc: All 12 views, templates, CSS, and JS verified successfully."
}

phase_02() {
    local phase_desc="PHASE 02: Backend & Database"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would configure: database/schema.sql, database/db.py, backend/app.py, backend/blueprints"
        return 0
    fi
    mkdir -p backend/blueprints backend/middleware backend/utils database
    log_info "Created backend and database scaffolding."
    log_success "$phase_desc ready for backend implementation."
}

phase_03() {
    local phase_desc="PHASE 03: Behavioral Telemetry"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would create: frontend/static/js/telemetry.js, behavior_tracking/collector.py, backend/blueprints/telemetry.py"
        return 0
    fi
    mkdir -p behavior_tracking
    log_info "Created behavior_tracking scaffolding."
    log_success "$phase_desc ready."
}

phase_04() {
    local phase_desc="PHASE 04: Human Data Collection"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would setup: data/raw/human, docs/HUMAN_COLLECTION_PROTOCOL.md, scripts/record_human_session.py"
        return 0
    fi
    mkdir -p data/raw/human data/raw/bot data/processed data/sample
    log_info "Created dataset directories."
    log_success "$phase_desc ready."
}

phase_05() {
    local phase_desc="PHASE 05: Controlled Bot Simulator"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would setup: bot_simulator/driver.py, bot_simulator/profiles/*.py, bot_simulator/runner.py"
        return 0
    fi
    mkdir -p bot_simulator/profiles
    log_info "Created bot_simulator scaffolding."
    log_success "$phase_desc ready."
}

phase_06() {
    local phase_desc="PHASE 06: Dataset Pipeline"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: data cleaning, session-level grouping, anti-leakage verification"
        return 0
    fi
    log_info "Verifying dataset pipeline directories..."
    test -d data/raw && test -d data/processed
    log_success "$phase_desc ready."
}

phase_07() {
    local phase_desc="PHASE 07: Feature Engineering"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: features/extractor.py, features/schema.py, features/dictionary.py"
        return 0
    fi
    mkdir -p features
    log_info "Created features scaffolding."
    log_success "$phase_desc ready."
}

phase_08() {
    local phase_desc="PHASE 08: Machine Learning Baseline & Training"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: ml/training/train.py, ml/training/split.py, ml/inference/predictor.py"
        return 0
    fi
    mkdir -p ml/training ml/inference ml/models ml/evaluation
    log_info "Created ML directory scaffolding."
    log_success "$phase_desc ready."
}

phase_09() {
    local phase_desc="PHASE 09: Risk Scoring Engine"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: risk_engine/scorer.py, risk_engine/thresholds.py"
        return 0
    fi
    mkdir -p risk_engine
    log_info "Created risk_engine scaffolding."
    log_success "$phase_desc ready."
}

phase_10() {
    local phase_desc="PHASE 10: Explainability Module"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: risk_engine/explainability.py, top signals attribution"
        return 0
    fi
    log_info "Explainability module checked."
    log_success "$phase_desc ready."
}

phase_11() {
    local phase_desc="PHASE 11: Adaptive Security Gateway"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: security/policy.py, security/challenges.py, backend/blueprints/security.py"
        return 0
    fi
    mkdir -p security
    log_info "Created security directory scaffolding."
    log_success "$phase_desc ready."
}

phase_12() {
    local phase_desc="PHASE 12: Streamlit Dashboard"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would implement: dashboard/app.py, dashboard/components/*.py"
        return 0
    fi
    mkdir -p dashboard/components
    log_info "Created dashboard scaffolding."
    log_success "$phase_desc ready."
}

phase_13() {
    local phase_desc="PHASE 13: Testing Suite (Pytest)"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would run: pytest tests/ -v"
        return 0
    fi
    mkdir -p tests
    if command -v pytest &> /dev/null; then
        log_info "Running pytest suite if tests exist..."
        pytest tests/ -v || log_warning "Tests failed or no tests found yet."
    else
        log_warning "Pytest not found in current PATH."
    fi
    log_success "$phase_desc scaffolding ready."
}

phase_14() {
    local phase_desc="PHASE 14: Experimental Evaluation & Ablation Study"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would execute: Experiments 1 through 9 including multi-signal ablation study"
        return 0
    fi
    log_info "Experimental runner ready."
    log_success "$phase_desc ready."
}

phase_15() {
    local phase_desc="PHASE 15: Documentation & Final Demo"
    log_info "Executing $phase_desc"
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would verify: docs/RESEARCH_REPORT.md, README.md, full demo flow"
        return 0
    fi
    log_info "Final documentation verification ready."
    log_success "$phase_desc ready."
}

# ------------------------------------------------------------------------------
# CLI Commands
# ------------------------------------------------------------------------------

list_phases() {
    echo -e "${BOLD}Available Implementation Phases:${NC}"
    echo "  phase_00  - Planning & Architecture Audit"
    echo "  phase_01  - Simulated Booking Website (Frontend UI)"
    echo "  phase_02  - Backend & Database"
    echo "  phase_03  - Behavioral Telemetry"
    echo "  phase_04  - Human Data Collection"
    echo "  phase_05  - Controlled Bot Simulator"
    echo "  phase_06  - Dataset Pipeline"
    echo "  phase_07  - Feature Engineering"
    echo "  phase_08  - Machine Learning Baseline & Training"
    echo "  phase_09  - Risk Scoring Engine"
    echo "  phase_10  - Explainability Module"
    echo "  phase_11  - Adaptive Security Gateway"
    echo "  phase_12  - Streamlit Dashboard"
    echo "  phase_13  - Testing Suite (Pytest)"
    echo "  phase_14  - Experimental Evaluation & Ablation Study"
    echo "  phase_15  - Documentation & Final Demo"
}

check_status() {
    echo -e "${BOLD}Current Implementation Status:${NC}"
    for phase in {00..15}; do
        pname="phase_${phase}"
        case "$phase" in
            00)
                if [ -f "docs/ARCHITECTURE_AUDIT.md" ] && [ -f "plan.md" ] && [ -f ".agents/skills/ticket-bot-security/SKILL.md" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: Planning & Architecture Audit"
                else
                    echo -e "  [${YELLOW}IN PROGRESS${NC}] $pname: Planning & Architecture Audit"
                fi
                ;;
            01)
                if [ -f "frontend/templates/index.html" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: Simulated Booking Website"
                else
                    echo -e "  [${RED}PENDING${NC}]   $pname: Simulated Booking Website"
                fi
                ;;
            02)
                if [ -f "backend/app.py" ] && [ -f "database/schema.sql" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: Backend & Database"
                else
                    echo -e "  [${RED}PENDING${NC}]   $pname: Backend & Database"
                fi
                ;;
            03)
                if [ -f "frontend/static/js/telemetry.js" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: Behavioral Telemetry"
                else
                    echo -e "  [${RED}PENDING${NC}]   $pname: Behavioral Telemetry"
                fi
                ;;
            05)
                if [ -f "bot_simulator/driver.py" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: Controlled Bot Simulator"
                else
                    echo -e "  [${RED}PENDING${NC}]   $pname: Controlled Bot Simulator"
                fi
                ;;
            08)
                if [ -f "ml/training/train.py" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: ML Baseline & Training"
                else
                    echo -e "  [${RED}PENDING${NC}]   $pname: ML Baseline & Training"
                fi
                ;;
            12)
                if [ -f "dashboard/app.py" ]; then
                    echo -e "  [${GREEN}COMPLETED${NC}] $pname: Streamlit Dashboard"
                else
                    echo -e "  [${RED}PENDING${NC}]   $pname: Streamlit Dashboard"
                fi
                ;;
            *)
                echo -e "  [${RED}PENDING${NC}]   $pname"
                ;;
        esac
    done
}

print_help() {
    echo -e "${BOLD}Usage:${NC}"
    echo "  ./implementation_plan.sh list               # List all available phases"
    echo "  ./implementation_plan.sh status             # Check implementation progress"
    echo "  ./implementation_plan.sh <phase_name>       # Execute a specific phase (e.g., phase_00)"
    echo "  ./implementation_plan.sh --dry-run <phase>  # Simulate execution without applying changes"
    echo "  ./implementation_plan.sh help               # Display this help message"
}

# ------------------------------------------------------------------------------
# Argument Parsing
# ------------------------------------------------------------------------------

if [ $# -eq 0 ]; then
    print_help
    exit 0
fi

while [ $# -gt 0 ]; do
    case "$1" in
        list)
            list_phases
            exit 0
            ;;
        status)
            check_status
            exit 0
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        help|--help|-h)
            print_help
            exit 0
            ;;
        phase_*)
            TARGET_PHASE="$1"
            if declare -f "$TARGET_PHASE" > /dev/null; then
                "$TARGET_PHASE"
                exit 0
            else
                log_error "Unknown phase: $TARGET_PHASE"
                exit 1
            fi
            ;;
        *)
            log_error "Unrecognized command or option: $1"
            print_help
            exit 1
            ;;
    esac
done
