import { Queue, Worker } from "bullmq";
import { connection } from "./connection";

export const reportExportQueue = new Queue("report-export", { connection });

export const reportExportWorker = new Worker(
  "report-export",
  async (job) => {
    // TODO: generate report export for job.data
  },
  { connection }
);
