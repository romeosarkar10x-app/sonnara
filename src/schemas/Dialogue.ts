import z from "zod";
import { EmotionSchema } from "./Emotion";

export const DialogueSchema = z
    .object({
        character: z
            .number()
            .int()
            .min(0)
            .describe(
                "Index reference to the character speaking this dialogue (corresponds to position in characters array)",
            ),
        words: z
            .array(z.string())
            .min(1)
            .describe(
                "The dialogue text split into tokens. Each token is a whitespace-delimited unit; punctuation marks are separate tokens (e.g., ['Hello', ',', 'world', '!'])",
            ),
        emotions: z
            .array(EmotionSchema)
            .default([])
            .optional()
            .describe(
                "Emotion annotations for segments of this dialogue. Must be non-overlapping but need not be contiguous or exhaustive.",
            ),
    })
    .superRefine((data, ctx) => {
        const wordCount = data.words.length;

        /* Validate emotion word indices are within bounds */
        if (data.emotions === undefined) {
            return;
        }

        data.emotions.forEach((emotion, i) => {
            if (emotion.start >= wordCount) {
                ctx.addIssue({
                    code: "custom",
                    message: `Emotion at index ${i} has 'start' ${emotion.start} which is out of bounds; valid range: [0, ${wordCount - 1}]`,
                    path: ["emotions", i, "start"],
                });
            }
            if (emotion.end >= wordCount) {
                ctx.addIssue({
                    code: "custom",
                    message: `Emotion at index ${i} has 'end' ${emotion.end} which is out of bounds; valid range: [0, ${wordCount - 1}]`,
                    path: ["emotions", i, "end"],
                });
            }
            if (emotion.start > emotion.end) {
                ctx.addIssue({
                    code: "custom",
                    message: `Emotion at index ${i} has 'start' (${emotion.start}) > 'end' (${emotion.end})`,
                    path: ["emotions", i],
                });
            }
        });

        /* Validate emotions are non-overlapping */
        const sorted = [...data.emotions].map((e, i) => ({ ...e, originalIndex: i })).sort((a, b) => a.start - b.start);

        for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            if (current.end >= next.start) {
                ctx.addIssue({
                    code: "custom",
                    message: `Emotions at indices ${current.originalIndex} and ${next.originalIndex} overlap: [${current.start}, ${current.end}] and [${next.start}, ${next.end}]`,
                    path: ["emotions"],
                });
            }
        }
    });

export type Dialogue = z.infer<typeof DialogueSchema>;
