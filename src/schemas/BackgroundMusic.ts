import z from "zod";
import { AudioPositionSchema } from "./AudioPosition";

/**
 * Represents a background music layer spanning a range of the dialogue timeline.
 *
 * Music uses gap-based positioning (AudioPosition) for precise placement.
 * Both start and end positions are inclusive.
 *
 * Background music entries should generally not overlap with each other,
 * though this is not enforced at the schema level.
 *
 * TODO: Add non-overlap validation for background music in AudioBook.superRefine
 */
export const BackgroundMusicSchema = z
    .object({
        prompt: z
            .string()
            .describe(
                "Detailed text prompt for AI music generation or human production. Should include all relevant information: mood, genre, tempo, instruments, intensity, style, and any other characteristics needed to produce the track (e.g., 'Gentle acoustic guitar with soft piano, melancholic and reflective, slow tempo around 70 BPM, minimal percussion, fading in gradually')",
            ),
        start: AudioPositionSchema.describe("Position where this music begins (inclusive)"),
        end: AudioPositionSchema.describe("Position where this music ends (inclusive)"),
    })
    .superRefine((data, ctx) => {
        /* Validate start is before or equal to end */
        if (
            data.start.dialogue > data.end.dialogue ||
            (data.start.dialogue === data.end.dialogue && data.start.gap > data.end.gap)
        ) {
            ctx.addIssue({
                code: "custom",
                message: `Music 'start' (dialogue: ${data.start.dialogue}, gap: ${data.start.gap}) is after 'end' (dialogue: ${data.end.dialogue}, gap: ${data.end.gap})`,
                path: ["start"],
            });
        }
    });

export type BackgroundMusic = z.infer<typeof BackgroundMusicSchema>;
