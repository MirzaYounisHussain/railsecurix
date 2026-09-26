import { api } from "@/services/api";

export interface Train {
  id: string;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  sourceStation?: string;
  destStation?: string;
  departureTime: string;
  arrivalTime: string;
  duration?: string;
  fare: number;
  totalSeats: number;
  seatsAvailable: number;
  availableClasses?: string[];
  runsOn?: string[];
  availabilityMatrix?: any[];
}

export interface TrainSchedule {
  id: string;
  trainId: string;
  trainNumber?: string;
  date: string;
  totalSeats?: number;
  seatsAvailable: number;
  isActive: boolean;
}

export const getAllTrains = async (): Promise<Train[]> => {
  return api.searchTrains("", "");
};

export const searchTrains = async (source: string, destination: string, date?: string, quota?: string): Promise<Train[]> => {
  return api.searchTrains(source, destination, date, quota);
};

export const getTrain = async (trainId: string): Promise<Train> => {
  return api.getTrain(trainId);
};

export const addTrain = async (_data: any): Promise<boolean> => {
  return true;
};

export const updateTrain = async (_id: string, _data: any): Promise<boolean> => {
  return true;
};

export const deleteTrain = async (_id: string): Promise<boolean> => {
  return true;
};

export const getTrainSchedules = async (trainId: string): Promise<TrainSchedule[]> => {
  const dates: TrainSchedule[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      id: `${trainId}-${d.toISOString().slice(0, 10)}`,
      trainId,
      date: d.toISOString().slice(0, 10),
      seatsAvailable: 42 - i * 3,
      isActive: true,
      totalSeats: 72,
    });
  }
  return dates;
};

export const getSchedulesForDate = async (date: string): Promise<TrainSchedule[]> => {
  const trains = await getAllTrains();
  return trains.map((t) => ({
    id: `${t.id}-${date}`,
    trainId: t.id,
    date,
    seatsAvailable: t.seatsAvailable,
    isActive: true,
    totalSeats: t.totalSeats,
  }));
};

export const addTrainSchedule = async (_data: any): Promise<boolean> => {
  return true;
};

export const updateTrainSchedule = async (_id: string, _data: any): Promise<boolean> => {
  return true;
};

export const deleteTrainSchedule = async (_id: string): Promise<boolean> => {
  return true;
};

export const regenerateSchedulesFor30Days = async (_trainId: string, _train: Train): Promise<boolean> => {
  return true;
};
