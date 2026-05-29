import { getAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID ?? "1";

// Превращает ответ DRF в читаемое сообщение: {"detail": "..."} или
// ошибки по полям {"password": ["Too short."], ...}.
function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const obj = body as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    const parts: string[] = [];
    for (const [field, value] of Object.entries(obj)) {
      const text = Array.isArray(value) ? value.join(" ") : String(value);
      parts.push(field === "non_field_errors" ? text : `${field}: ${text}`);
    }
    if (parts.length) return parts.join(" · ");
  }
  return `HTTP ${status}`;
}

async function request<T>(path: string, init: RequestInit, headers: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...headers, ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(extractMessage(body, res.status)) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

const apiFetch = <T>(path: string, init: RequestInit = {}): Promise<T> =>
  request<T>(path, init, { "Clinic-Id": CLINIC_ID });

const authFetch = <T>(path: string, init: RequestInit = {}): Promise<T> =>
  request<T>(path, init, { Authorization: `Bearer ${getAccessToken()}` });

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  username?: string;
}

export interface Slot {
  id: number;
  starts_at: string;
  duration_minutes: number;
  status: "free" | "booked";
}

export interface Appointment {
  id: number;
  slot: Slot & { doctor?: { name: string } };
  patient_name: string;
  patient_phone: string;
  created_at: string;
}

export interface AdminSlot extends Slot {
  patient_name: string | null;
  patient_phone: string | null;
}

export interface Me {
  username: string;
  role: "superadmin" | "clinic_admin" | "doctor" | null;
  clinic: { id: number; name: string } | null;
  doctor_id?: number | null;
}

export interface Clinic {
  id: number;
  name: string;
  doctors_count: number;
}

export interface ClinicAdmin {
  id: number;
  username: string;
  clinic: string;
  clinic_id: number;
}

// Public
export const getDoctors = () => apiFetch<Doctor[]>("/api/doctors/");
export const getSlots = (doctorId: number, date: string) =>
  apiFetch<Slot[]>(`/api/doctors/${doctorId}/slots/?date=${date}`);
export const bookAppointment = (data: {
  slot_id: number;
  patient_name: string;
  patient_phone: string;
}) => apiFetch<Appointment>("/api/appointments/", { method: "POST", body: JSON.stringify(data) });

// Auth
export const getMe = () => authFetch<Me>("/api/auth/me/");

// Super Admin
export const superGetClinics = () => authFetch<Clinic[]>("/api/superadmin/clinics/");
export const superCreateClinic = (data: { name: string }) =>
  authFetch<Clinic>("/api/superadmin/clinics/", { method: "POST", body: JSON.stringify(data) });
export const superGetAdmins = () => authFetch<ClinicAdmin[]>("/api/superadmin/admins/");
export const superCreateAdmin = (data: { clinic_id: number; username: string; password: string }) =>
  authFetch<ClinicAdmin>("/api/superadmin/admins/", { method: "POST", body: JSON.stringify(data) });

// Clinic Admin
export const adminGetDoctors = () => authFetch<Doctor[]>("/api/admin/doctors/");
export const adminCreateDoctor = (data: {
  name: string;
  specialization: string;
  username: string;
  password: string;
}) => authFetch<Doctor>("/api/admin/doctors/", { method: "POST", body: JSON.stringify(data) });
export const adminDeleteDoctor = (id: number) =>
  authFetch<void>(`/api/admin/doctors/${id}/`, { method: "DELETE" });
export const adminGetDoctorSlots = (doctorId: number, date: string) =>
  authFetch<AdminSlot[]>(`/api/admin/doctors/${doctorId}/slots/?date=${date}`);
export const adminGetAppointments = () => authFetch<Appointment[]>("/api/admin/appointments/");
export const adminCreateAppointment = (data: {
  slot_id: number;
  patient_name: string;
  patient_phone: string;
}) => authFetch<Appointment>("/api/admin/appointments/", { method: "POST", body: JSON.stringify(data) });

// Doctor
export const doctorGetSlots = (date?: string) =>
  authFetch<Slot[]>(`/api/doctor/slots/${date ? `?date=${date}` : ""}`);
export const doctorCreateSlot = (data: { starts_at: string; duration_minutes: number }) =>
  authFetch<Slot>("/api/doctor/slots/", { method: "POST", body: JSON.stringify(data) });
export const doctorDeleteSlot = (id: number) =>
  authFetch<void>(`/api/doctor/slots/${id}/`, { method: "DELETE" });
export const doctorGetAppointments = () => authFetch<Appointment[]>("/api/doctor/appointments/");
