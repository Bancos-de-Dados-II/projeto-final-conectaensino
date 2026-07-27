export type FieldType = "text" | "email" | "number" | "textarea";

export interface CrudField {
  key: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
}

export interface CrudEntity {
  id: string;
  [key: string]: unknown;
}

export interface CrudResourceConfig {
  title: string;
  description: string;
  singular: string;
  endpoint: string;
  fields: CrudField[];
  searchableFields: string[];
}
