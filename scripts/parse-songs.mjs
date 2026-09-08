import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(path.join(__dirname, "raw-list.txt"), "utf-8");

const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

function titleCase(str) {
  const smallWords = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "os", "as", "em", "no", "na", "nos", "nas", "pra", "pro", "com", "sem"]);
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (word.length === 0) return word;
      if (i !== 0 && smallWords.has(word)) return word;
      // keep roman-ish / acronym tokens with apostrophes intact, just capitalize first letter of each hyphen part
      return word
        .split("-")
        .map((part) => {
          if (!part.length) return part;
          if (part[0] === "(" && part.length > 1) {
            return "(" + part[1].toUpperCase() + part.slice(2);
          }
          return part[0].toUpperCase() + part.slice(1);
        })
        .join("-");
    })
    .join(" ");
}

const songs = [];
const seen = new Set();

for (const line of lines) {
  const match = line.match(/^(\d+)\s+(.*)$/);
  if (!match) continue;
  const rest = match[2].trim();
  const dashIdx = rest.indexOf(" - ");
  let artist, title;
  if (dashIdx === -1) {
    artist = rest;
    title = "";
  } else {
    artist = rest.slice(0, dashIdx).trim();
    title = rest.slice(dashIdx + 3).trim();
  }
  artist = artist.replace(/[-\s]+$/, "").trim();
  title = title.replace(/[-\s]+$/, "").trim();

  const key = `${artist}|${title}`.toUpperCase();
  if (seen.has(key)) continue;
  seen.add(key);

  songs.push({
    id: String(songs.length + 1),
    artist: titleCase(artist),
    title: titleCase(title || artist),
    lyrics: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

const dataDir = path.join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });
writeFileSync(path.join(dataDir, "songs.json"), JSON.stringify(songs, null, 2), "utf-8");

console.log(`Parsed ${songs.length} songs (from ${lines.length} lines).`);
