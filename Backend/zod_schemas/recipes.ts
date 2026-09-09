import { z } from "zod";

// simple validation for the incoming request body
export const createRecipeSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
});