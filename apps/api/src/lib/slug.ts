interface SlugLookup {
  company: {
    findUnique(args: { where: { slug: string } }): Promise<unknown>;
  };
  sinkingFund: {
    findUnique(args: { where: { slug: string } }): Promise<unknown>;
  };
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || "company";
}

// company slugs and sinking fund slugs share the same URL namespace
// (/{slug}/login, /{slug}/portal), so both must be checked to avoid a collision
export async function generateUniqueSlug(prisma: SlugLookup, base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;

  while (
    (await prisma.company.findUnique({ where: { slug: candidate } })) ||
    (await prisma.sinkingFund.findUnique({ where: { slug: candidate } }))
  ) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }

  return candidate;
}
