import { Model } from '.';

export interface NewBookmark {
  name: string;
  url: string;
  categoryId: number;
  icon: string;
  isPublic: boolean;
  description?: string;
}

export interface Bookmark extends Model, NewBookmark {
  orderId: number;
}
