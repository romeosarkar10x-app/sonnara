import z from "zod";
import { AudioPositionSchema } from "./AudioPosition";

/**
 * Represents a sound effect layer spanning a range of the dialogue timeline.
 *
 * Sound effects use gap-based positioning (AudioPosition) for precise placement.
 * Both start and end positions are inclusive.
 *
 * Multiple sound effects can freely overlap with each other.
 * Sound effects can also overlap with background music (they are on separate layers).
 */
export const SoundEffectSchema = z
    .object({
        prompt: z
            .string()
            .describe(
                "Detailed text prompt for AI sound effect generation or human production. Should describe the sound clearly: type, intensity, duration characteristics, spatial qualities, and any other details needed (e.g., 'Heavy wooden door creaking open slowly, echoing in a large stone hall', 'Distant thunder rumble, low and sustained, gradually fading')",
            ),
        start: AudioPositionSchema.describe("Position where this sound effect begins (inclusive)"),
        end: AudioPositionSchema.describe("Position where this sound effect ends (inclusive)"),
    })
    .superRefine((data, ctx) => {
        /* Validate start is before or equal to end */
        if (
            data.start.dialogue > data.end.dialogue ||
            (data.start.dialogue === data.end.dialogue && data.start.gap > data.end.gap)
        ) {
            ctx.addIssue({
                code: "custom",
                message: `Sound effect 'start' (dialogue: ${data.start.dialogue}, gap: ${data.start.gap}) is after 'end' (dialogue: ${data.end.dialogue}, gap: ${data.end.gap})`,
                path: ["start"],
            });
        }
    });

export type SoundEffectType = z.infer<typeof SoundEffectSchema>;
