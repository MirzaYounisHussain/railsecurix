import { useEffect, useState } from "react";
import {
  getAllTrains,
  addTrain,
  updateTrain,
  deleteTrain,
  Train,
  TrainSchedule,
  addTrainSchedule,
  updateTrainSchedule,
  deleteTrainSchedule,
  getTrainSchedules,
  getSchedulesForDate,
  regenerateSchedulesFor30Days,
} from "@/services/trainService";
import { getAllBookings, Booking } from "@/services/bookingService";
import Loader from "@/components/Loader";
import { Plus, Pencil, Trash2, X, TicketCheck, Calendar, CheckCircle, AlertCircle, RefreshCw, BarChart3, Users as UsersIcon, TrendingUp } from "lucide-react";

// Remove this entire line and all content after line 638 below

const emptyTrain = {
  trainNumber: "",
  trainName: "",
  source: "",
  destination: "",
  departureTime: "",
  arrivalTime: "",
  fare: 0,
  totalSeats: 0,
  seatsAvailable: 0,
};

const emptySchedule = {
  trainId: "",
  date: "",
  seatsAvailable: 0,
  isActive: true,
};

const Admin = () => {
  const [trains, setTrains] = useState<Train[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [schedules, setSchedules] = useState<TrainSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"trains" | "bookings" | "schedules" | "analytics" | "users">("trains");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Train | null>(null);
  const [form, setForm] = useState(emptyTrain);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Schedule form states
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [selectedTrainForSchedule, setSelectedTrainForSchedule] = useState<Train | null>(null);
  const [trainSchedules, setTrainSchedules] = useState<TrainSchedule[]>([]);
  const [regeneratingTrainId, setRegeneratingTrainId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, b] = await Promise.all([getAllTrains(), getAllBookings()]);
      setTrains(t);
      setBookings(b);
      
      // Load all schedules with error handling
      try {
        const allSchedules = await Promise.all(
          t.map(train => getTrainSchedules(train.id).catch(() => []))
        );
        setSchedules(allSchedules.flat());
      } catch (error) {
        console.warn("Could not load schedules - collection may not exist yet:", error);
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      showMessage("error", "Failed to load data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Show message with auto-dismiss
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Calculate statistics
  const stats = {
    totalTrains: trains.length,
    totalSeats: trains.reduce((sum, t) => sum + t.totalSeats, 0),
    totalAvailable: trains.reduce((sum, t) => sum + t.seatsAvailable, 0),
    totalOccupied: trains.reduce((sum, t) => sum + (t.totalSeats - t.seatsAvailable), 0),
  };

  // ============ TRAINS TAB ============
  const handleSave = async () => {
    try {
      if (editing) {
        await updateTrain(editing.id, form);
        showMessage("success", "Train updated successfully!");
      } else {
        await addTrain({ ...form, seatsAvailable: form.totalSeats });
        showMessage("success", "Train added! 🎉 Auto-generated schedules for the next 30 days.");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyTrain);
      loadData();
    } catch (error) {
      showMessage("error", "Failed to save train. Please try again.");
    }
  };

  const handleEdit = (t: Train) => {
    setEditing(t);
    setForm({
      trainNumber: t.trainNumber,
      trainName: t.trainName,
      source: t.source,
      destination: t.destination,
      departureTime: t.departureTime,
      arrivalTime: t.arrivalTime,
      fare: t.fare,
      totalSeats: t.totalSeats,
      seatsAvailable: t.seatsAvailable,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this train and all its schedules?")) return;
    try {
      await deleteTrain(id);
      showMessage("success", "Train deleted successfully!");
      loadData();
    } catch (error) {
      showMessage("error", "Failed to delete train. Please try again.");
    }
  };

  const handleRegenerateSchedules = async (train: Train) => {
    setRegeneratingTrainId(train.id);
    try {
      await regenerateSchedulesFor30Days(train.id, train);
      showMessage("success", `Generated schedules for next 30 days for ${train.trainName}`);
      loadData();
    } catch (error) {
      showMessage("error", "Failed to generate schedules. Please try again.");
    } finally {
      setRegeneratingTrainId(null);
    }
  };

  // ============ SCHEDULES TAB ============
  const handleSelectTrainForSchedule = async (train: Train) => {
    setSelectedTrainForSchedule(train);
    const ts = await getTrainSchedules(train.id);
    setTrainSchedules(ts);
  };

  const handleSaveSchedule = async () => {
    if (!selectedTrainForSchedule) return;

    try {
      const data = {
        ...scheduleForm,
        trainId: selectedTrainForSchedule.id,
        trainNumber: selectedTrainForSchedule.trainNumber,
        totalSeats: selectedTrainForSchedule.totalSeats,
      };

      if (editingSchedule) {
        await updateTrainSchedule(editingSchedule.id, data);
        showMessage("success", "Schedule updated successfully!");
      } else {
        await addTrainSchedule(data);
        showMessage("success", "Schedule added successfully!");
      }

      setShowScheduleForm(false);
      setEditingSchedule(null);
      setScheduleForm(emptySchedule);
      handleSelectTrainForSchedule(selectedTrainForSchedule);
      loadData();
    } catch (error) {
      showMessage("error", "Failed to save schedule. Please try again.");
    }
  };

  const handleEditSchedule = (schedule: TrainSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      trainId: schedule.trainId,
      date: schedule.date,
      seatsAvailable: schedule.seatsAvailable,
      isActive: schedule.isActive,
    });
    setShowScheduleForm(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Delete this schedule?")) return;
    try {
      await deleteTrainSchedule(id);
      showMessage("success", "Schedule deleted successfully!");
      if (selectedTrainForSchedule) {
        handleSelectTrainForSchedule(selectedTrainForSchedule);
      }
      loadData();
    } catch (error) {
      showMessage("error", "Failed to delete schedule. Please try again.");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto max-w-5xl animate-fade-in px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Admin Panel</h1>

      {/* Message Alert */}
      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-4 ${
            message.type === "success"
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setTab("trains")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "trains"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Trains
        </button>
        <button
          onClick={() => setTab("schedules")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
            tab === "schedules"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" /> Train Schedules
        </button>
        <button
          onClick={() => setTab("bookings")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            tab === "bookings"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => setTab("analytics")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
            tab === "analytics"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Analytics
        </button>
        <button
          onClick={() => setTab("users")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
            tab === "users"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          <UsersIcon className="h-4 w-4" /> Users
        </button>
      </div>

      {/* TRAINS TAB */}
      {tab === "trains" && (
        <>
          {/* Statistics Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Trains</p>
              <p className="mt-2 text-3xl font-bold text-primary">{stats.totalTrains}</p>
              <p className="mt-1 text-xs text-muted-foreground">Active in system</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Capacity</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalSeats}</p>
              <p className="mt-1 text-xs text-muted-foreground">Combined seat count</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Available Seats</p>
              <p className="mt-2 text-3xl font-bold text-success">{stats.totalAvailable}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ready for booking</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Booked Seats</p>
              <p className="mt-2 text-3xl font-bold text-orange-600">{stats.totalOccupied}</p>
              <p className="mt-1 text-xs text-muted-foreground">Currently reserved</p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setForm(emptyTrain);
            }}
            className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Add Train
          </button>

          {showForm && (
            <div className="card-shadow mb-6 rounded-xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold">
                  {editing ? "Edit Train" : "Add Train"}
                </h2>
                <button onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    "trainNumber",
                    "trainName",
                    "source",
                    "destination",
                    "departureTime",
                    "arrivalTime",
                  ] as const
                ).map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="text-xs font-medium capitalize text-muted-foreground">
                      {k.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      value={form[k]}
                      onChange={(e) =>
                        setForm({ ...form, [k]: e.target.value })
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
                {(["fare", "totalSeats"] as const).map((k) => (
                  <div key={k} className="space-y-1">
                    <label className="text-xs font-medium capitalize text-muted-foreground">
                      {k.replace(/([A-Z])/g, " $1")}
                    </label>
                    <input
                      type="number"
                      value={form[k]}
                      onChange={(e) =>
                        setForm({ ...form, [k]: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
              {!editing && (
                <p className="mt-3 text-xs text-muted-foreground">
                  ℹ️ Adding a train will automatically generate schedules for the next 30 days.
                </p>
              )}
              <button
                onClick={handleSave}
                className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {editing ? "Update" : "Add"} Train
              </button>
            </div>
          )}

          {/* Trains List */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">All Available Trains</h2>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-primary">
                {trains.length} trains
              </span>
            </div>
            
            {trains.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-secondary/30 p-8 text-center">
                <p className="text-muted-foreground">No trains added yet. Click "Add Train" to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trains.map((t) => {
                  const trainScheduleCount = schedules.filter(s => s.trainId === t.id).length;
                  const occupancyPercent = ((t.totalSeats - t.seatsAvailable) / t.totalSeats) * 100;
                  return (
                    <div
                      key={t.id}
                      className="group rounded-xl border bg-card p-4 transition hover:border-primary hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Train Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-bold text-base">
                              {t.trainName}
                            </p>
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                              #{t.trainNumber}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">{t.source}</span> 
                            <span className="mx-2">→</span> 
                            <span className="font-medium">{t.destination}</span>
                          </p>
                          
                          {/* Details Row */}
                          <div className="mt-3 flex flex-wrap gap-3 sm:gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Fare:</span>
                              <span className="font-semibold text-primary">₹{t.fare}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium">{t.departureTime} - {t.arrivalTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-success" />
                              <span className="font-medium text-success">{trainScheduleCount} schedules</span>
                            </div>
                          </div>

                          {/* Occupancy Bar */}
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex-1">
                              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-success to-warning transition-all"
                                  style={{ width: `${occupancyPercent}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                              {t.seatsAvailable}/{t.totalSeats}
                            </span>
                          </div>

                          {/* Seat Status Badge */}
                          <div className="mt-2 flex gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2.5 py-1 text-xs font-semibold text-success">
                              ✓ {t.seatsAvailable} available
                            </span>
                            {t.totalSeats - t.seatsAvailable > 0 && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2.5 py-1 text-xs font-semibold text-warning">
                                ◐ {t.totalSeats - t.seatsAvailable} booked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t sm:border-t-0 sm:pt-0 sm:flex-col">
                          <button
                            onClick={() => handleRegenerateSchedules(t)}
                            disabled={regeneratingTrainId === t.id}
                            title="Generate schedules for next 30 days"
                            className="flex-1 sm:flex-none rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50 transition"
                          >
                            <RefreshCw
                              className={`h-4 w-4 ${
                                regeneratingTrainId === t.id ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleEdit(t)}
                            className="flex-1 sm:flex-none rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                            title="Edit train"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="flex-1 sm:flex-none rounded-lg p-2 text-destructive hover:bg-destructive/10 transition"
                            title="Delete train"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* SCHEDULES TAB */}
      {tab === "schedules" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left side: Train list */}
          <div>
            <h2 className="mb-4 font-bold text-lg">Select Train</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trains.map((t) => {
                const trainScheduleCount = schedules.filter(s => s.trainId === t.id).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrainForSchedule(t)}
                    className={`w-full text-left rounded-lg border p-3 transition ${
                      selectedTrainForSchedule?.id === t.id
                        ? "border-primary bg-primary/10"
                        : "bg-card hover:bg-secondary"
                    }`}
                  >
                    <p className="font-semibold text-sm">{t.trainName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.trainNumber} • {t.source} → {t.destination}
                    </p>
                    <p className="text-xs text-success mt-1">
                      📅 {trainScheduleCount} schedules
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side: Schedule management */}
          <div>
            {selectedTrainForSchedule ? (
              <>
                <div className="mb-4 rounded-lg border bg-card p-3">
                  <p className="text-sm font-semibold">
                    {selectedTrainForSchedule.trainName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ID: {selectedTrainForSchedule.id}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{selectedTrainForSchedule.trainNumber} •
                    Capacity: {selectedTrainForSchedule.totalSeats}
                  </p>
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingSchedule(null);
                      setScheduleForm(emptySchedule);
                      setShowScheduleForm(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" /> Add Schedule
                  </button>
                  <button
                    onClick={() => handleRegenerateSchedules(selectedTrainForSchedule)}
                    disabled={regeneratingTrainId === selectedTrainForSchedule.id}
                    title="Auto-generate schedules for next 30 days"
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        regeneratingTrainId === selectedTrainForSchedule.id
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    {regeneratingTrainId === selectedTrainForSchedule.id
                      ? "Generating..."
                      : "Auto-Generate"}
                  </button>
                </div>

                <p className="mb-4 text-xs text-muted-foreground bg-secondary/30 rounded p-2">
                  💡 Tip: Use <span className="font-semibold">Add Schedule</span> for single dates or <span className="font-semibold">Auto-Generate</span> to create schedules for the next 30 days
                </p>

                {showScheduleForm && (
                  <div className="card-shadow mb-4 rounded-xl border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-bold text-sm">
                        {editingSchedule ? "Edit Schedule" : "Add Schedule"}
                      </h3>
                      <button onClick={() => setShowScheduleForm(false)}>
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Date (YYYY-MM-DD)
                        </label>
                        <input
                          type="date"
                          value={scheduleForm.date}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              date: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Available Seats
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={selectedTrainForSchedule.totalSeats}
                          value={scheduleForm.seatsAvailable}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              seatsAvailable: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={scheduleForm.isActive}
                          onChange={(e) =>
                            setScheduleForm({
                              ...scheduleForm,
                              isActive: e.target.checked,
                            })
                          }
                          className="rounded border"
                        />
                        <label className="text-xs font-medium text-muted-foreground">
                          Active
                        </label>
                      </div>
                      <button
                        onClick={handleSaveSchedule}
                        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      >
                        {editingSchedule ? "Update" : "Add"} Schedule
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-sm font-semibold">Available Dates</p>
                  {trainSchedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      No schedules yet
                    </p>
                  ) : (
                    trainSchedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(s.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.seatsAvailable}/{s.totalSeats} seats available
                          </p>
                          {!s.isActive && (
                            <span className="mt-1 inline-block rounded bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSchedule(s)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(s.id)}
                            className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  Select a train to manage schedules
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKINGS TAB */}
      {tab === "bookings" && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <TicketCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {b.passengerName}{" "}
                      <span className="text-xs text-muted-foreground">
                        PNR: {b.PNR}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Train: {b.trainNumber} • {b.travelDate} • {b.coach}-
                      {b.seatNumber}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    b.bookingStatus === "confirmed"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {b.bookingStatus}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Total Bookings */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold">{bookings.length}</p>
                </div>
                <TicketCheck className="h-8 w-8 text-primary opacity-20" />
              </div>
              <p className="text-xs text-success mt-3">
                ✓ {bookings.filter(b => b.bookingStatus === "confirmed").length} confirmed
              </p>
            </div>

            {/* Avg Coach Occupancy */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Bookings by Status</p>
                  <p className="text-3xl font-bold">
                    {bookings.filter(b => b.bookingStatus === "confirmed").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {bookings.length > 0 ? `${((bookings.filter(b => b.bookingStatus === "confirmed").length / bookings.length) * 100).toFixed(1)}% confirmed` : "No data"}
              </p>
            </div>

            {/* Active Trains */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Trains</p>
                  <p className="text-3xl font-bold">{trains.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {schedules.length} schedules total
              </p>
            </div>

            {/* Occupancy Rate */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
                  <p className="text-3xl font-bold">
                    {trains.length > 0
                      ? (
                          ((trains.reduce((sum, t) => sum + (t.totalSeats - t.seatsAvailable), 0) /
                            trains.reduce((sum, t) => sum + t.totalSeats, 0)) *
                            100) || 0
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Across all trains
              </p>
            </div>
          </div>

          {/* Booking Status Distribution */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Booking Status Distribution
            </h3>
            <div className="space-y-3">
              {["confirmed", "cancelled", "pending"].map((status) => {
                const count = bookings.filter(b => b.bookingStatus === status).length;
                const percentage = bookings.length > 0 ? (count / bookings.length) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          status === "confirmed"
                            ? "bg-success"
                            : status === "cancelled"
                            ? "bg-destructive"
                            : "bg-warning"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Trains */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold mb-4">Most Popular Trains</h3>
            <div className="space-y-2">
              {bookings.length > 0 ? (
                Object.entries(
                  bookings.reduce((acc: Record<string, number>, b) => {
                    const trainKey = b.trainName;
                    acc[trainKey] = (acc[trainKey] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([trainName, count]) => (
                    <div
                      key={trainName}
                      className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg"
                    >
                      <span className="text-sm font-medium">{trainName}</span>
                      <span className="font-bold text-primary">{count} bookings</span>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-muted-foreground">No booking data yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USERS TAB */}
      {tab === "users" && (
        <div className="space-y-6">
          {/* User Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Passengers</p>
                  <p className="text-3xl font-bold">{new Set(bookings.map(b => b.passengerName)).size}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-primary opacity-20" />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Travelers</p>
                  <p className="text-3xl font-bold">{bookings.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Repeat Passengers</p>
                  <p className="text-3xl font-bold">
                    {bookings.length > 0
                      ? Object.values(
                          bookings.reduce((acc: Record<string, number>, b) => {
                            const key = b.passengerName;
                            acc[key] = (acc[key] || 0) + 1;
                            return acc;
                          }, {})
                        ).filter(count => count > 1).length
                      : 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold mb-4">Registered Users</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bookings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No users yet</p>
              ) : (
                Array.from(
                  new Map(bookings.map(b => [b.passengerName, b])).values()
                ).map((b, idx) => {
                  const userBookings = bookings.filter(booking => booking.passengerName === b.passengerName);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg text-sm"
                    >
                      <div>
                        <p className="font-medium">{b.passengerName}</p>
                        <p className="text-xs text-muted-foreground">Age: {b.age} • {b.gender}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          🎫 PNR: {b.PNR}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                          {userBookings.length} booking{userBookings.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
