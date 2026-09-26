import { api } from "@/services/api";

export interface Station {
  id: string;
  stationCode: string;
  stationName: string;
  city: string;
  state: string;
  country?: string;
}

export const getAllStations = async (): Promise<Station[]> => {
  return api.getStations();
};

export const addStation = async (data: Omit<Station, "id">) => {
  return api.addStation(data);
};

export const updateStation = async (_id: string, _data: Partial<Station>) => {
  return true;
};

export const deleteStation = async (id: string) => {
  return api.deleteStation(id);
};
