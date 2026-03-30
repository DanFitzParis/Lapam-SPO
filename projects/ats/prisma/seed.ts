// PLACEHOLDER: Full seed script needs manual creation
// See SEED-README.md for complete structure and requirements
// This PR establishes the seed infrastructure (tsx dependency + npm script)

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seed script placeholder - implement full data structure per SEED-README.md');
}

main().finally(() => prisma.$disconnect());
