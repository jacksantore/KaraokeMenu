export interface Song {
  id: string;
  code: number;
  artist: string;
  title: string;
  lyrics: string;
  createdAt: string;
  updatedAt: string;
}

export type SongInput = Pick<Song, "code" | "artist" | "title" | "lyrics">;
