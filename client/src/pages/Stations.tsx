import { useEffect, useState } from "react";
import { getAllStations, addStation, updateStation, deleteStation, Station } from "@/services/stationService";
import Loader from "@/components/Loader";
import { Plus, Pencil, Trash2, X, MapPin } from "lucide-react";

const emptyStation = { stationCode: "", stationName: "", city: "", state: "", country: "India" };

const Stations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState(emptyStation);

  const load = () => {
    setLoading(true);
    getAllStations().then(setStations).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSave = async () => {
    if (editing) await updateStation(editing.id, form);
    else await addStation(form as Omit<Station, "id">);
    setShowForm(false);
    setEditing(null);
    setForm(emptyStation);
    load();
  };

  const handleEdit = (s: Station) => {
    setEditing(s);
    setForm({ stationCode: s.stationCode, stationName: s.stationName, city: s.city, state: s.state, country: s.country });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this station?")) return;
    await deleteStation(id);
    load();
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto max-w-3xl animate-fade-in px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Manage Stations</h1>

      <button
        onClick={() => { setShowForm(true); setEditing(null); setForm(emptyStation); }}
        className="mb-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        <Plus className="h-4 w-4" /> Add Station
      </button>

      {showForm && (
        <div className="card-shadow mb-6 rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">{editing ? "Edit Station" : "Add Station"}</h2>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["stationCode", "stationName", "city", "state", "country"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <label className="text-xs font-medium capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</label>
                <input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            ))}
          </div>
          <button onClick={handleSave} className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editing ? "Update" : "Add"} Station
          </button>
        </div>
      )}

      <div className="space-y-3">
        {stations.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-bold">{s.stationName} <span className="text-xs text-muted-foreground">({s.stationCode})</span></p>
                <p className="text-sm text-muted-foreground">{s.city}, {s.state}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(s)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(s.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stations;
