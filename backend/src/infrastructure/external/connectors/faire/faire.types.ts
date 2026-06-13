import { FaireOrder, FaireProduct } from './faire.mapper';

export type getProducts = {
  page: number;
  limit: number;
  cursor: string;
  products: FaireProduct[];
};

export type getOrders = {
  page: number;
  limit: number;
  cursor: string;
  orders: FaireOrder[];
};

type InventoryMetric = {
  type: 'QUANTITY' | 'UNTRACKED';
  quantity: number | null;
};

export type GetInventory = {
  [sku: string]: {
    on_hand_quantity: InventoryMetric;
    committed_quantity: InventoryMetric;
    available_quantity: InventoryMetric;
  };
};
