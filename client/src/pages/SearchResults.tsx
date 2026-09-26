import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchTrains, Train, getAllTrains } from "@/services/trainService";
import TrainCard from "@/components/TrainCard";
import Loader from "@/components/Loader";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Filter, ArrowRightLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface FilterState {
  minPrice: number;
  maxPrice: number;
  departureTimeFrom: number;
  departureTimeTo: number;
}

const SearchResults = () => {
  const [params] = useSearchParams();
  const [trains, setTrains] = useState<Train[]>([]);
  const [allTrainsInSystem, setAllTrainsInSystem] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "time" | "duration">("price");
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [filters, setFilters] = useState<FilterState>({
    minPrice: 0,
    maxPrice: 5000,
    departureTimeFrom: 0,
    departureTimeTo: 24,
  });
  const [maxPrice, setMaxPrice] = useState(5000);
  const { user } = useAuth();
  const navigate = useNavigate();

  const source = params.get("source") || "";
  const destination = params.get("destination") || "";
  const date = params.get("date") || new Date().toISOString().slice(0, 10);
  const quota = params.get("quota") || "GN";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [allTrains, searchedTrains] = await Promise.all([
          getAllTrains(),
          searchTrains(source, destination, date, quota),
        ]);
        setAllTrainsInSystem(allTrains);
        setTrains(searchedTrains);

        if (searchedTrains.length > 0) {
          const max = Math.max(...searchedTrains.map((t) => t.fare));
          const roundedMax = Math.max(2000, Math.ceil(max / 500) * 500);
          setMaxPrice(roundedMax);
          setFilters((f) => ({ ...f, maxPrice: roundedMax }));
        }
      } catch (error) {
        console.error("Error loading trains:", error);
        setTrains([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [source, destination, date, quota]);

  const handleBook = (train: Train) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (train.seatsAvailable < passengerCount) {
      alert(`Only ${train.seatsAvailable} seats available on this train.`);
      return;
    }

    navigate("/passenger-details", {
      state: {
        train,
        date,
        passengerCount,
        quota,
      },
    });
  };

  const calculateDurationHours = (train: Train): number => {
    try {
      const [depH, depM] = train.departureTime.split(":").map(Number);
      const [arrH, arrM] = train.arrivalTime.split(":").map(Number);
      let diff = arrH * 60 + arrM - (depH * 60 + depM);
      if (diff < 0) diff += 24 * 60;
      return diff / 60;
    } catch {
      return 4;
    }
  };

  const availableTrains = trains.filter((t) => {
    if (t.seatsAvailable <= 0) return false;
    if (t.fare < filters.minPrice || t.fare > filters.maxPrice) return false;
    const depHour = parseInt(t.departureTime.split(":")[0], 10) || 0;
    if (depHour < filters.departureTimeFrom || depHour > filters.departureTimeTo) return false;
    return true;
  });

  const sortedTrains = [...availableTrains].sort((a, b) => {
    if (sortBy === "price") return a.fare - b.fare;
    if (sortBy === "time") return parseInt(a.departureTime, 10) - parseInt(b.departureTime, 10);
    if (sortBy === "duration") return calculateDurationHours(a) - calculateDurationHours(b);
    return 0;
  });

  const resetFilters = () => {
    setFilters({
      minPrice: 0,
      maxPrice: maxPrice,
      departureTimeFrom: 0,
      departureTimeTo: 24,
    });
  };

  if (loading) return <Loader />;

  return (
    <div className="container mx-auto max-w-6xl animate-fade-in px-4 py-8">
      {/* Header Summary */}
      <div className="mb-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-2xl font-extrabold text-foreground">
              <span>{source || "All Sources"}</span>
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              <span>{destination || "All Destinations"}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Date: <span className="font-semibold text-foreground">{date}</span> • Quota: <span className="font-semibold text-foreground">{quota}</span> • <span className="text-blue-600 font-semibold">{availableTrains.length} trains ready to book</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Live SQLite Inventory Verified
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Count Selection */}
      <div className="mb-6 rounded-xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <label className="text-sm font-semibold text-foreground">Traveling Passengers</label>
          <p className="text-xs text-muted-foreground">Select total seats required for this booking</p>
        </div>
        <select
          value={passengerCount}
          onChange={(e) => setPassengerCount(Number(e.target.value))}
          className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-600"
        >
          <option value={1}>1 Passenger</option>
          <option value={2}>2 Passengers</option>
          <option value={3}>3 Passengers</option>
          <option value={4}>4 Passengers</option>
        </select>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? "block" : "hidden"} w-full md:block md:w-72`}>
          <div className="sticky top-4 rounded-xl border bg-card p-5 space-y-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Filter Search</h3>
              <button onClick={resetFilters} className="text-xs text-blue-600 hover:underline">
                Reset All
              </button>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Fare: ₹{filters.maxPrice}</label>
              <Slider
                value={[filters.maxPrice]}
                onValueChange={(val) => setFilters((f) => ({ ...f, maxPrice: val[0] }))}
                min={200}
                max={maxPrice}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹{filters.minPrice}</span>
                <span>₹{filters.maxPrice}</span>
              </div>
            </div>

            {/* Time Filter */}
            <div className="space-y-3 border-t pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Departure Window</label>
              <div className="flex items-center gap-2">
                <select
                  value={filters.departureTimeFrom}
                  onChange={(e) => setFilters((f) => ({ ...f, departureTimeFrom: Number(e.target.value) }))}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">to</span>
                <select
                  value={filters.departureTimeTo}
                  onChange={(e) => setFilters((f) => ({ ...f, departureTimeTo: Number(e.target.value) }))}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                >
                  {Array.from({ length: 25 }).map((_, i) => (
                    <option key={i} value={i}>{String(i).padStart(2, "0")}:00</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              onClick={() => setShowFilters(false)}
              variant="outline"
              size="sm"
              className="w-full md:hidden"
            >
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Train Cards List */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
              className="md:hidden gap-2"
            >
              <Filter className="h-4 w-4" /> Filters
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Sort By:</span>
              <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                <SelectTrigger className="w-44 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Fare: Low to High</SelectItem>
                  <SelectItem value="time">Departure Time</SelectItem>
                  <SelectItem value="duration">Fastest Duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedTrains.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center bg-card">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="text-base font-bold text-foreground">No Trains Match Filter Criteria</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Try expanding your price range, departure window, or clear filters to view all scheduled trains.
              </p>
              <Button onClick={resetFilters} variant="outline" size="sm" className="mt-2">
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTrains.map((t) => (
                <TrainCard
                  key={t.id}
                  train={t}
                  onBook={handleBook}
                  seatsAvailable={t.seatsAvailable}
                />
              ))}
            </div>
          )}

          {/* Alternate System Trains Recommendation */}
          {sortedTrains.length === 0 && allTrainsInSystem.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-lg font-bold mb-4">Other Available Routes in System</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {allTrainsInSystem.slice(0, 4).map((alt) => (
                  <div key={alt.id} className="rounded-xl border bg-card p-4 hover:border-blue-500 transition shadow-sm">
                    <p className="font-bold text-sm">{alt.trainName} (#{alt.trainNumber})</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alt.source} → {alt.destination} • {alt.departureTime}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-extrabold text-blue-600 text-sm">₹{alt.fare}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/search?source=${alt.source}&destination=${alt.destination}&date=${date}`)}
                      >
                        View Route
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
