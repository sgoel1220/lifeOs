import { z } from "zod";

export const CreateDumpSchema = z.object({
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional().default([]),
});

export type CreateDumpInput = z.infer<typeof CreateDumpSchema>;

export const UpdateItemSchema = z.object({
  status: z.enum(["PENDING", "DONE", "ARCHIVED"]),
});

export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
