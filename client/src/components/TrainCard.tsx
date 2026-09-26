import { Train as TrainType } from "@/services/trainService";
import { Clock, Users, IndianRupee } from "lucide-react";

interface Props {
  train: TrainType;
  onBook: (train: TrainType) => void;
  seatsAvailable?: number; // Override seats for date-specific availability
}

const TrainCard = ({ train, onBook, seatsAvailable }: Props) => {
  const availableSeats = seatsAvailable !== undefined ? seatsAvailable : train.seatsAvailable;
  
  return (
    <div className="card-shadow animate-fade-in rounded-xl border bg-card p-5 transition-all hover:card-shadow-hover">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-bold text-foreground">{train.trainName}</h3>
          <p className="text-xs font-medium text-muted-foreground">#{train.trainNumber}</p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{train.departureTime}</p>
            <p className="text-xs text-muted-foreground">{train.source}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-px w-16 bg-border" />
            <Clock className="mt-1 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{train.arrivalTime}</p>
            <p className="text-xs text-muted-foreground">{train.destination}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="flex items-center gap-0.5 text-lg font-bold text-foreground">
              <IndianRupee className="h-4 w-4" />
              {train.fare}
            </p>
            <p className="text-xs text-muted-foreground">per seat</p>
          </div>
          <div className="text-center">
            <p className="flex items-center gap-1 text-sm font-medium">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={availableSeats > 0 ? "text-success" : "text-destructive"}>
                {availableSeats}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">seats</p>
          </div>
          <button
            onClick={() => onBook(train)}
            disabled={availableSeats <= 0}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainCard;
