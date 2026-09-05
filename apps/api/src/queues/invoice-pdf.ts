import { Queue, Worker } from "bullmq";
import { connection } from "./connection";

export const invoicePdfQueue = new Queue("invoice-pdf", { connection });

export const invoicePdfWorker = new Worker(
  "invoice-pdf",
  async (job) => {
    // TODO: render invoice PDF for job.data.invoiceId
  },
  { connection }
);
