import z from "zod";
import { CharacterSchema } from "./Character";
import { SceneSchema } from "./Scene";
import { DialogueSchema } from "./Dialogue";
import { EpisodeSchema } from "./Episode";
import { BackgroundMusicSchema } from "./BackgroundMusic";
import { SoundEffectSchema } from "./SoundEffect";
import type { AudioPosition } from "./AudioPosition";

/**
 * Validates that an AudioPosition is within bounds of the dialogues array.
 * Returns an error message string if invalid, or null if valid.
 */
function validateAudioPosition(
    position: AudioPosition,
    dialogues: z.infer<typeof DialogueSchema>[],
    label: string,
): string | null {
    if (position.dialogue < 0 || position.dialogue >= dialogues.length) {
        return `${label} references invalid dialogue index ${position.dialogue}; valid range: [0, ${dialogues.length - 1}]`;
    }
    const wordCount = dialogues[position.dialogue].words.length;
    const maxGap = wordCount; /* N words = N+1 gaps (indices 0 to N) */
    if (position.gap < 0 || position.gap > maxGap) {
        return `${label} references invalid gap index ${position.gap} for dialogue ${position.dialogue} which has ${wordCount} words; valid gap range: [0, ${maxGap}]`;
    }
    return null;
}

export const AudioBookSchema = z
    .object({
        name: z.string(),
        plot: z.string(),
        genre: z.array(z.string()),
        characters: z.array(CharacterSchema).describe("List of all characters appearing in the audiobook"),
        episodes: z.array(EpisodeSchema).describe("List of episodes that structure the audiobook content"),
        scenes: z.array(SceneSchema).describe("List of scenes that make up the audiobook narrative"),
        dialogues: z.array(DialogueSchema).describe("Sequential list of all dialogue entries in the audiobook"),
        music: z
            .array(BackgroundMusicSchema)
            .default([])
            .optional()
            .describe("Background music layers. Should generally not overlap with each other."),
        soundEffects: z
            .array(SoundEffectSchema)
            .default([])
            .optional()
            .describe("Sound effect layers. Can freely overlap with each other and with music."),
    })
    .superRefine((data, ctx) => {
        const numCharacters = data.characters.length;
        const numDialogues = data.dialogues.length;
        const numScenes = data.scenes.length;

        /* ──────────────────────────────────────────────
         * Validate character indices in dialogues
         * ────────────────────────────────────────────── */
        data.dialogues.forEach((dialogue, i) => {
            if (dialogue.character < 0 || dialogue.character >= numCharacters) {
                ctx.addIssue({
                    code: "custom",
                    message: `Dialogue at index ${i} references invalid character index ${dialogue.character}; valid range: [0, ${numCharacters - 1}]`,
                    path: ["dialogues", i, "character"],
                });
            }
        });

        /* ──────────────────────────────────────────────
         * Validate scene dialogue indices
         * ────────────────────────────────────────────── */
        data.scenes.forEach((scene, i) => {
            if (scene.dialogueBegin >= numDialogues) {
                ctx.addIssue({
                    code: "custom",
                    message: `Scene at index ${i} has dialogueBegin ${scene.dialogueBegin} which is out of bounds; valid range: [0, ${numDialogues - 1}]`,
                    path: ["scenes", i, "dialogueBegin"],
                });
            }
            if (scene.dialogueEnd >= numDialogues) {
                ctx.addIssue({
                    code: "custom",
                    message: `Scene at index ${i} has dialogueEnd ${scene.dialogueEnd} which is out of bounds; valid range: [0, ${numDialogues - 1}]`,
                    path: ["scenes", i, "dialogueEnd"],
                });
            }
            if (scene.dialogueBegin > scene.dialogueEnd) {
                ctx.addIssue({
                    code: "custom",
                    message: `Scene at index ${i} has dialogueBegin (${scene.dialogueBegin}) > dialogueEnd (${scene.dialogueEnd})`,
                    path: ["scenes", i],
                });
            }
        });

        /* Validate scenes are contiguous (inclusive end convention) */
        for (let i = 0; i < numScenes - 1; i++) {
            const curr = data.scenes[i];
            const next = data.scenes[i + 1];

            if (curr.dialogueEnd + 1 !== next.dialogueBegin) {
                ctx.addIssue({
                    code: "custom",
                    message: `Scene at index ${i} ends at dialogue ${curr.dialogueEnd} but next scene at index ${i + 1} begins at dialogue ${next.dialogueBegin}; expected ${curr.dialogueEnd + 1}`,
                    path: ["scenes", i + 1, "dialogueBegin"],
                });
            }
        }

        /* ──────────────────────────────────────────────
         * Validate episode scene indices
         * ────────────────────────────────────────────── */
        data.episodes.forEach((episode, i) => {
            if (episode.sceneBegin >= numScenes) {
                ctx.addIssue({
                    code: "custom",
                    message: `Episode at index ${i} has sceneBegin ${episode.sceneBegin} which is out of bounds; valid range: [0, ${numScenes - 1}]`,
                    path: ["episodes", i, "sceneBegin"],
                });
            }
            if (episode.sceneEnd >= numScenes) {
                ctx.addIssue({
                    code: "custom",
                    message: `Episode at index ${i} has sceneEnd ${episode.sceneEnd} which is out of bounds; valid range: [0, ${numScenes - 1}]`,
                    path: ["episodes", i, "sceneEnd"],
                });
            }
            if (episode.sceneBegin > episode.sceneEnd) {
                ctx.addIssue({
                    code: "custom",
                    message: `Episode at index ${i} has sceneBegin (${episode.sceneBegin}) > sceneEnd (${episode.sceneEnd})`,
                    path: ["episodes", i],
                });
            }
        });

        /* Validate episodes are contiguous */
        for (let i = 0; i < data.episodes.length - 1; i++) {
            const curr = data.episodes[i];
            const next = data.episodes[i + 1];

            if (curr.sceneEnd + 1 !== next.sceneBegin) {
                ctx.addIssue({
                    code: "custom",
                    message: `Episode at index ${i} ends at scene ${curr.sceneEnd} but next episode at index ${i + 1} begins at scene ${next.sceneBegin}; expected ${curr.sceneEnd + 1}`,
                    path: ["episodes", i + 1, "sceneBegin"],
                });
            }
        }

        /* ──────────────────────────────────────────────
         * Validate music AudioPosition references
         * ────────────────────────────────────────────── */
        data.music.forEach((track, i) => {
            const startErr = validateAudioPosition(track.start, data.dialogues, `Music at index ${i} 'start'`);
            if (startErr) {
                ctx.addIssue({
                    code: "custom",
                    message: startErr,
                    path: ["music", i, "start"],
                });
            }

            const endErr = validateAudioPosition(track.end, data.dialogues, `Music at index ${i} 'end'`);
            if (endErr) {
                ctx.addIssue({
                    code: "custom",
                    message: endErr,
                    path: ["music", i, "end"],
                });
            }
        });

        /* TODO: Add non-overlap validation for background music */

        /* ──────────────────────────────────────────────
         * Validate sound effect AudioPosition references
         * ────────────────────────────────────────────── */
        data.soundEffects.forEach((sfx, i) => {
            const startErr = validateAudioPosition(sfx.start, data.dialogues, `Sound effect at index ${i} 'start'`);
            if (startErr) {
                ctx.addIssue({
                    code: "custom",
                    message: startErr,
                    path: ["soundEffects", i, "start"],
                });
            }

            const endErr = validateAudioPosition(sfx.end, data.dialogues, `Sound effect at index ${i} 'end'`);
            if (endErr) {
                ctx.addIssue({
                    code: "custom",
                    message: endErr,
                    path: ["soundEffects", i, "end"],
                });
            }
        });
    });
