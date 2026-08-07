import { z } from "zod";

const entityKind = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const repositoryPattern = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => !value.startsWith("/") && !value.includes("\\") && !/(^|\/)\.\.(\/|$)/.test(value),
    "must be a forward-slash, repository-relative path or pattern",
  );

export const coverageScopeSchema = z
  .object({
    include: z.array(repositoryPattern),
    exclude: z.array(repositoryPattern),
    entities: z.array(entityKind),
  })
  .strict();

export const configSchema = z
  .object({
    schema: z.literal(1),
    coverage: z
      .object({
        code: coverageScopeSchema,
        tests: coverageScopeSchema,
      })
      .strict(),
    inventory: z
      .object({
        rules: z.array(repositoryPattern).optional(),
        astGrepConfig: repositoryPattern.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type SourceTwinConfig = z.infer<typeof configSchema>;
export type CoverageScopeConfig = z.infer<typeof coverageScopeSchema>;
