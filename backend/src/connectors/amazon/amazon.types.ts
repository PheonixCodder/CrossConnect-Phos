/**
 * Amazon SP-API
 * GET_MERCHANT_LISTINGS_ALL_DATA
 * One row per SKU per marketplace
 */
export interface AmazonMerchantListingRow {
  /** Product title */
  'item-name': string | null;

  /** Product description */
  'item-description': string | null;

  /** Amazon listing identifier */
  'listing-id': string | null;

  /** Seller SKU (PRIMARY KEY) */
  'seller-sku': string;

  /** Listing price (string, e.g. "19.99") */
  price: string | null;

  /** Available quantity (string integer) */
  quantity: string | null;

  /** Listing open date (ISO-ish string) */
  'open-date': string | null;

  /** Main image URL */
  'image-url': string | null;

  /** Whether item is marketplace fulfilled */
  'item-is-marketplace': 'y' | 'n' | null;

  /** Product ID type (ASIN, ISBN, UPC, EAN) */
  'product-id-type': string | null;

  /** ZShop shipping fee */
  'zshop-shipping-fee': string | null;

  /** Seller notes */
  'item-note': string | null;

  /** Condition (New, Used, etc.) */
  'item-condition': string | null;

  /** ZShop category */
  'zshop-category1': string | null;

  /** ZShop browse path */
  'zshop-browse-path': string | null;

  /** ZShop storefront feature */
  'zshop-storefront-feature': string | null;

  /** Primary ASIN */
  asin1: string | null;

  /** Secondary ASIN */
  asin2: string | null;

  /** Tertiary ASIN */
  asin3: string | null;

  /** International shipping allowed */
  'will-ship-internationally': 'y' | 'n' | null;

  /** Expedited shipping enabled */
  'expedited-shipping': 'y' | 'n' | null;

  /** ZShop boldface flag */
  'zshop-boldface': 'y' | 'n' | null;

  /** Generic product ID (often ASIN) */
  'product-id': string | null;

  /** Featured placement bid */
  'bid-for-featured-placement': string | null;

  /** Add/Delete indicator */
  'add-delete': 'a' | 'd' | null;

  /** Pending quantity (string integer) */
  'pending-quantity': string | null;

  /** Fulfillment channel (AFN | MFN) */
  'fulfillment-channel': 'AFN' | 'MFN' | null;

  /** Merchant shipping group */
  'merchant-shipping-group': string | null;

  /** Listing status (Active, Inactive) */
  status: string | null;
}

export interface AmazonReturnReportItem {
  // --- FBA Report Specific Fields ---
  return_date: string; // Mapping from 'return-date'
  order_id: string; // Mapping from 'order-id'
  sku: string; // Mapping from 'sku'
  asin: string; // Mapping from 'asin'
  fnsku?: string; // Mapping from 'fnsku'
  product_name?: string; // Mapping from 'product-name'
  quantity: number; // Mapping from 'quantity'
  fulfillment_center_id?: string; // Mapping from 'fulfillment-center-id'
  detailed_disposition?: string; // Mapping from 'detailed-disposition'
  reason?: string; // Mapping from 'reason'
  status?: string; // Mapping from 'status'
  license_plate_number?: string; // Mapping from 'license-plate-number'
  customer_comments?: string; // Mapping from 'customer-comments'

  // --- Legacy / Derived Fields (Optional for backward compatibility) ---
  merchant_sku?: string; // Usually same as sku
  item_name?: string; // Usually same as product_name
  amazon_rma_id?: string;
  return_request_date?: string; // Usually same as return_date
  return_request_status?: string; // Usually same as status
  return_type?: string; // 'FBA'
  currency_code?: string;
}
