import fs from "node:fs";
import path from "node:path";

export const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");
export const EMPLOYEE_PHOTOS_DIR = path.join(UPLOADS_ROOT, "employees");
export const COMPANY_LOGOS_DIR = path.join(UPLOADS_ROOT, "companies");
export const SINKING_FUND_QR_DIR = path.join(UPLOADS_ROOT, "sinking-funds");

fs.mkdirSync(EMPLOYEE_PHOTOS_DIR, { recursive: true });
fs.mkdirSync(COMPANY_LOGOS_DIR, { recursive: true });
fs.mkdirSync(SINKING_FUND_QR_DIR, { recursive: true });
