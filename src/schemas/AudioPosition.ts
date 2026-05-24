import z from "zod";

/**
 * Represents a precise position within the dialogue timeline using gap indices.
 *
 * For a dialogue with words [a, b, c, d], the gap positions are:
 *   $0  a  $1  b  $2  c  $3  d  $4
 *
 * Note: The last gap of dialogue N is semantically equivalent to gap 0 of dialogue N+1.
 * Both representations are valid for the same point in time.
 */
export const AudioPositionSchema = z.object({
    dialogue: z.number().int().min(0).describe("Index into the dialogues array"),
    gap: z
        .number()
        .int()
        .min(0)
        .describe(
            "Gap index within the dialogue's words. For a dialogue with N words, valid gap indices are 0 to N (inclusive). Gap 0 is before the first word, gap N is after the last word.",
        ),
});

export type AudioPositionType = z.infer<typeof AudioPositionSchema>;
