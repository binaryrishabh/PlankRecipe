import { z } from "zod";

// simple validation for the incoming request body
export const createRecipeSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
  // optional escape hatch — forces a fresh scrape even when we have a cached
  // bundle. the history strip uses it for its re-scrape button
  refresh: z.boolean().optional(),
});