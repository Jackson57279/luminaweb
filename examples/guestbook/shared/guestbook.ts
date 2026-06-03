export type Entry = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorPicture: string;
  createdAt: string;
  updatedAt: string;
};

export function cleanEntry(value: string): string {
  return value.trim().slice(0, 600);
}
