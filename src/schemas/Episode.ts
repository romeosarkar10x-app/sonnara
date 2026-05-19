import z from "zod";

export const EpisodeSchema = z.object({
    name: z.string().describe("Title or name of the episode"),
    description: z.string().describe("Summary or description of what happens in this episode"),
    sceneBegin: z.number().int().min(0).describe("Starting scene index for this episode (inclusive)"),
    sceneEnd: z.number().int().min(0).describe("Ending scene index for this episode (inclusive)"),
});

export type Episode = z.infer<typeof EpisodeSchema>;
