/**
 * RailSim Express - Telemetry Collector Stub (Phase 1 Baseline)
 * Will be fully instrumented in Phase 3 for keystroke, mouse, scroll, and form dwell tracking.
 */
window.RailSimTelemetry = {
    initialized: true,
    version: "1.0.0-phase1",
    eventCount: 0,
    recordEvent: function(type, data) {
        this.eventCount++;
        // Telemetry endpoint will receive batches in Phase 3
    }
};
