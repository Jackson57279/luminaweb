export type Message = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorPicture: string;
  createdAt: string;
  updatedAt: string;
};

export function cleanMessage(value: string): string {
  return value.trim().slice(0, 400);
}
