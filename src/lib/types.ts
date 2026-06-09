// Villa Happ — Database types

export interface Product {
  id: string;
  slug: string;
  name: string;
  description?: string;
  short_desc?: string;
  price_cents: number;
  compare_at_cents?: number;
  currency: string;
  category?: string;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  image_url?: string;
  gallery: string[];
  drop_id?: string;
  weight_grams?: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size?: string;
  color?: string;
  color_hex?: string;
  price_cents?: number;
  image_url?: string;
  created_at: string;
}

export interface InventoryRow {
  variant_id: string;
  quantity: number;
  reserved: number;
  low_stock_at: number;
  updated_at: string;
}

export interface Drop {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image_url?: string;
  status: 'coming-soon' | 'live' | 'sold-out' | 'archived';
  launch_date?: string;
  end_date?: string;
  total_pieces?: number;
  certificate?: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  variant_id: string;
  product_id: string;
  quantity: number;
  // Snapshot voor UX
  name: string;
  variant_label?: string;
  unit_price_cents: number;
  image_url?: string;
  slug: string;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  street: string;
  house_number: string;
  postal_code: string;
  city: string;
  country: string; // ISO code 'NL', 'BE', 'DE'
  phone?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status: 'open' | 'authorized' | 'paid' | 'failed' | 'expired' | 'refunded';
  mollie_payment_id?: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  shipping_address?: ShippingAddress;
  billing_address?: ShippingAddress;
  notes?: string;
  paid_at?: string;
  shipped_at?: string;
  tracking_number?: string;
  tracking_carrier?: string;
  created_at: string;
  updated_at: string;
}
