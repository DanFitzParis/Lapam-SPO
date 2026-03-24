import { PrismaClient } from '@prisma/client';

const TENANT_SCOPED_MODELS = [
  'Job',
  'Location',
  'Application',
  'Candidate',
  'ConsentRecord',
  'PipelineEvent',
  'Message',
  'RightToWorkCheck',
  'InterviewSlot',
  'Offer',
  'TalentPoolEntry',
  'JobQueue',
  'AuditLog',
  'ScreeningQuestion',
  'ScreeningResponse',
  'LocationAssignment',
];

export function createTenantClient(tenantId: string) {
  if (!tenantId) {
    throw new Error('tenantId is required to create a tenant-scoped Prisma client');
  }

  const prisma = new PrismaClient();

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: { model?: string; operation: string; args: Record<string, any>; query: (args: any) => Promise<any> }) {
          if (!TENANT_SCOPED_MODELS.includes(model ?? '')) {
            return query(args);
          }

          const writeOps = ['create', 'createMany', 'upsert'];
          const readOps = ['findFirst', 'findMany', 'findUnique', 'count', 'aggregate'];
          const mutateOps = ['update', 'updateMany', 'delete', 'deleteMany'];

          if (writeOps.includes(operation)) {
            if (operation === 'createMany') {
              if (Array.isArray(args.data)) {
                args.data = args.data.map((item: any) => ({ ...item, tenantId }));
              } else {
                args.data = { ...args.data, tenantId };
              }
            } else {
              args.data = { ...args.data, tenantId };
            }
          }

          if (readOps.includes(operation)) {
            args.where = { ...args.where, tenantId };
          }

          if (mutateOps.includes(operation)) {
            args.where = { ...args.where, tenantId };
          }

          return query(args);
        },
      },
    },
  });
}

export type TenantPrismaClient = ReturnType<typeof createTenantClient>;
