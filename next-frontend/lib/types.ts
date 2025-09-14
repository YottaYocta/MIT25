export interface Trinket {
  id: string;
  owner_id: string;
  collection_id?: string | null;
  title: string;
  note: string;
  image_path: string;
  model_path: string;
  visibility: string;
  taken_at: string | null;
  created_at: string;
  image_url: string;
  model_url: string;
}
