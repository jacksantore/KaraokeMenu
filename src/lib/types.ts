export interface Song {
  id: string;
  artist: string;
  title: string;
  lyrics: string;
  createdAt: string;
  updatedAt: string;
}

export type SongInput = Pick<Song, "artist" | "title" | "lyrics">;
