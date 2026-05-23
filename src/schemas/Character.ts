import z from "zod";

export const CharacterSchema = z.object({
    name: z.string().max(64).describe("Character's name (maximum 64 characters)"),
    gender: z.enum(["MALE", "FEMALE"]),
    ageGroup: z
        .tuple([z.number().min(6), z.number().max(96)])
        .describe("Character's age range as [minimum age, maximum age], where min is at least 6 and max is at most 96"),
    description: z
        .string()
        .describe("Detailed description of the character's appearance, personality, and role in the story"),
    voiceDescription: z
        .string()
        .describe("Description of the character's voice characteristics (tone, accent, pitch, speaking style, etc.)"),
});
