import path from "node:path";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";

function getBaseURL(): string {
    const githubRepository = process.env.GITHUB_REPOSITORY;

    if (githubRepository === undefined) {
        return "/";
    }

    const [, repo] = githubRepository.split("/");
    return `/${repo}`;
}

export default defineConfig({
    base: getBaseURL(),
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],

    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
});
