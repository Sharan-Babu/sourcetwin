import { z } from "zod";

const logicId = z.string().regex(/^[a-z][a-z0-9]*(?:\.[a-z0-9]+)*$/);
const termId = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const sourceReference = z.string().trim().min(1);

export const logicFrontmatterSchema = z
  .object({
    id: logicId,
    source: z
      .object({
        code: z.array(sourceReference).min(1),
        tests: z.array(sourceReference).optional(),
      })
      .strict(),
  })
  .strict();

export const termFrontmatterSchema = z.object({ id: termId }).strict();

export type LogicFrontmatter = z.infer<typeof logicFrontmatterSchema>;
export type TermFrontmatter = z.infer<typeof termFrontmatterSchema>;
