import { useEffect, useState, type ChangeEvent } from "react";
import type { EmploymentType, ShiftSchedule, Currency } from "@business-platform/shared-types";
import { CURRENCIES } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

export interface EmployeeFormValues {
  fullName: string;
  email: string;
  companyEmail: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  position: string;
  department: string;
  employmentType: EmploymentType | "";
  shiftSchedule: ShiftSchedule | "";
  hireDate: string;
  baseSalary: string;
  baseSalaryCurrency: Currency;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
}

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERN: "Intern",
};

export const SHIFT_SCHEDULE_LABELS: Record<ShiftSchedule, string> = {
  DAY_SHIFT: "Day shift",
  NIGHT_SHIFT: "Night shift",
  MID_SHIFT: "Mid shift",
};

function TextField({
  id,
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </div>
  );
}

const OTHER_BANK_VALUE = "__other__";

function BankNameField({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [banks, setBanks] = useState<string[] | null>(null);
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ banks: string[] }>("/api/reference/banks")
      .then((data) => setBanks(data.banks))
      .catch(() => setBanks([]));
  }, []);

  useEffect(() => {
    if (banks && value && !banks.includes(value)) {
      setIsCustom(true);
    }
  }, [banks, value]);

  const selectValue = isCustom ? OTHER_BANK_VALUE : value;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        Bank name
      </label>
      <select
        id={id}
        value={banks === null ? "" : selectValue}
        onChange={(e) => {
          if (e.target.value === OTHER_BANK_VALUE) {
            setIsCustom(true);
            onChange("");
          } else {
            setIsCustom(false);
            onChange(e.target.value);
          }
        }}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">{banks === null ? "Loading…" : "Select…"}</option>
        {banks?.map((bank) => (
          <option key={bank} value={bank}>
            {bank}
          </option>
        ))}
        <option value={OTHER_BANK_VALUE}>Other (not listed)</option>
      </select>
      {isCustom && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter bank name"
          autoFocus
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      )}
    </div>
  );
}

export function EmployeeFormFields({
  values,
  onChange,
  idPrefix = "",
}: {
  values: EmployeeFormValues;
  onChange: (patch: Partial<EmployeeFormValues>) => void;
  idPrefix?: string;
}) {
  function field(key: keyof EmployeeFormValues) {
    return (e: ChangeEvent<HTMLInputElement>) => onChange({ [key]: e.target.value } as Partial<EmployeeFormValues>);
  }

  const id = (name: string) => `${idPrefix}${name}`;

  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Basic information</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id={id("fullName")} label="Full name" required value={values.fullName} onChange={field("fullName")} placeholder="Jane Doe" />
          <TextField id={id("email")} label="Personal email" type="email" value={values.email} onChange={field("email")} placeholder="jane@personal.com" />
          <TextField
            id={id("companyEmail")}
            label="Company email"
            type="email"
            value={values.companyEmail}
            onChange={field("companyEmail")}
            placeholder="jane@acme.com"
          />
          <TextField id={id("phone")} label="Phone" type="tel" value={values.phone} onChange={field("phone")} placeholder="+1 555 000 0000" />
          <TextField id={id("dateOfBirth")} label="Date of birth" type="date" value={values.dateOfBirth} onChange={field("dateOfBirth")} />
          <TextField id={id("address")} label="Address" value={values.address} onChange={field("address")} placeholder="123 Main St, City" />
        </div>
        {(values.companyEmail || values.email) && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            A portal login will be created automatically using the company email (or personal email if no company email is
            given) so the employee can sign in.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Employment details</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField id={id("position")} label="Position" value={values.position} onChange={field("position")} placeholder="Software Engineer" />
          <TextField id={id("department")} label="Department" value={values.department} onChange={field("department")} placeholder="Engineering" />
          <div>
            <label htmlFor={id("employmentType")} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Employment type
            </label>
            <select
              id={id("employmentType")}
              value={values.employmentType}
              onChange={(e) => onChange({ employmentType: e.target.value as EmploymentType | "" })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Select…</option>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={id("shiftSchedule")} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Shift schedule
            </label>
            <select
              id={id("shiftSchedule")}
              value={values.shiftSchedule}
              onChange={(e) => onChange({ shiftSchedule: e.target.value as ShiftSchedule | "" })}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Select…</option>
              {Object.entries(SHIFT_SCHEDULE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <TextField id={id("hireDate")} label="Hire date" type="date" value={values.hireDate} onChange={field("hireDate")} />
          <div>
            <label htmlFor={id("baseSalary")} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Base salary
            </label>
            <div className="mt-1 flex gap-2">
              <select
                aria-label="Salary currency"
                value={values.baseSalaryCurrency}
                onChange={(e) => onChange({ baseSalaryCurrency: e.target.value as Currency })}
                className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
              <input
                id={id("baseSalary")}
                type="number"
                min={0}
                value={values.baseSalary}
                onChange={field("baseSalary")}
                placeholder="60000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Emergency contact</h3>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            id={id("emergencyContactName")}
            label="Contact name"
            value={values.emergencyContactName}
            onChange={field("emergencyContactName")}
            placeholder="John Doe"
          />
          <TextField
            id={id("emergencyContactPhone")}
            label="Contact phone"
            type="tel"
            value={values.emergencyContactPhone}
            onChange={field("emergencyContactPhone")}
            placeholder="+1 555 000 0000"
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Bank details</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Used for payroll disbursement.</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BankNameField id={id("bankName")} value={values.bankName} onChange={(bankName) => onChange({ bankName })} />
          <TextField
            id={id("bankAccountHolderName")}
            label="Account holder name"
            value={values.bankAccountHolderName}
            onChange={field("bankAccountHolderName")}
            placeholder="Jane Doe"
          />
          <TextField
            id={id("bankAccountNumber")}
            label="Account number"
            value={values.bankAccountNumber}
            onChange={field("bankAccountNumber")}
            placeholder="000123456789"
          />
        </div>
      </div>
    </>
  );
}
