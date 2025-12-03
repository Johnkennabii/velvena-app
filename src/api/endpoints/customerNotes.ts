import { httpClient } from "../httpClient";

export interface CustomerNote {
  id: string;
  customer_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

type CustomerNotePayload = {
  content: string;
};

const normalizeList = (response: any): CustomerNote[] => {
  const raw = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  return (raw as CustomerNote[]).filter((note) => !note.deleted_at);
};

const normalizeObject = (response: any): CustomerNote => {
  if (response?.data && typeof response.data === "object") {
    return response.data as CustomerNote;
  }
  return response as CustomerNote;
};

export const CustomerNotesAPI = {
  listByCustomer: async (customerId: string): Promise<CustomerNote[]> => {
    const res = await httpClient.get(`/customer-notes/customer/${customerId}`);
    return normalizeList(res);
  },

  getById: async (noteId: string): Promise<CustomerNote> => {
    const res = await httpClient.get(`/customer-notes/${noteId}`);
    return normalizeObject(res);
  },

  create: async (customerId: string, payload: CustomerNotePayload): Promise<CustomerNote> => {
    const res = await httpClient.post(`/customer-notes/customer/${customerId}`, payload);
    return normalizeObject(res);
  },

  update: async (noteId: string, payload: CustomerNotePayload): Promise<CustomerNote> => {
    const res = await httpClient.put(`/customer-notes/${noteId}`, payload);
    return normalizeObject(res);
  },

  softDelete: async (noteId: string): Promise<CustomerNote> => {
    const res = await httpClient.patch(`/customer-notes/${noteId}`);
    return normalizeObject(res);
  },

  delete: async (noteId: string): Promise<void> => {
    await httpClient.delete(`/customer-notes/${noteId}`);
  },
};
