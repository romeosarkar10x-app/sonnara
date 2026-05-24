import z from "zod";

/**
 * Represents an emotion annotation on a range of words within a single dialogue.
 *
 * Emotions use word indices (not gap indices) since they describe
 * *which words* are spoken with a given emotion.
 *
 * Both start and end are inclusive.
 * For words ["How", "are", "you", "?"], an emotion covering "are you" would be { start: 1, end: 2 }.
 *
 * Emotions within a dialogue must be non-overlapping, but need not be contiguous or exhaustive.
 */
export const EmotionSchema = z.object({
    text: z
        .string()
        .describe(
            "Detailed description of the emotion, tone, or delivery style for this segment (e.g., 'soft and melancholic, voice trembling slightly', 'excited and breathless with rising pitch')",
        ),
    start: z.number().int().min(0).describe("Starting word index (inclusive)"),
    end: z.number().int().min(0).describe("Ending word index (inclusive)"),
});

export type EmotionType = z.infer<typeof EmotionSchema>;
