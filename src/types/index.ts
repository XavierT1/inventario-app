export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  created_at: string;
  updated_at: string;
  fraccionable?: boolean;
  cantidad_por_empaque?: number | null;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: 'entrada' | 'salida';
  quantity: number;
  cantidad_fraccionada?: number | null;
  date: string;
  employee_id: string;
  bodega_id?: string;
  notes: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  tax_id: string;
  created_at: string;
  updated_at: string;
} 