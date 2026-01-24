import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core';
import Oas from 'oas';
import APICore from 'api/dist/core/index.js';
import * as fs from 'fs';
import { join } from 'path';

// Construct the path to your .api folder
const jsonPath = join(process.cwd(), '.api/apis/warehance-api/openapi.json');
const definition = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = (Oas as any).init
      ? Oas.init(definition)
      : (Oas as any).default.init(definition);
    const Core = (APICore as any).default || APICore;
    this.core = new Core(this.spec, 'warehance-api/1.0.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Check if the API key is valid and has the necessary permissions to access the API.
   *
   * @summary Authentication Check
   * @throws FetchError<400, types.GetAuthCheckResponse400> Example Error Response
   */
  getAuthCheck(): Promise<FetchResponse<200, types.GetAuthCheckResponse200>> {
    return this.core.fetch('/auth-check', 'get');
  }

  /**
   * **Required permission:** `read_products`
   *
   * Get a list of products for your organization or client.
   *
   * @summary List Products
   * @throws FetchError<400, types.ListProductsResponse400> Example Error Response
   */
  listProducts(
    metadata?: types.ListProductsMetadataParam,
  ): Promise<FetchResponse<200, types.ListProductsResponse200>> {
    return this.core.fetch('/products', 'get', metadata);
  }

  /**
   * **Required permission:** `write_products`
   *
   * Create a new product.
   *
   * @summary Create Product
   * @throws FetchError<400, types.PostProductsResponse400> Bad Request
   */
  postProducts(
    body: types.PostProductsBodyParam,
  ): Promise<FetchResponse<200, types.PostProductsResponse200>> {
    return this.core.fetch('/products', 'post', body);
  }

  /**
   * **Required permission:** `read_products`
   *
   * Get a product by ID.
   *
   * @summary Get Product
   * @throws FetchError<400, types.GetProductsIdResponse400> Example Error Response
   */
  getProductsId(
    metadata: types.GetProductsIdMetadataParam,
  ): Promise<FetchResponse<200, types.GetProductsIdResponse200>> {
    return this.core.fetch('/products/{id}', 'get', metadata);
  }

  /**
   * **Required permission:** `write_products`
   *
   * Update details of an existing product for your organization or client.
   *
   * @summary Update Product
   * @throws FetchError<400, types.PatchProductsIdResponse400> Bad Request
   * @throws FetchError<403, types.PatchProductsIdResponse403> Forbidden - API Key does not have required permissions
   */
  patchProductsId(
    body: types.PatchProductsIdBodyParam,
    metadata: types.PatchProductsIdMetadataParam,
  ): Promise<FetchResponse<200, types.PatchProductsIdResponse200>> {
    return this.core.fetch('/products/{id}', 'patch', body, metadata);
  }

  /**
   * **Required permission:** `write_products`
   *
   * Create a bundle component.
   *
   * @summary Add Bundle Components
   * @throws FetchError<400, types.PostProductsIdComponentsResponse400> Bad Request
   */
  postProductsIdComponents(
    body: types.PostProductsIdComponentsBodyParam,
    metadata: types.PostProductsIdComponentsMetadataParam,
  ): Promise<FetchResponse<200, types.PostProductsIdComponentsResponse200>> {
    return this.core.fetch('/products/{id}/components', 'post', body, metadata);
  }

  /**
   * **Required permission:** `read_orders`
   *
   * Get a list of orders for your organization or client.
   *
   * @summary List Orders
   * @throws FetchError<400, types.ListOrdersResponse400> Example Error Response
   */
  listOrders(
    metadata?: types.ListOrdersMetadataParam,
  ): Promise<FetchResponse<200, types.ListOrdersResponse200>> {
    return this.core.fetch('/orders', 'get', metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Create a new order.
   *
   * @summary Create Order
   * @throws FetchError<400, types.PostOrdersResponse400> Bad Request
   */
  postOrders(
    body: types.PostOrdersBodyParam,
  ): Promise<FetchResponse<200, types.PostOrdersResponse200>> {
    return this.core.fetch('/orders', 'post', body);
  }

  /**
   * **Required permission:** `read_orders`
   *
   * Get a order by ID.
   *
   * @summary Get Order
   * @throws FetchError<400, types.GetOrdersIdResponse400> Example Error Response
   */
  getOrdersId(
    metadata: types.GetOrdersIdMetadataParam,
  ): Promise<FetchResponse<200, types.GetOrdersIdResponse200>> {
    return this.core.fetch('/orders/{id}', 'get', metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Update details of an existing order for your organization or client.
   *
   * @summary Update Order
   * @throws FetchError<400, types.PatchOrdersIdResponse400> Bad Request
   */
  patchOrdersId(
    body: types.PatchOrdersIdBodyParam,
    metadata: types.PatchOrdersIdMetadataParam,
  ): Promise<FetchResponse<200, types.PatchOrdersIdResponse200>> {
    return this.core.fetch('/orders/{id}', 'patch', body, metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Cancel an order.
   *
   * @summary Cancel Order
   * @throws FetchError<400, types.PostOrdersIdCancelResponse400> Bad Request
   */
  postOrdersIdCancel(
    metadata: types.PostOrdersIdCancelMetadataParam,
  ): Promise<FetchResponse<200, types.PostOrdersIdCancelResponse200>> {
    return this.core.fetch('/orders/{id}/cancel', 'post', metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Add items to an existing order. This endpoint allows you to add new order items to an
   * order that has already been created.
   *
   * @summary Create Order Items
   * @throws FetchError<400, types.PostOrdersIdItemsResponse400> Bad Request
   */
  postOrdersIdItems(
    body: types.PostOrdersIdItemsBodyParam,
    metadata: types.PostOrdersIdItemsMetadataParam,
  ): Promise<FetchResponse<200, types.PostOrdersIdItemsResponse200>> {
    return this.core.fetch('/orders/{id}/items', 'post', body, metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Create new order attachments.
   *
   * @summary Create Order Attachments
   * @throws FetchError<400, types.PostOrdersIdAttachmentsResponse400> Bad Request
   */
  postOrdersIdAttachments(
    body: types.PostOrdersIdAttachmentsBodyParam,
    metadata: types.PostOrdersIdAttachmentsMetadataParam,
  ): Promise<FetchResponse<200, types.PostOrdersIdAttachmentsResponse200>> {
    return this.core.fetch('/orders/{id}/attachments', 'post', body, metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Delete an order attachment.
   *
   * @summary Delete Order Attachment
   * @throws FetchError<400, types.DeleteOrdersIdAttachmentsAttachmentIdResponse400> Bad Request
   */
  deleteOrdersIdAttachmentsAttachment_id(
    metadata: types.DeleteOrdersIdAttachmentsAttachmentIdMetadataParam,
  ): Promise<
    FetchResponse<200, types.DeleteOrdersIdAttachmentsAttachmentIdResponse200>
  > {
    return this.core.fetch(
      '/orders/{id}/attachments/{attachment_id}',
      'delete',
      metadata,
    );
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Update the shipping address of an existing order for your organization or client.
   *
   * @summary Update Shipping Address
   * @throws FetchError<400, types.PatchOrdersIdShippingAddressResponse400> Bad Request
   */
  patchOrdersIdShippingAddress(
    body: types.PatchOrdersIdShippingAddressBodyParam,
    metadata: types.PatchOrdersIdShippingAddressMetadataParam,
  ): Promise<
    FetchResponse<200, types.PatchOrdersIdShippingAddressResponse200>
  > {
    return this.core.fetch(
      '/orders/{id}/shipping-address',
      'patch',
      body,
      metadata,
    );
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Update an order item. Currently, only the quantity can be updated.
   *
   * **Note:** Order items created by native marketplace integrations (items with an
   * `api_id`) cannot have their quantity updated.
   *
   * @summary Update Order Item
   * @throws FetchError<400, types.PatchOrderItemsIdResponse400> Bad Request
   */
  patchOrderItemsId(
    body: types.PatchOrderItemsIdBodyParam,
    metadata: types.PatchOrderItemsIdMetadataParam,
  ): Promise<FetchResponse<200, types.PatchOrderItemsIdResponse200>> {
    return this.core.fetch('/order-items/{id}', 'patch', body, metadata);
  }

  /**
   * **Required permission:** `write_orders`
   *
   * Cancel an order item.
   *
   * @summary Cancel Order Item
   * @throws FetchError<400, types.PostOrderItemsIdCancelResponse400> Bad Request
   */
  postOrderItemsIdCancel(
    metadata: types.PostOrderItemsIdCancelMetadataParam,
  ): Promise<FetchResponse<200, types.PostOrderItemsIdCancelResponse200>> {
    return this.core.fetch('/order-items/{id}/cancel', 'post', metadata);
  }

  /**
   * **Required permission:** `read_shipments`
   *
   * Get a list of shipments for your organization or client.
   *
   * @summary List Shipments
   * @throws FetchError<400, types.ListShipmentsResponse400> Example Error Response
   */
  listShipments(
    metadata?: types.ListShipmentsMetadataParam,
  ): Promise<FetchResponse<200, types.ListShipmentsResponse200>> {
    return this.core.fetch('/shipments', 'get', metadata);
  }

  /**
   * **Required permission:** `read_shipments`
   *
   * Get a shipment by ID.
   *
   * @summary Get Shipment
   * @throws FetchError<400, types.GetShipmentsIdResponse400> Bad Request
   */
  getShipmentsId(
    metadata: types.GetShipmentsIdMetadataParam,
  ): Promise<FetchResponse<200, types.GetShipmentsIdResponse200>> {
    return this.core.fetch('/shipments/{id}', 'get', metadata);
  }

  /**
   * **Required permission:** `write_shipments`
   *
   * Update details of an existing shipment parcel for your organization or client.
   *
   * @summary Update Shipment Parcel
   * @throws FetchError<400, types.PatchShipmentParcelsIdResponse400> Bad Request
   */
  patchShipmentParcelsId(
    body: types.PatchShipmentParcelsIdBodyParam,
    metadata: types.PatchShipmentParcelsIdMetadataParam,
  ): Promise<FetchResponse<200, types.PatchShipmentParcelsIdResponse200>> {
    return this.core.fetch('/shipment-parcels/{id}', 'patch', body, metadata);
  }

  /**
   * **Required permission:** `read_inbound_shipments`
   *
   * Get a list of inbound shipments for your organization or client.
   *
   * @summary List Inbound Shipments
   * @throws FetchError<400, types.ListInboundShipmentsResponse400> Example Error Response
   */
  listInboundShipments(
    metadata?: types.ListInboundShipmentsMetadataParam,
  ): Promise<FetchResponse<200, types.ListInboundShipmentsResponse200>> {
    return this.core.fetch('/inbound-shipments', 'get', metadata);
  }

  /**
   * **Required permission:** `write_inbound_shipments`
   *
   * Create a new inbound shipment.
   *
   * @summary Create Inbound Shipment
   * @throws FetchError<400, types.PostInboundShipmentsResponse400> Bad Request
   */
  postInboundShipments(
    body: types.PostInboundShipmentsBodyParam,
  ): Promise<FetchResponse<200, types.PostInboundShipmentsResponse200>> {
    return this.core.fetch('/inbound-shipments', 'post', body);
  }

  /**
   * **Required permission:** `read_returns`
   *
   * Get a list of returns for your organization or client.
   *
   * @summary List Returns
   * @throws FetchError<400, types.ListReturnsResponse400> Example Error Response
   */
  listReturns(
    metadata?: types.ListReturnsMetadataParam,
  ): Promise<FetchResponse<200, types.ListReturnsResponse200>> {
    return this.core.fetch('/returns', 'get', metadata);
  }

  /**
   * **Required permission:** `write_returns`
   *
   * Create a new return. When `paid_by` is set to "merchant", a shipping label will be
   * purchased and generated. When `email_label_to_customer` is true, the label and/or RMA
   * slip will be emailed to the customer.
   *
   * @summary Create Return
   * @throws FetchError<400, types.PostReturnsResponse400> Bad Request
   * @throws FetchError<403, types.PostReturnsResponse403> Forbidden
   * @throws FetchError<500, types.PostReturnsResponse500> Internal Server Error
   */
  postReturns(
    body: types.PostReturnsBodyParam,
  ): Promise<FetchResponse<201, types.PostReturnsResponse201>> {
    return this.core.fetch('/returns', 'post', body);
  }

  /**
   * **Required permission:** `read_returns` and `write_returns`
   *
   * Get shipping rates for return shipments from various carriers. This endpoint allows you
   * to compare return shipping rates across different carriers and services before creating
   * a return label.
   *
   * The endpoint supports multiple carrier integrations including EasyPost, EasyPost User,
   * and Shippo. It will return rates from all available carrier connections that are enabled
   * for returns and active.
   *
   * **Note:** For client-level API keys, the `client_id` field is automatically set to the
   * client's ID and cannot be overridden.
   *
   * @summary Shop Return Rates
   * @throws FetchError<400, types.ShopReturnsRatesResponse400> Bad Request
   */
  shopReturnsRates(
    body: types.ShopReturnsRatesBodyParam,
  ): Promise<FetchResponse<200, types.ShopReturnsRatesResponse200>> {
    return this.core.fetch('/returns/shop-rates', 'post', body);
  }

  /**
   * **Required permission:** `read_clients`
   *
   * Get a list of clients for your organization.
   *
   * @summary List Clients
   * @throws FetchError<400, types.ListClientsResponse400> Example Error Response
   */
  listClients(
    metadata?: types.ListClientsMetadataParam,
  ): Promise<FetchResponse<200, types.ListClientsResponse200>> {
    return this.core.fetch('/clients', 'get', metadata);
  }

  /**
   * **Required permission:** `write_clients`
   *
   * Create a new client.
   *
   * **Note:** This endpoint will create a default store and shipping method for the client.
   *
   * @summary Create Client
   * @throws FetchError<400, types.PostClientsResponse400> Bad Request
   * @throws FetchError<403, types.PostClientsResponse403> Forbidden
   */
  postClients(
    body: types.PostClientsBodyParam,
  ): Promise<FetchResponse<200, types.PostClientsResponse200>> {
    return this.core.fetch('/clients', 'post', body);
  }

  /**
   * **Required permission:** `write_clients`
   *
   * Update a client's shipping paused status.
   *
   * **Note:** This endpoint only allows updating the shipping paused status. Other client
   * settings cannot be modified through this endpoint.
   *
   * @summary Update Client
   * @throws FetchError<400, types.UpdateClientResponse400> Bad Request
   */
  updateClient(
    body: types.UpdateClientBodyParam,
    metadata: types.UpdateClientMetadataParam,
  ): Promise<FetchResponse<200, types.UpdateClientResponse200>> {
    return this.core.fetch('/clients/{id}', 'patch', body, metadata);
  }

  /**
   * **Required permission:** `read_stores`
   *
   * Get a list of stores for your organization or client.
   *
   * @summary List Stores
   * @throws FetchError<400, types.ListStoresResponse400> Example Error Response
   */
  listStores(
    metadata?: types.ListStoresMetadataParam,
  ): Promise<FetchResponse<200, types.ListStoresResponse200>> {
    return this.core.fetch('/stores', 'get', metadata);
  }

  /**
   * **Required permission:** `write_stores`
   *
   * Create a new store.
   *
   * **Note:** This endpoint will create a default shipping method for the store.
   *
   * @summary Create Store
   * @throws FetchError<400, types.PostStoresResponse400> Bad Request
   * @throws FetchError<403, types.PostStoresResponse403> Forbidden
   */
  postStores(
    body: types.PostStoresBodyParam,
  ): Promise<FetchResponse<200, types.PostStoresResponse200>> {
    return this.core.fetch('/stores', 'post', body);
  }

  /**
   * **Required permission:** `read_users`
   *
   * Get a list of users for your organization.
   *
   * @summary List Users
   * @throws FetchError<400, types.ListUsersResponse400> Example Error Response
   */
  listUsers(
    metadata?: types.ListUsersMetadataParam,
  ): Promise<FetchResponse<200, types.ListUsersResponse200>> {
    return this.core.fetch('/users', 'get', metadata);
  }

  /**
   * **Required permission:** `read_shipping_methods`
   *
   * Get a list of shipping methods for your organization or client.
   *
   * @summary List Shipping Methods
   * @throws FetchError<400, types.ListShippingMethodsResponse400> Example Error Response
   */
  listShippingMethods(
    metadata?: types.ListShippingMethodsMetadataParam,
  ): Promise<FetchResponse<200, types.ListShippingMethodsResponse200>> {
    return this.core.fetch('/shipping-methods', 'get', metadata);
  }

  /**
   * **Required permission:** `read_warehouses`
   *
   * Get a list of warehouses for your organization or client.
   *
   * @summary List Warehouses
   * @throws FetchError<400, types.ListWarehousesResponse400> Example Error Response
   */
  listWarehouses(
    metadata?: types.ListWarehousesMetadataParam,
  ): Promise<FetchResponse<200, types.ListWarehousesResponse200>> {
    return this.core.fetch('/warehouses', 'get', metadata);
  }

  /**
   * **Required permissions:** `read_locations`, `read_warehouses`
   *
   * Get a list of locations for your organization or client.
   *
   * @summary List Locations
   * @throws FetchError<400, types.ListLocationsResponse400> Example Error Response
   */
  listLocations(
    metadata?: types.ListLocationsMetadataParam,
  ): Promise<FetchResponse<200, types.ListLocationsResponse200>> {
    return this.core.fetch('/locations', 'get', metadata);
  }

  /**
   * **Required permission:** `read_bills`
   *
   * Get a list of bills for your organization or client (Clients can only view approved
   * bills).
   *
   * @summary List Bills
   * @throws FetchError<400, types.ListBillsResponse400> Example Error Response
   */
  listBills(
    metadata?: types.ListBillsMetadataParam,
  ): Promise<FetchResponse<200, types.ListBillsResponse200>> {
    return this.core.fetch('/bills', 'get', metadata);
  }

  /**
   * **Required permission:** `write_bills`
   *
   * Create a new bill.
   *
   * @summary Create Bill
   * @throws FetchError<400, types.PostBillsResponse400> Bad Request
   */
  postBills(
    body: types.PostBillsBodyParam,
  ): Promise<FetchResponse<200, types.PostBillsResponse200>> {
    return this.core.fetch('/bills', 'post', body);
  }

  /**
   * **Required permission:** `read_bills`
   *
   * Get a bill by ID. Clients can only view approved bills that belong to them.
   *
   * @summary Get Bill
   * @throws FetchError<400, types.GetBillsIdResponse400> Bad Request
   */
  getBillsId(
    metadata: types.GetBillsIdMetadataParam,
  ): Promise<FetchResponse<200, types.GetBillsIdResponse200>> {
    return this.core.fetch('/bills/{id}', 'get', metadata);
  }

  /**
   * **Required permission:** `read_bills`
   *
   * Get a list of line items for a bill.
   *
   * @summary List Bill Line Items
   * @throws FetchError<400, types.ListBillLineItemsResponse400> Example Error Response
   */
  listBillLineItems(
    metadata: types.ListBillLineItemsMetadataParam,
  ): Promise<FetchResponse<200, types.ListBillLineItemsResponse200>> {
    return this.core.fetch('/bills/{id}/line-items', 'get', metadata);
  }

  /**
   * **Required permission:** `write_bills`
   *
   * Create line items for a bill.
   *
   * @summary Create Line Items
   * @throws FetchError<400, types.PostBillsIdLineItemsResponse400> Bad Request
   */
  postBillsIdLineItems(
    body: types.PostBillsIdLineItemsBodyParam,
    metadata: types.PostBillsIdLineItemsMetadataParam,
  ): Promise<FetchResponse<200, types.PostBillsIdLineItemsResponse200>> {
    return this.core.fetch('/bills/{id}/line-items', 'post', body, metadata);
  }

  /**
   * **Required permission:** `read_billing_profiles`
   *
   * Get a list of billing profiles for your organization.
   *
   * @summary List Billing Profiles
   * @throws FetchError<400, types.ListBillingProfilesResponse400> Example Error Response
   */
  listBillingProfiles(
    metadata?: types.ListBillingProfilesMetadataParam,
  ): Promise<FetchResponse<200, types.ListBillingProfilesResponse200>> {
    return this.core.fetch('/billing-profiles', 'get', metadata);
  }

  /**
   * **Required permission:** `write_inventory`
   *
   * Adjust the inventory of a product.
   *
   * @summary Adjust Inventory
   * @throws FetchError<400, types.PostInventoryAdjustResponse400> Bad Request
   */
  postInventoryAdjust(
    body: types.PostInventoryAdjustBodyParam,
  ): Promise<FetchResponse<200, types.PostInventoryAdjustResponse200>> {
    return this.core.fetch('/inventory/adjust', 'post', body);
  }
}

const createSDK = (() => {
  return new SDK();
})();
export default createSDK;

export type {
  DeleteOrdersIdAttachmentsAttachmentIdMetadataParam,
  DeleteOrdersIdAttachmentsAttachmentIdResponse200,
  DeleteOrdersIdAttachmentsAttachmentIdResponse400,
  GetAuthCheckResponse200,
  GetAuthCheckResponse400,
  GetBillsIdMetadataParam,
  GetBillsIdResponse200,
  GetBillsIdResponse400,
  GetOrdersIdMetadataParam,
  GetOrdersIdResponse200,
  GetOrdersIdResponse400,
  GetProductsIdMetadataParam,
  GetProductsIdResponse200,
  GetProductsIdResponse400,
  GetShipmentsIdMetadataParam,
  GetShipmentsIdResponse200,
  GetShipmentsIdResponse400,
  ListBillLineItemsMetadataParam,
  ListBillLineItemsResponse200,
  ListBillLineItemsResponse400,
  ListBillingProfilesMetadataParam,
  ListBillingProfilesResponse200,
  ListBillingProfilesResponse400,
  ListBillsMetadataParam,
  ListBillsResponse200,
  ListBillsResponse400,
  ListClientsMetadataParam,
  ListClientsResponse200,
  ListClientsResponse400,
  ListInboundShipmentsMetadataParam,
  ListInboundShipmentsResponse200,
  ListInboundShipmentsResponse400,
  ListLocationsMetadataParam,
  ListLocationsResponse200,
  ListLocationsResponse400,
  ListOrdersMetadataParam,
  ListOrdersResponse200,
  ListOrdersResponse400,
  ListProductsMetadataParam,
  ListProductsResponse200,
  ListProductsResponse400,
  ListReturnsMetadataParam,
  ListReturnsResponse200,
  ListReturnsResponse400,
  ListShipmentsMetadataParam,
  ListShipmentsResponse200,
  ListShipmentsResponse400,
  ListShippingMethodsMetadataParam,
  ListShippingMethodsResponse200,
  ListShippingMethodsResponse400,
  ListStoresMetadataParam,
  ListStoresResponse200,
  ListStoresResponse400,
  ListUsersMetadataParam,
  ListUsersResponse200,
  ListUsersResponse400,
  ListWarehousesMetadataParam,
  ListWarehousesResponse200,
  ListWarehousesResponse400,
  PatchOrderItemsIdBodyParam,
  PatchOrderItemsIdMetadataParam,
  PatchOrderItemsIdResponse200,
  PatchOrderItemsIdResponse400,
  PatchOrdersIdBodyParam,
  PatchOrdersIdMetadataParam,
  PatchOrdersIdResponse200,
  PatchOrdersIdResponse400,
  PatchOrdersIdShippingAddressBodyParam,
  PatchOrdersIdShippingAddressMetadataParam,
  PatchOrdersIdShippingAddressResponse200,
  PatchOrdersIdShippingAddressResponse400,
  PatchProductsIdBodyParam,
  PatchProductsIdMetadataParam,
  PatchProductsIdResponse200,
  PatchProductsIdResponse400,
  PatchProductsIdResponse403,
  PatchShipmentParcelsIdBodyParam,
  PatchShipmentParcelsIdMetadataParam,
  PatchShipmentParcelsIdResponse200,
  PatchShipmentParcelsIdResponse400,
  PostBillsBodyParam,
  PostBillsIdLineItemsBodyParam,
  PostBillsIdLineItemsMetadataParam,
  PostBillsIdLineItemsResponse200,
  PostBillsIdLineItemsResponse400,
  PostBillsResponse200,
  PostBillsResponse400,
  PostClientsBodyParam,
  PostClientsResponse200,
  PostClientsResponse400,
  PostClientsResponse403,
  PostInboundShipmentsBodyParam,
  PostInboundShipmentsResponse200,
  PostInboundShipmentsResponse400,
  PostInventoryAdjustBodyParam,
  PostInventoryAdjustResponse200,
  PostInventoryAdjustResponse400,
  PostOrderItemsIdCancelMetadataParam,
  PostOrderItemsIdCancelResponse200,
  PostOrderItemsIdCancelResponse400,
  PostOrdersBodyParam,
  PostOrdersIdAttachmentsBodyParam,
  PostOrdersIdAttachmentsMetadataParam,
  PostOrdersIdAttachmentsResponse200,
  PostOrdersIdAttachmentsResponse400,
  PostOrdersIdCancelMetadataParam,
  PostOrdersIdCancelResponse200,
  PostOrdersIdCancelResponse400,
  PostOrdersIdItemsBodyParam,
  PostOrdersIdItemsMetadataParam,
  PostOrdersIdItemsResponse200,
  PostOrdersIdItemsResponse400,
  PostOrdersResponse200,
  PostOrdersResponse400,
  PostProductsBodyParam,
  PostProductsIdComponentsBodyParam,
  PostProductsIdComponentsMetadataParam,
  PostProductsIdComponentsResponse200,
  PostProductsIdComponentsResponse400,
  PostProductsResponse200,
  PostProductsResponse400,
  PostReturnsBodyParam,
  PostReturnsResponse201,
  PostReturnsResponse400,
  PostReturnsResponse403,
  PostReturnsResponse500,
  PostStoresBodyParam,
  PostStoresResponse200,
  PostStoresResponse400,
  PostStoresResponse403,
  ShopReturnsRatesBodyParam,
  ShopReturnsRatesResponse200,
  ShopReturnsRatesResponse400,
  UpdateClientBodyParam,
  UpdateClientMetadataParam,
  UpdateClientResponse200,
  UpdateClientResponse400,
} from './types';
