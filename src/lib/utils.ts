import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Define UserRole here or import from AuthContext
export type UserRole = 'admin' | 'diretoria' | 'solicitante' | 'portaria' | null;

export interface UserRecord {
  password: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}
