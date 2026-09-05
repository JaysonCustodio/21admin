import { Queue, Worker } from "bullmq";
import { connection } from "./connection";

export const payrollRunQueue = new Queue("payroll-run", { connection });

export const payrollRunWorker = new Worker(
  "payroll-run",
  async (job) => {
    // TODO: compute payroll for job.data.companyId / period
  },
  { connection }
);
