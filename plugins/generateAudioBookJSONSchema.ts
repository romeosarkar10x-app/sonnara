import type { Plugin } from "vite";
import { AudioBookSchema } from "../src/schemas/AudioBook";

const generateAudioBookJSONSchemaPlugin = (): Plugin => {
    return {
        name: "generate-audio-book-json-schema",
        buildEnd: function (err) {
            if (err !== undefined) {
                return;
            }

            const jsonSchema = AudioBookSchema.toJSONSchema();
            const code = JSON.stringify(jsonSchema);

            this.emitFile({ fileName: "schema.json", type: "prebuilt-chunk", code });
        },
    };
};

export default generateAudioBookJSONSchemaPlugin;
