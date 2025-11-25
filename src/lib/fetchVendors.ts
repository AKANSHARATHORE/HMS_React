// Utility to fetch vendors for dropdown
import { API_BASE_URL } from "@/config/api";

export async function fetchVendors() {
  try {
    const response = await fetch(`${API_BASE_URL}/getAllVendors`);
    const result = await response.json();
    if (result.statusCode === 200 && Array.isArray(result.payload)) {
      return result.payload.map((vendor) => ({
        value: vendor.vendorId,
        label: vendor.vendorName
      }));
    }
    return [];
  } catch {
    return [];
  }
}
