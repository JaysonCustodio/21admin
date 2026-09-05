import type { FastifyInstance } from "fastify";
import type { Company, Prisma } from "@business-platform/db";
import type { UpdateCompanyInput } from "./schema";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export async function getCompany(app: FastifyInstance, companyId: string): Promise<Company> {
  const company = await app.prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    throw new HttpError("Company not found.", 404);
  }
  return company;
}

export function updateCompany(app: FastifyInstance, companyId: string, input: UpdateCompanyInput): Promise<Company> {
  const data: Prisma.CompanyUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.primaryColor !== undefined) data.primaryColor = input.primaryColor;
  if (input.address !== undefined) data.address = input.address;
  if (input.country !== undefined) data.country = input.country;
  if (input.defaultCurrency !== undefined) data.defaultCurrency = input.defaultCurrency;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.website !== undefined) data.website = input.website;
  if (input.industry !== undefined) data.industry = input.industry;
  if (input.taxId !== undefined) data.taxId = input.taxId;
  if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail;

  return app.prisma.company.update({ where: { id: companyId }, data });
}

export function updateCompanyLogo(app: FastifyInstance, companyId: string, logoUrl: string): Promise<Company> {
  return app.prisma.company.update({ where: { id: companyId }, data: { logoUrl } });
}
