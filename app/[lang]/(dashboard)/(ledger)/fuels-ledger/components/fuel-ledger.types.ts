export type Site = { id: string; siteName: string };

export type FuelStation = {
  id: string;
  name: string;
  mobile?: string | null;
  address?: string | null;
};

export type PurchaseType = "OWN_VEHICLE" | "RENT_VEHICLE";
export type FuelType = "Diesel" | "Petrol" | "CNG" | "LPG" | "AdBlue" | "Other";

export type FuelLedgerRow = {
  id: string;
  entryDate: string; // ✅ always ISO string

  fuelStationId?: string | null;
  fuelStation?: { id: string; name: string } | null;

  siteId?: string | null;
  site?: { id: string; siteName: string } | null;

  slipNo?: string | null;
  through?: string | null;

  purchaseType?: PurchaseType | string | null;

  vehicleNumber?: string | null;
  vehicleName?: string | null;

  fuelType?: FuelType | string | null;

  qty?: number | null;
  rate?: number | null;
  amount?: number | null;

  remarks?: string | null;

  createdAt?: string;
  updatedAt?: string;
};
