import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const albumsRoot = path.join(projectRoot, "img", "projetos");
const outputFile = path.join(projectRoot, "js", "project-albums.js");
const ignoredDirectories = new Set(["imgGerais"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function toSlug(value) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function naturalSort(a, b) {
	return a.localeCompare(b, "pt-PT", { numeric: true, sensitivity: "base" });
}

async function buildAlbums() {
	const entries = await fs.readdir(albumsRoot, { withFileTypes: true });
	const albumDirectories = entries
		.filter((entry) => entry.isDirectory() && !ignoredDirectories.has(entry.name))
		.map((entry) => entry.name)
		.sort(naturalSort);

	const albums = [];

	for (const directoryName of albumDirectories) {
		const directoryPath = path.join(albumsRoot, directoryName);
		const photos = (await fs.readdir(directoryPath, { withFileTypes: true }))
			.filter((entry) => {
				if (!entry.isFile()) return false;
				return imageExtensions.has(path.extname(entry.name).toLowerCase());
			})
			.map((entry) => entry.name)
			.sort(naturalSort)
			.map((fileName, index) => ({
				src: `img/projetos/${directoryName}/${fileName}`.replace(/\\/g, "/"),
				alt: `${directoryName} - foto ${index + 1}`,
			}));

		if (!photos.length) continue;

		albums.push({
			id: toSlug(directoryName),
			title: directoryName,
			photos,
		});
	}

	const fileContents = `// Ficheiro gerado automaticamente por scripts/build-project-albums.mjs.
// Sempre que adicionar, remover ou renomear pastas em img/projetos, execute:
// node scripts/build-project-albums.mjs

export const PROJECT_ALBUMS = ${JSON.stringify(albums, null, "\t")};
`;

	await fs.writeFile(outputFile, fileContents, "utf8");
	console.log(`Manifesto gerado com ${albums.length} álbuns em ${outputFile}`);
}

buildAlbums().catch((error) => {
	console.error("Falha ao gerar o manifesto de álbuns:", error);
	process.exitCode = 1;
});
