const GetAuthCheck = {
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            message: { type: 'string', examples: ['API Key is valid'] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetOrdersId = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the order to get.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            id: {
              type: 'integer',
              description: 'A unique identifier for the order.\n',
              examples: [231185181649],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the order was created.\n',
              examples: ['2024-07-24T17:09:00-07:00'],
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description:
                'The date and time when the order was last updated.\n',
              examples: ['2024-07-24T17:09:02-07:00'],
            },
            hold_until_date: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time until which to hold the order.\n',
              examples: ['2024-07-24T17:09:02-07:00'],
            },
            total_amount: {
              type: 'number',
              description: 'The total amount of the order.\n',
              examples: [100],
            },
            shipping_amount: {
              type: 'number',
              description: 'The shipping amount of the order.\n',
              examples: [10],
            },
            tax_amount: {
              type: 'number',
              description: 'The tax amount of the order.\n',
              examples: [10],
            },
            discount_amount: {
              type: 'number',
              description: 'The discount amount of the order.\n',
              examples: [10],
            },
            subtotal_amount: {
              type: 'number',
              description: 'The subtotal amount of the order.\n',
              examples: [100],
            },
            status: {
              type: 'string',
              description:
                'The current custom status of the order. These statuses are manually created in Warehance and can be set via automation rules or manually.\n',
              examples: ['processing'],
            },
            fulfillment_status: {
              type: 'string',
              description:
                'The fulfillment status of the order, indicating whether the order has been fulfilled:\n  * `unfulfilled`: The order has not been fulfilled.\n  * `partially_fulfilled`: The order has been partially fulfilled.\n  * `fulfilled`: The order has been completely fulfilled.\n  * `cancelled`: The order has been cancelled.\n  * `in_progress`: The order fulfillment is in progress.\n',
              examples: ['unfulfilled'],
            },
            order_number: {
              type: 'string',
              description: 'The unique order number assigned to the order.\n',
              examples: ['1B8C7E567'],
            },
            cancelled: {
              type: 'boolean',
              description: 'Indicates whether the order has been cancelled.\n',
              examples: [false],
            },
            order_date: {
              type: 'string',
              format: 'date-time',
              description: 'The date and time when the order was placed.\n',
              examples: ['2024-07-24T17:09:00-07:00'],
            },
            order_items: {
              type: 'array',
              description: 'A list of items in the order.\n',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the item.\n',
                    examples: [231185181773],
                  },
                  sku: {
                    type: 'string',
                    description: 'The SKU (Stock Keeping Unit) of the item.\n',
                    examples: ['WHITE'],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the item.\n',
                    examples: ['White T Shirt'],
                  },
                  quantity: {
                    type: 'integer',
                    description:
                      'The quantity of the item expected to be fulfilled. This usually represents the quantity ordered and may go to 0 if the order is cancelled.\n',
                    examples: [1],
                  },
                  quantity_shipped: {
                    type: 'integer',
                    description:
                      'The quantity of the item that has been shipped.\n',
                    examples: [0],
                  },
                  cancelled: {
                    type: 'boolean',
                    description:
                      'Indicates whether the item has been cancelled.\n',
                    examples: [false],
                  },
                  unit_price: {
                    type: 'number',
                    description: 'The unit price of the item.\n',
                    examples: [10],
                  },
                },
              },
            },
            store: {
              type: 'object',
              description: 'The store associated with the order.\n',
              properties: {
                id: {
                  type: 'integer',
                  description: 'A unique identifier for the store.\n',
                  examples: [1],
                },
                name: {
                  type: 'string',
                  description: 'The name of the store.\n',
                  examples: ['Main Store'],
                },
              },
            },
            client: {
              type: 'object',
              description: 'The client associated with the order.\n',
              properties: {
                id: {
                  type: 'integer',
                  description: 'A unique identifier for the client.\n',
                  examples: [1],
                },
                name: {
                  type: 'string',
                  description: 'The name of the client.\n',
                  examples: ['Acme Inc.'],
                },
              },
            },
            warehouse: {
              type: 'object',
              description: 'The warehouse associated with the order.\n',
              properties: {
                id: {
                  type: 'integer',
                  description: 'A unique identifier for the warehouse.\n',
                  examples: [1],
                },
                name: {
                  type: 'string',
                  description: 'The name of the warehouse.\n',
                  examples: ['Main Warehouse'],
                },
              },
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const GetProductsId = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the product to get.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the product.',
              examples: [12345],
            },
            name: {
              type: 'string',
              description: 'The name of the product.',
              examples: ['White T Shirt'],
            },
            sku: {
              type: 'string',
              description: 'The SKU (Stock Keeping Unit) of the product.',
              examples: ['WHITE'],
            },
            barcode: {
              type: 'string',
              description: 'The barcode of the product.',
              examples: ['1234567890'],
            },
            weight: {
              type: 'number',
              format: 'float',
              description: 'The weight of the product in ounces.',
              examples: [5],
              minimum: -3.402823669209385e38,
              maximum: 3.402823669209385e38,
            },
            length: {
              type: 'number',
              format: 'float',
              description: 'The length of the product in inches.',
              examples: [10],
              minimum: -3.402823669209385e38,
              maximum: 3.402823669209385e38,
            },
            width: {
              type: 'number',
              format: 'float',
              description: 'The width of the product in inches.',
              examples: [5],
              minimum: -3.402823669209385e38,
              maximum: 3.402823669209385e38,
            },
            height: {
              type: 'number',
              format: 'float',
              description: 'The height of the product in inches.',
              examples: [5],
              minimum: -3.402823669209385e38,
              maximum: 3.402823669209385e38,
            },
            lot_required: {
              type: 'boolean',
              description:
                'Indicates whether the product requires lot tracking.',
              examples: [false],
            },
            is_bundle: {
              type: 'boolean',
              description: 'Indicates whether the product is a bundle parent.',
              examples: [false],
            },
            is_component: {
              type: 'boolean',
              description:
                'Indicates whether the product is a bundle component.',
              examples: [false],
            },
            on_hand: {
              type: 'integer',
              description:
                'The number of units of the product currently in stock.',
              examples: [100],
            },
            allocated: {
              type: 'integer',
              description:
                'The number of units of the product currently allocated.',
              examples: [10],
            },
            available: {
              type: 'integer',
              description:
                'The number of units of the product currently available.',
              examples: [90],
            },
            backordered: {
              type: 'integer',
              description:
                'The number of units of the product currently backordered.',
              examples: [10],
            },
            inventory_by_location: {
              type: 'array',
              description: 'The inventory by location of the product.',
              items: {
                type: 'object',
                properties: {
                  location_id: {
                    type: 'integer',
                    description: 'The ID of the location.',
                    examples: [1],
                  },
                  quantity: {
                    type: 'integer',
                    description: 'The quantity of the product in the location.',
                    examples: [100],
                  },
                  warehouse_id: {
                    type: 'integer',
                    description: 'The ID of the warehouse.',
                    examples: [1],
                  },
                  product_lot_id: {
                    type: 'integer',
                    description: 'The ID of the product lot.',
                    examples: [1],
                  },
                },
              },
            },
            inventory_by_warehouse: {
              type: 'array',
              description: 'The inventory by warehouse of the product.',
              items: {
                type: 'object',
                properties: {
                  warehouse_id: {
                    type: 'integer',
                    description: 'The ID of the warehouse.',
                    examples: [1],
                  },
                  on_hand: {
                    type: 'integer',
                    description:
                      'The number of units of the product on hand in the warehouse.',
                    examples: [100],
                  },
                  allocated: {
                    type: 'integer',
                    description:
                      'The number of units of the product allocated in the warehouse.',
                    examples: [10],
                  },
                  available: {
                    type: 'integer',
                    description:
                      'The number of units of the product available in the warehouse.',
                    examples: [90],
                  },
                  backordered: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently backordered in the warehouse.',
                    examples: [10],
                  },
                  damaged: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently damaged in the warehouse.',
                    examples: [0],
                  },
                  non_sellable: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently non-sellable in the warehouse.',
                    examples: [0],
                  },
                  expired: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently expired in the warehouse.',
                    examples: [0],
                  },
                  on_order: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently on order in the warehouse.',
                    examples: [0],
                  },
                  reserved: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently reserved in the warehouse.',
                    examples: [0],
                  },
                },
              },
            },
            product_lots: {
              type: 'array',
              description: 'The product lots of the product.',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'The ID of the product lot.',
                    examples: [1],
                  },
                  lot_number: {
                    type: 'string',
                    description: 'The lot number of the product.',
                    examples: [1234567890],
                  },
                  expiration_date: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The expiration date of the product lot.',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                },
              },
            },
            components: {
              type: 'array',
              description: 'The components of the product.',
              items: {
                type: 'object',
                properties: {
                  product_id: {
                    type: 'integer',
                    description: 'The ID of the component product.',
                    examples: [1],
                  },
                  product_name: {
                    type: 'string',
                    description:
                      'The name of the component product in the bundle.',
                    examples: ['White T Shirt'],
                  },
                  sku: {
                    type: 'string',
                    description:
                      'The SKU of the component product in the bundle.',
                    examples: ['WHITE'],
                  },
                  quantity: {
                    type: 'integer',
                    description:
                      'The quantity of the component product in the bundle.',
                    examples: [1],
                  },
                },
              },
            },
            bundles: {
              type: 'array',
              description: 'The bundles of the product.',
              items: {
                type: 'object',
                properties: {
                  product_id: {
                    type: 'integer',
                    description: 'The ID of the parent product.',
                    examples: [1],
                  },
                  product_name: {
                    type: 'string',
                    description:
                      'The name of the parent product in the bundle.',
                    examples: ['T Shirt Bundle'],
                  },
                  sku: {
                    type: 'string',
                    description: 'The SKU of the parent product in the bundle.',
                    examples: ['WHITE'],
                  },
                  quantity: {
                    type: 'integer',
                    description:
                      'The quantity of this product in the parent bundle.',
                    examples: [1],
                  },
                },
              },
            },
            client: {
              type: 'object',
              description: 'The client of the product.',
              properties: {
                id: {
                  type: 'integer',
                  description: 'The ID of the client.',
                  examples: [1],
                },
                name: {
                  type: 'string',
                  description: 'The name of the client.',
                  examples: ['Acme Inc.'],
                },
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'The creation date of the product.',
              examples: ['2024-07-24T17:09:00-07:00'],
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'The last update date of the product.',
              examples: ['2024-07-24T17:09:00-07:00'],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListBillLineItems = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the bill',
          },
        },
        required: ['id'],
      },
      {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['created_at'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The field to sort the line items by',
          },
          charge_category: {
            type: 'string',
            enum: [
              'storage',
              'picking',
              'shipments',
              'shipment_parcels',
              'returns',
              'return_labels',
              'recurring_fees',
              'adhoc',
            ],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The category of the charges',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            line_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the line item.\n',
                    examples: [231185181649],
                  },
                  charge_category: {
                    type: 'string',
                    description: 'The category of the charge.\n',
                    examples: ['storage'],
                  },
                  date: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The date of the charge.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  description: {
                    type: 'string',
                    description: 'The description of the charge.\n',
                    examples: ['Pick for order 1234567890'],
                  },
                  amount: {
                    type: 'number',
                    description: 'The amount of the charge.\n',
                    examples: [100],
                  },
                  order: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the order associated with this line item.\n',
                        examples: [1234567890],
                      },
                      order_number: {
                        type: 'string',
                        description:
                          'The number of the order associated with this line item.\n',
                        examples: ['1234567890'],
                      },
                    },
                  },
                  shipment: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the shipment associated with this line item.\n',
                        examples: [1234567890],
                      },
                    },
                  },
                  shipment_parcel: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the shipment parcel.\n',
                        examples: [1234567890],
                      },
                      shipment_id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the shipment associated with this line item.\n',
                        examples: [1234567890],
                      },
                    },
                  },
                  return: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the return associated with this line item.\n',
                        examples: [1234567890],
                      },
                    },
                  },
                  location: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the location associated with this line item.\n',
                        examples: [1234567890],
                      },
                      name: {
                        type: 'string',
                        description:
                          'The name of the location associated with this line item.\n',
                        examples: ['01-01-01-01'],
                      },
                    },
                  },
                  product: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the product associated with this line item.\n',
                        examples: [1234567890],
                      },
                      sku: {
                        type: 'string',
                        description:
                          'The SKU of the product associated with this line item.\n',
                        examples: ['1234567890'],
                      },
                    },
                  },
                  adhoc_charge: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the adhoc charge associated with this line item.\n',
                        examples: [1234567890],
                      },
                      name: {
                        type: 'string',
                        description:
                          'The name of the adhoc charge associated with this line item.\n',
                        examples: ['Adhoc Charge'],
                      },
                      description: {
                        type: 'string',
                        description:
                          'The description of the adhoc charge associated with this line item.\n',
                        examples: ['Adhoc Charge'],
                      },
                    },
                  },
                  charge_rule: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the charge rule that generated this line item.\n',
                        examples: [1234567890],
                      },
                      name: {
                        type: 'string',
                        description:
                          'The name of the charge rule that generated this line item.\n',
                        examples: ['Charge Rule'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListBillingProfiles = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['created_at'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The field to sort the billing profiles by',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            billing_profiles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description:
                      'A unique identifier for the billing profile.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the billing profile.\n',
                    examples: ['Acme Inc Billing Profile'],
                  },
                },
              },
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListBills = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          approved: {
            type: 'boolean',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Whether to filter by approved bills',
          },
          sort_by: {
            type: 'string',
            enum: ['created_at'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The field to sort the bills by',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            bills: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the bill.\n',
                    examples: [231185181649],
                  },
                  total_charge_amount: {
                    type: 'number',
                    description: 'The total charge amount of the bill.\n',
                    examples: [100],
                  },
                  bill_name: {
                    type: 'string',
                    description: 'The name of the bill.\n',
                    examples: ['Bill 1'],
                  },
                  start_date: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The start date of the bill.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  end_date: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The end date of the bill.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time when the bill was created.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  generation_completed_at: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time when the bill was generated.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  generation_status: {
                    type: 'string',
                    description:
                      'The status of the bill generation.\n\n\n`completed` `processing` `errors` `queued`',
                    enum: ['completed', 'processing', 'errors', 'queued'],
                    examples: ['completed'],
                  },
                  approved: {
                    type: 'boolean',
                    description: 'Whether the bill has been approved.\n',
                    examples: [true],
                  },
                  status: {
                    type: 'string',
                    description:
                      'The status of the bill. This is a custom status, which can be create and set in the Warehance App.\n',
                    examples: ['Custom Status'],
                  },
                  line_item_details_csv_url: {
                    type: 'string',
                    description: 'The URL of the line item details CSV file.\n',
                    examples: [
                      'https://s3.amazonaws.com/warehance-bills/1234567890/line_item_details.csv',
                    ],
                  },
                  invoice_pdf_file_url: {
                    type: 'string',
                    description: 'The URL of the invoice PDF file.\n',
                    examples: [
                      'https://s3.amazonaws.com/warehance-bills/1234567890/invoice.pdf',
                    ],
                  },
                  client: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'The ID of the client.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the client.\n',
                        examples: ['Acme Inc.'],
                      },
                    },
                  },
                  billing_profile: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'The ID of the billing profile.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the billing profile.\n',
                        examples: ['Acme Inc Billing Profile'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListClients = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            clients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the client.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the client.\n',
                    examples: ['Acme Inc.'],
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListInboundShipments = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            inbound_shipments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description:
                      'A unique identifier for the inbound shipment.',
                    examples: [231185181649],
                  },
                  reference_number: {
                    type: 'string',
                    description:
                      'The reference number of the inbound shipment.',
                    examples: [1234567890],
                  },
                  expected_date: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The expected date of the inbound shipment.',
                    examples: ['2021-01-01T00:00:00Z'],
                  },
                  ship_date: {
                    type: 'string',
                    format: 'date-time',
                    description: 'The ship date of the inbound shipment.',
                    examples: ['2021-01-01T00:00:00Z'],
                  },
                  tracking_number: {
                    type: 'string',
                    description: 'The tracking number of the inbound shipment.',
                    examples: [1234567890],
                  },
                  tracking_url: {
                    type: 'string',
                    description: 'The tracking URL of the inbound shipment.',
                    examples: [
                      'https://carrier.example.com/track/1Z999AA10123456784',
                    ],
                  },
                  warehouse: {
                    type: 'object',
                    description:
                      'The warehouse that the inbound shipment is going to arrive at.',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'The ID of the warehouse.',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the warehouse.',
                        examples: ['Warehouse 1'],
                      },
                    },
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'integer',
                          description: 'The ID of the inbound shipment item.',
                          examples: [1],
                        },
                        product: {
                          type: 'object',
                          properties: {
                            id: {
                              type: 'integer',
                              description: 'The ID of the product.',
                              examples: [1],
                            },
                            name: {
                              type: 'string',
                              description: 'The name of the product.',
                              examples: ['Product 1'],
                            },
                            sku: {
                              type: 'string',
                              description: 'The SKU of the product.',
                              examples: ['1234567890'],
                            },
                          },
                        },
                        ordered: {
                          type: 'integer',
                          description: 'The number of items ordered.',
                          examples: [1],
                        },
                        received: {
                          type: 'integer',
                          description: 'The number of items received.',
                          examples: [1],
                        },
                        rejected: {
                          type: 'integer',
                          description: 'The number of items rejected.',
                          examples: [1],
                        },
                        sell_ahead: {
                          type: 'integer',
                          description:
                            'The number of items marked as sell ahead.',
                          examples: [1],
                        },
                      },
                    },
                  },
                  client: {
                    type: 'object',
                    description:
                      'The client that the inbound shipment is associated with.',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'The ID of the client.',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the client.',
                        examples: ['Client 1'],
                      },
                    },
                  },
                  status: {
                    type: 'string',
                    description:
                      'The custom inbound shipment status of the inbound shipment.',
                    examples: ['Pending'],
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time the inbound shipment was created.',
                    examples: ['2021-01-01T00:00:00Z'],
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListLocations = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['created_at', 'name'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the field by which to sort the returned warehouses:\n* `created_at`: Sort by the creation date of the warehouse.\n* `name`: Sort by the name of the warehouse.\n',
          },
          warehouse_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'Filter locations by warehouse ID.\n',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            locations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the location.',
                    examples: [1001],
                  },
                  name: {
                    type: 'string',
                    description: 'The name or code of the location.',
                    examples: ['A1-01-01'],
                  },
                  pickable: {
                    type: 'boolean',
                    description: 'Indicates if the location is pickable.',
                    examples: [true],
                  },
                  sellable: {
                    type: 'boolean',
                    description: 'Indicates if the location is sellable.',
                    examples: [true],
                  },
                  is_tote: {
                    type: 'boolean',
                    description: 'Indicates if the location is a tote.',
                    examples: [false],
                  },
                  is_putaway: {
                    type: 'boolean',
                    description:
                      'Indicates if the location is a putaway location.',
                    examples: [true],
                  },
                  priority: {
                    type: 'integer',
                    description: 'The priority of the location for picking.',
                    examples: [1],
                  },
                  warehouse: {
                    type: 'object',
                    description: 'The warehouse this location belongs to.',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'A unique identifier for the warehouse.',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the warehouse.',
                        examples: ['Main Warehouse'],
                      },
                    },
                  },
                  location_type: {
                    type: 'object',
                    description: 'The type of the location.',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the location type.',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the location type.',
                        examples: ['Shelf'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListOrders = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          api_id: {
            type: 'string',
            examples: ['1234567890'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The API ID of the order from the marketplace.',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
          updated_at_start: {
            type: 'string',
            format: 'date-time',
            examples: ['2024-07-24T17:09:00-07:00'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters orders by the specified `updated_at` start date.\n',
          },
          updated_at_end: {
            type: 'string',
            format: 'date-time',
            examples: ['2024-08-24T17:09:00-07:00'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters orders by the specified `updated_at` end date.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            orders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the order.\n',
                    examples: [231185181649],
                  },
                  created_at: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time when the order was created.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  updated_at: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time when the order was last updated.\n',
                    examples: ['2024-07-24T17:09:02-07:00'],
                  },
                  api_id: {
                    type: 'string',
                    description:
                      'The API ID of the order from the marketplace.\n',
                    examples: ['1234567890'],
                  },
                  hold_until_date: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time until which to hold the order.\n',
                    examples: ['2024-07-24T17:09:02-07:00'],
                  },
                  total_amount: {
                    type: 'number',
                    description: 'The total amount of the order.\n',
                    examples: [100],
                  },
                  shipping_amount: {
                    type: 'number',
                    description: 'The shipping amount of the order.\n',
                    examples: [10],
                  },
                  tax_amount: {
                    type: 'number',
                    description: 'The tax amount of the order.\n',
                    examples: [10],
                  },
                  discount_amount: {
                    type: 'number',
                    description: 'The discount amount of the order.\n',
                    examples: [10],
                  },
                  subtotal_amount: {
                    type: 'number',
                    description: 'The subtotal amount of the order.\n',
                    examples: [100],
                  },
                  status: {
                    type: 'string',
                    description:
                      'The current custom status of the order. These statuses are manually created in Warehance and can be set via automation rules or manually.\n',
                    examples: ['processing'],
                  },
                  fulfillment_status: {
                    type: 'string',
                    description:
                      'The fulfillment status of the order, indicating whether the order has been fulfilled:\n  * `unfulfilled`: The order has not been fulfilled.\n  * `partially_fulfilled`: The order has been partially fulfilled.\n  * `fulfilled`: The order has been completely fulfilled.\n  * `cancelled`: The order has been cancelled.\n  * `in_progress`: The order fulfillment is in progress.\n',
                    examples: ['unfulfilled'],
                  },
                  order_number: {
                    type: 'string',
                    description:
                      'The unique order number assigned to the order.\n',
                    examples: ['1B8C7E567'],
                  },
                  cancelled: {
                    type: 'boolean',
                    description:
                      'Indicates whether the order has been cancelled.\n',
                    examples: [false],
                  },
                  order_date: {
                    type: 'string',
                    format: 'date-time',
                    description:
                      'The date and time when the order was placed.\n',
                    examples: ['2024-07-24T17:09:00-07:00'],
                  },
                  order_items: {
                    type: 'array',
                    description: 'A list of items in the order.\n',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'integer',
                          description: 'A unique identifier for the item.\n',
                          examples: [231185181773],
                        },
                        sku: {
                          type: 'string',
                          description:
                            'The SKU (Stock Keeping Unit) of the item.\n',
                          examples: ['WHITE'],
                        },
                        name: {
                          type: 'string',
                          description: 'The name of the item.\n',
                          examples: ['White T Shirt'],
                        },
                        quantity: {
                          type: 'integer',
                          description:
                            'The quantity of the item expected to be fulfilled. This usually represents the quantity ordered and may go to 0 if the order is cancelled.\n',
                          examples: [1],
                        },
                        quantity_shipped: {
                          type: 'integer',
                          description:
                            'The quantity of the item that has been shipped.\n',
                          examples: [0],
                        },
                        cancelled: {
                          type: 'boolean',
                          description:
                            'Indicates whether the item has been cancelled.\n',
                          examples: [false],
                        },
                      },
                    },
                  },
                  store: {
                    type: 'object',
                    description: 'The store associated with the order.\n',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'A unique identifier for the store.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the store.\n',
                        examples: ['Main Store'],
                      },
                    },
                  },
                  client: {
                    type: 'object',
                    description: 'The client associated with the order.\n',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'A unique identifier for the client.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the client.\n',
                        examples: ['Acme Inc.'],
                      },
                    },
                  },
                  warehouse: {
                    type: 'object',
                    description: 'The warehouse associated with the order.\n',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'A unique identifier for the warehouse.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the warehouse.\n',
                        examples: ['Main Warehouse'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListProducts = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
          updated_at_start: {
            type: 'string',
            format: 'date-time',
            examples: ['2024-07-24T17:09:00-07:00'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters orders by the specified `updated_at` start date.\n',
          },
          updated_at_end: {
            type: 'string',
            format: 'date-time',
            examples: ['2024-08-24T17:09:00-07:00'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters orders by the specified `updated_at` end date.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the product.',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the product.',
                    examples: ['White T Shirt'],
                  },
                  sku: {
                    type: 'string',
                    description: 'The SKU (Stock Keeping Unit) of the product.',
                    examples: ['WHITE'],
                  },
                  barcode: {
                    type: 'string',
                    description: 'The barcode of the product.',
                    examples: ['1234567890'],
                  },
                  weight: {
                    type: 'number',
                    description: 'The weight of the product in ounces.',
                    examples: [5],
                  },
                  length: {
                    type: 'number',
                    description: 'The length of the product in inches.',
                    examples: [10],
                  },
                  width: {
                    type: 'number',
                    description: 'The width of the product in inches.',
                    examples: [5],
                  },
                  height: {
                    type: 'number',
                    description: 'The height of the product in inches.',
                    examples: [5],
                  },
                  lot_required: {
                    type: 'boolean',
                    description:
                      'Indicates whether the product requires lot tracking.',
                    examples: [false],
                  },
                  is_bundle: {
                    type: 'boolean',
                    description:
                      'Indicates whether the product is a bundle parent.',
                    examples: [false],
                  },
                  on_hand: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently in stock.',
                    examples: [100],
                  },
                  allocated: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently allocated.',
                    examples: [10],
                  },
                  available: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently available.',
                    examples: [90],
                  },
                  backordered: {
                    type: 'integer',
                    description:
                      'The number of units of the product currently backordered.',
                    examples: [10],
                  },
                  inventory_by_location: {
                    type: 'array',
                    description: 'The inventory by location of the product.',
                    items: {
                      type: 'object',
                      properties: {
                        location_id: {
                          type: 'integer',
                          description: 'The ID of the location.',
                          examples: [1],
                        },
                        quantity: {
                          type: 'integer',
                          description:
                            'The quantity of the product in the location.',
                          examples: [100],
                        },
                        warehouse_id: {
                          type: 'integer',
                          description: 'The ID of the warehouse.',
                          examples: [1],
                        },
                        product_lot_id: {
                          type: 'integer',
                          description: 'The ID of the product lot.',
                          examples: [1],
                        },
                      },
                    },
                  },
                  inventory_by_warehouse: {
                    type: 'array',
                    description: 'The inventory by warehouse of the product.',
                    items: {
                      type: 'object',
                      properties: {
                        warehouse_id: {
                          type: 'integer',
                          description: 'The ID of the warehouse.',
                          examples: [1],
                        },
                        on_hand: {
                          type: 'integer',
                          description:
                            'The number of units of the product on hand in the warehouse.',
                          examples: [100],
                        },
                        allocated: {
                          type: 'integer',
                          description:
                            'The number of units of the product allocated in the warehouse.',
                          examples: [10],
                        },
                        available: {
                          type: 'integer',
                          description:
                            'The number of units of the product available in the warehouse.',
                          examples: [90],
                        },
                        backordered: {
                          type: 'integer',
                          description:
                            'The number of units of the product currently backordered in the warehouse.',
                          examples: [10],
                        },
                        damaged: {
                          type: 'integer',
                          description:
                            'The number of units of the product currently damaged in the warehouse.',
                          examples: [0],
                        },
                        non_sellable: {
                          type: 'integer',
                          description:
                            'The number of units of the product currently non-sellable in the warehouse.',
                          examples: [0],
                        },
                        on_order: {
                          type: 'integer',
                          description:
                            'The number of units of the product currently on order in the warehouse.',
                          examples: [0],
                        },
                        reserved: {
                          type: 'integer',
                          description:
                            'The number of units of the product currently reserved in the warehouse.',
                          examples: [0],
                        },
                      },
                    },
                  },
                  product_lots: {
                    type: 'array',
                    description: 'The product lots of the product.',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'integer',
                          description: 'The ID of the product lot.',
                          examples: [1],
                        },
                        lot_number: {
                          type: 'string',
                          description: 'The lot number of the product.',
                          examples: [1234567890],
                        },
                        expiration_date: {
                          type: 'string',
                          format: 'date-time',
                          description:
                            'The expiration date of the product lot.',
                          examples: ['2024-07-24T17:09:00-07:00'],
                        },
                      },
                    },
                  },
                  client: {
                    type: 'object',
                    description: 'The client of the product.',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'The ID of the client.',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the client.',
                        examples: ['Acme Inc.'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListShipments = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['created_at', 'shipment_cost'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the field by which to sort the returned shipments:\n* `created_at`: Sort by the creation date of the shipment.\n* `shipment_cost`: Sort by the cost of the shipment.\n',
          },
          created_at_date_start: {
            type: 'string',
            format: 'date-time',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The start date-time for filtering shipments created after this date.\n',
          },
          created_at_date_end: {
            type: 'string',
            format: 'date-time',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The end date-time for filtering shipments created before this date.\n',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
          updated_at_start: {
            type: 'string',
            format: 'date-time',
            examples: ['2024-07-24T17:09:00-07:00'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters orders by the specified `updated_at` start date.\n',
          },
          updated_at_end: {
            type: 'string',
            format: 'date-time',
            examples: ['2024-08-24T17:09:00-07:00'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters orders by the specified `updated_at` end date.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
        shipments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'integer',
                description: 'A unique identifier for the shipment.\n',
                examples: [231185181700],
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                description:
                  'The date and time when the shipment was created.\n',
              },
              voided: {
                type: 'boolean',
                description:
                  'Indicates whether the shipment has been voided.\n',
                examples: [false],
              },
              voided_at: {
                type: 'string',
                format: 'date-time',
                description:
                  'The date and time when the shipment was voided.\n',
              },
              shipment_cost: {
                type: 'number',
                format: 'float',
                description: 'The cost of the shipment.\n',
                examples: [15.99],
                minimum: -3.402823669209385e38,
                maximum: 3.402823669209385e38,
              },
              service_level: {
                type: 'string',
                description: 'The service level of the shipment.\n',
                examples: ['Ground'],
              },
              zone: {
                type: 'string',
                description: 'The zone of the shipment.\n',
                examples: ['1'],
              },
              is_third_party_billing: {
                type: 'boolean',
                description:
                  'Indicates whether the shipment is being billed by a third party.\n',
                examples: [false],
              },
              ship_to_address: {
                type: 'object',
                description:
                  'The address to which the shipment is being sent.\n',
                properties: {
                  first_name: {
                    type: 'string',
                    description:
                      'The first name associated with the address.\n',
                    examples: ['John'],
                  },
                  last_name: {
                    type: 'string',
                    description: 'The last name associated with the address.\n',
                    examples: ['Doe'],
                  },
                  company: {
                    type: 'string',
                    description:
                      'The company name associated with the address.\n',
                    examples: ['Acme Inc.'],
                  },
                  street1: {
                    type: 'string',
                    description: 'The first line of the street address.\n',
                    examples: ['123 Main St'],
                  },
                  street2: {
                    type: 'string',
                    description: 'The second line of the street address.\n',
                    examples: ['Suite 100'],
                  },
                  city: {
                    type: 'string',
                    description: 'The city of the address.\n',
                    examples: ['Anytown'],
                  },
                  state: {
                    type: 'string',
                    description: 'The state or province of the address.\n',
                    examples: ['CA'],
                  },
                  postal_code: {
                    type: 'string',
                    description: 'The postal or ZIP code of the address.\n',
                    examples: ['12345'],
                  },
                  country: {
                    type: 'string',
                    description:
                      'The full name of the country of the address.\n',
                    examples: ['United States'],
                  },
                  country_code: {
                    type: 'string',
                    description:
                      'The two-letter country code of the address.\n',
                    examples: ['US'],
                  },
                  phone: {
                    type: 'string',
                    description:
                      'The phone number associated with the address.\n',
                    examples: ['555-123-4567'],
                  },
                  email: {
                    type: 'string',
                    description:
                      'The email address associated with the address.\n',
                    examples: ['john.doe@example.com'],
                  },
                },
              },
              client: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the client.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the client.\n',
                    examples: ['Acme Inc.'],
                  },
                },
              },
              order: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the order.\n',
                    examples: [231185181649],
                  },
                  order_number: {
                    type: 'string',
                    description:
                      'The unique order number assigned to the order.\n',
                    examples: ['1B8C7E567'],
                  },
                  shipping_method: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the shipping method.\n',
                        examples: [201],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the shipping method.\n',
                        examples: ['Standard Shipping'],
                      },
                    },
                  },
                },
              },
              carrier_connection: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description:
                      'A unique identifier for the carrier connection.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the carrier connection.\n',
                    examples: ['Warehance UPS Connection'],
                  },
                  carrier: {
                    type: 'string',
                    description: 'The name of the carrier.\n',
                    examples: ['UPS'],
                  },
                  account_number: {
                    type: 'string',
                    description:
                      'The account number of the carrier connection if available.\n',
                    examples: [1234567890],
                  },
                },
              },
              shipment_parcels: {
                type: 'array',
                description: 'A list of parcels in the shipment.\n',
                items: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'integer',
                      description:
                        'A unique identifier for the shipment parcel.\n',
                      examples: [231185181800],
                    },
                    tracking_number: {
                      type: 'string',
                      description:
                        'The tracking number of the shipment parcel.\n',
                      examples: ['1Z999AA10123456784'],
                    },
                    tracking_url: {
                      type: 'string',
                      description: 'The tracking URL of the shipment parcel.\n',
                      examples: [
                        'https://carrier.example.com/track/1Z999AA10123456784',
                      ],
                    },
                    weight: {
                      type: 'number',
                      format: 'float',
                      description: 'The weight of the parcel in ounces.\n',
                      examples: [5],
                      minimum: -3.402823669209385e38,
                      maximum: 3.402823669209385e38,
                    },
                    height: {
                      type: 'number',
                      format: 'float',
                      description: 'The height of the parcel in inches.\n',
                      examples: [5],
                      minimum: -3.402823669209385e38,
                      maximum: 3.402823669209385e38,
                    },
                    width: {
                      type: 'number',
                      format: 'float',
                      description: 'The width of the parcel in inches.\n',
                      examples: [5],
                      minimum: -3.402823669209385e38,
                      maximum: 3.402823669209385e38,
                    },
                    length: {
                      type: 'number',
                      format: 'float',
                      description: 'The length of the parcel in inches.\n',
                      examples: [5],
                      minimum: -3.402823669209385e38,
                      maximum: 3.402823669209385e38,
                    },
                    box: {
                      type: 'string',
                      description:
                        'The name of the box used to ship the parcel.\n',
                      examples: ['Custom Box'],
                    },
                    items: {
                      type: 'array',
                      description: 'A list of items contained in the parcel.\n',
                      items: {
                        type: 'object',
                        properties: {
                          quantity: {
                            type: 'integer',
                            description:
                              'The quantity of the product in the parcel.\n',
                            examples: [1],
                          },
                          product: {
                            type: 'object',
                            properties: {
                              id: {
                                type: 'integer',
                                description:
                                  'A unique identifier for the product.\n',
                                examples: [231185181649],
                              },
                              name: {
                                type: 'string',
                                description: 'The name of the product.\n',
                                examples: ['White T Shirt'],
                              },
                            },
                          },
                        },
                      },
                    },
                    tracking_events: {
                      type: 'array',
                      description:
                        'A list of tracking events for the parcel.\n',
                      items: {
                        type: 'object',
                        properties: {
                          status: {
                            type: 'string',
                            description: 'The status of the tracking event.\n',
                            examples: ['in_transit'],
                          },
                          status_detail: {
                            type: 'string',
                            description:
                              'The detailed status of the tracking event.\n',
                            examples: ['received_at_destination_facility'],
                          },
                          timestamp: {
                            type: 'string',
                            format: 'date-time',
                            description:
                              'The date and time when the tracking event occurred.\n',
                            examples: ['2024-07-24T17:09:00-07:00'],
                          },
                          city: {
                            type: 'string',
                            description:
                              'The city where the tracking event occurred.\n',
                            examples: ['Anytown'],
                          },
                          state: {
                            type: 'string',
                            description:
                              'The state where the tracking event occurred.\n',
                            examples: ['CA'],
                          },
                          country: {
                            type: 'string',
                            description:
                              'The country where the tracking event occurred.\n',
                            examples: ['United States'],
                          },
                          postal_code: {
                            type: 'string',
                            description:
                              'The postal code where the tracking event occurred.\n',
                            examples: ['12345'],
                          },
                          estimate_delivery_date: {
                            type: 'string',
                            format: 'date-time',
                            description:
                              'The estimated delivery date for the tracking event.\n',
                            examples: ['2024-07-24T17:09:00-07:00'],
                          },
                        },
                      },
                    },
                  },
                },
              },
              warehouse: {
                type: 'object',
                description: 'The warehouse associated with the shipment.\n',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the warehouse.\n',
                    examples: [1],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the warehouse.\n',
                    examples: ['Main Warehouse'],
                  },
                },
              },
            },
          },
        },
        total_count: {
          type: 'integer',
          description: 'The total number of shipments available.\n',
          examples: [1],
        },
        filtered_count: {
          type: 'integer',
          description: 'The number of shipments returned in this response.\n',
          examples: [1],
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListShippingMethods = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
          store_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Filters shipping methods by the specified `store_id`. Must be a valid store ID belonging to your organization or client.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            shipping_methods: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description:
                      'A unique identifier for the shipping method.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the shipping method.\n',
                    examples: ['Free Shipping'],
                  },
                  max_delivery_days: {
                    type: 'integer',
                    description:
                      'The maximum number of days it takes to deliver the shipping method.\n',
                    examples: [7],
                  },
                  mapped: {
                    type: 'boolean',
                    description:
                      'Whether the shipping method is mapped to a store.\n',
                    examples: [true],
                  },
                  store: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'A unique identifier for the store.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the store.\n',
                        examples: ['Acme Inc. Shopify Store'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListStores = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            stores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the store.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the store.\n',
                    examples: ['Acme Inc. Shopify Store'],
                  },
                  marketplace: {
                    type: 'object',
                    description: 'The marketplace associated with the store.\n',
                    properties: {
                      id: {
                        type: 'integer',
                        description:
                          'A unique identifier for the marketplace.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the marketplace.\n',
                        examples: ['Shopify'],
                      },
                      thumbnail_url: {
                        type: 'string',
                        format: 'uri',
                        description:
                          "The URL of the marketplace's thumbnail image.\n",
                        examples: ['https://example.com/thumbnail.png'],
                      },
                    },
                  },
                  client: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                        description: 'A unique identifier for the client.\n',
                        examples: [1],
                      },
                      name: {
                        type: 'string',
                        description: 'The name of the client.\n',
                        examples: ['Acme Inc.'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListUsers = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
          client_id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Only applicable for organizations. Filters items by the specified client_id, provided the client_id belongs to the organization. Note: API keys can belong to either client level or organization level.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the user.\n',
                    examples: [231185181649],
                  },
                  first_name: {
                    type: 'string',
                    description: 'The first name of the user.\n',
                    examples: ['John'],
                  },
                  last_name: {
                    type: 'string',
                    description: 'The last name of the user.\n',
                    examples: ['Doe'],
                  },
                  email: {
                    type: 'string',
                    description: 'The email address of the user.\n',
                    examples: ['john.doe@example.com'],
                  },
                  role: {
                    type: 'string',
                    description:
                      'The role of the user.\n\n\n`organization_admin` `organization_user` `client_admin` `client_user`',
                    enum: [
                      'organization_admin',
                      'organization_user',
                      'client_admin',
                      'client_user',
                    ],
                    examples: ['organization_admin'],
                  },
                  avatar_url: {
                    type: 'string',
                    format: 'uri',
                    description: "The URL of the user's avatar image.\n",
                    examples: ['https://example.com/avatar.png'],
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const ListWarehouses = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          sort_by: {
            type: 'string',
            enum: ['created_at', 'name'],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the field by which to sort the returned warehouses:\n* `created_at`: Sort by the creation date of the warehouse.\n* `name`: Sort by the name of the warehouse.\n',
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 25,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The maximum number of items to return in the response. Used for pagination. Must be between 1 and 100.\n',
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The number of items to skip before starting to return results. Used for pagination.\n',
          },
          order_by: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'Specifies the sort direction of the returned items:\n  * `asc`: Ascending order. For dates, this means from oldest to newest. For numbers, this means from smallest to largest.\n  * `desc`: Descending order. For dates, this means from newest to oldest. For numbers, this means from largest to smallest.\n',
          },
          search_value: {
            type: 'string',
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'A value to search for within the items. The specific fields searched depend on the endpoint.\n',
          },
        },
        required: [],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            warehouses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'integer',
                    description: 'A unique identifier for the warehouse.\n',
                    examples: [231185181649],
                  },
                  name: {
                    type: 'string',
                    description: 'The name of the warehouse.\n',
                    examples: ['Acme Inc. Warehouse'],
                  },
                  ship_from_address: {
                    type: 'object',
                    properties: {
                      first_name: {
                        type: 'string',
                        description:
                          'The first name associated with the address.\n',
                        examples: ['John'],
                      },
                      last_name: {
                        type: 'string',
                        description:
                          'The last name associated with the address.\n',
                        examples: ['Doe'],
                      },
                      company: {
                        type: 'string',
                        description:
                          'The company name associated with the address.\n',
                        examples: ['Acme Inc.'],
                      },
                      street1: {
                        type: 'string',
                        description: 'The first line of the street address.\n',
                        examples: ['123 Main St'],
                      },
                      street2: {
                        type: 'string',
                        description: 'The second line of the street address.\n',
                        examples: ['Suite 100'],
                      },
                      city: {
                        type: 'string',
                        description: 'The city of the address.\n',
                        examples: ['Anytown'],
                      },
                      state: {
                        type: 'string',
                        description: 'The state or province of the address.\n',
                        examples: ['CA'],
                      },
                      postal_code: {
                        type: 'string',
                        description: 'The postal or ZIP code of the address.\n',
                        examples: ['12345'],
                      },
                      country: {
                        type: 'string',
                        description:
                          'The full name of the country of the address.\n',
                        examples: ['United States'],
                      },
                      country_code: {
                        type: 'string',
                        description:
                          'The two-letter country code of the address.\n',
                        examples: ['US'],
                      },
                      phone: {
                        type: 'string',
                        description:
                          'The phone number associated with the address.\n',
                        examples: ['555-123-4567'],
                      },
                      email: {
                        type: 'string',
                        description:
                          'The email address associated with the address.\n',
                        examples: ['john.doe@example.com'],
                      },
                    },
                  },
                  return_address: {
                    type: 'object',
                    properties: {
                      first_name: {
                        type: 'string',
                        description:
                          'The first name associated with the address.\n',
                        examples: ['John'],
                      },
                      last_name: {
                        type: 'string',
                        description:
                          'The last name associated with the address.\n',
                        examples: ['Doe'],
                      },
                      company: {
                        type: 'string',
                        description:
                          'The company name associated with the address.\n',
                        examples: ['Acme Inc.'],
                      },
                      street1: {
                        type: 'string',
                        description: 'The first line of the street address.\n',
                        examples: ['123 Main St'],
                      },
                      street2: {
                        type: 'string',
                        description: 'The second line of the street address.\n',
                        examples: ['Suite 100'],
                      },
                      city: {
                        type: 'string',
                        description: 'The city of the address.\n',
                        examples: ['Anytown'],
                      },
                      state: {
                        type: 'string',
                        description: 'The state or province of the address.\n',
                        examples: ['CA'],
                      },
                      postal_code: {
                        type: 'string',
                        description: 'The postal or ZIP code of the address.\n',
                        examples: ['12345'],
                      },
                      country: {
                        type: 'string',
                        description:
                          'The full name of the country of the address.\n',
                        examples: ['United States'],
                      },
                      country_code: {
                        type: 'string',
                        description:
                          'The two-letter country code of the address.\n',
                        examples: ['US'],
                      },
                      phone: {
                        type: 'string',
                        description:
                          'The phone number associated with the address.\n',
                        examples: ['555-123-4567'],
                      },
                      email: {
                        type: 'string',
                        description:
                          'The email address associated with the address.\n',
                        examples: ['john.doe@example.com'],
                      },
                    },
                  },
                },
              },
            },
            total_count: { type: 'integer', examples: [1] },
            filtered_count: { type: 'integer', examples: [1] },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PatchOrdersId = {
  body: {
    type: 'object',
    properties: {
      shipping_method_id: {
        type: 'integer',
        minimum: 1,
        description: 'The ID of the new shipping method for the order.',
      },
      warehouse_id: {
        type: 'integer',
        minimum: 1,
        description: 'The ID of the new warehouse fulfilling this order.',
      },
      hold_until_date: {
        type: 'string',
        format: 'date-time',
        description: 'The new date and time until which to hold the order.',
      },
      ignore_address_validation: {
        type: 'boolean',
        description: 'Whether to ignore address validation errors.',
      },
      exclude_from_batch_shipping: {
        type: 'boolean',
        description: 'Whether to exclude the order from batch shipping.',
      },
      exclude_from_picking: {
        type: 'boolean',
        description: 'Whether to exclude the order from picking.',
      },
      address_hold: {
        type: 'boolean',
        description: 'Set address hold to true or false.',
      },
      payment_hold: {
        type: 'boolean',
        description: 'Set payment hold to true or false.',
      },
      warehouse_hold: {
        type: 'boolean',
        description: 'Set warehouse hold to true or false.',
      },
      allocation_hold: {
        type: 'boolean',
        description: 'Set allocation hold to true or false.',
      },
      fraud_hold: {
        type: 'boolean',
        description: 'Set fraud hold to true or false.',
      },
      packing_note: {
        type: 'string',
        description: 'A note about the packing of the order.',
        examples: ['Packing note'],
      },
      gift_note: {
        type: 'string',
        description: 'A note about the gift of the order.',
        examples: ['Gift note'],
      },
      internal_note: {
        type: 'string',
        description: 'A note about the order for internal use.',
        examples: ['Internal note'],
      },
    },
    description: 'An object containing the fields to update in the order.',
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the order to update.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            message: {
              type: 'string',
              examples: ['Order updated successfully'],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PatchOrdersIdShippingAddress = {
  body: {
    type: 'object',
    properties: {
      shipping_address: {
        type: 'object',
        required: [
          'first_name',
          'street1',
          'city',
          'state',
          'postal_code',
          'country_code',
        ],
        properties: {
          first_name: {
            type: 'string',
            description: 'The first name associated with the address.\n',
            examples: ['John'],
          },
          last_name: {
            type: 'string',
            description: 'The last name associated with the address.\n',
            examples: ['Doe'],
          },
          company: {
            type: 'string',
            description: 'The company name associated with the address.\n',
            examples: ['Acme Inc.'],
          },
          street1: {
            type: 'string',
            description: 'The first line of the street address.\n',
            examples: ['123 Main St'],
          },
          street2: {
            type: 'string',
            description: 'The second line of the street address.\n',
            examples: ['Suite 100'],
          },
          city: {
            type: 'string',
            description: 'The city of the address.\n',
            examples: ['Anytown'],
          },
          state: {
            type: 'string',
            description: 'The state or province of the address.\n',
            examples: ['CA'],
          },
          postal_code: {
            type: 'string',
            description: 'The postal or ZIP code of the address.\n',
            examples: ['12345'],
          },
          country: {
            type: 'string',
            description: 'The full name of the country of the address.\n',
            examples: ['United States'],
          },
          country_code: {
            type: 'string',
            description: 'The two-letter country code of the address.\n',
            examples: ['US'],
          },
          phone: {
            type: 'string',
            description: 'The phone number associated with the address.\n',
            examples: ['555-123-4567'],
          },
          email: {
            type: 'string',
            description: 'The email address associated with the address.\n',
            examples: ['john.doe@example.com'],
          },
        },
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description:
              'The ID of the order to update the shipping address for.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PatchShipmentParcelsId = {
  body: {
    type: 'object',
    properties: {
      tracking_number: {
        type: 'string',
        description: 'The tracking number of the shipment parcel.',
      },
      tracking_url: {
        type: 'string',
        description: 'The tracking URL of the shipment parcel.',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the shipment parcel to update.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            message: {
              type: 'string',
              examples: ['Shipment parcel updated successfully'],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostBills = {
  body: {
    type: 'object',
    required: ['billing_profile_id', 'client_id', 'start_date', 'end_date'],
    properties: {
      billing_profile_id: {
        type: 'integer',
        minimum: 1,
        description:
          'The ID of the billing profile associated to use for generating the bill.',
        examples: [1],
      },
      client_id: {
        type: 'integer',
        minimum: 1,
        description: 'The ID of the client to generate the bill for.',
        examples: [1],
      },
      start_date: {
        type: 'string',
        format: 'date-time',
        description: 'The start date of the bill.',
        examples: ['2021-01-01T00:00:00Z'],
      },
      end_date: {
        type: 'string',
        format: 'date-time',
        description: 'The end date of the bill.',
        examples: ['2021-02-01T00:00:00Z'],
      },
      bill_name: {
        type: 'string',
        description: 'The name of the bill.',
        examples: ['January 2021 Bill'],
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the newly created bill.',
              examples: [12345],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostBillsIdLineItems = {
  body: {
    type: 'object',
    required: ['line_items'],
    properties: {
      line_items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['amount', 'charge_category', 'date', 'description'],
          properties: {
            amount: {
              type: 'number',
              description: 'The amount of the line item.',
              examples: [100],
            },
            charge_category: {
              type: 'string',
              enum: [
                'storage',
                'picking',
                'shipments',
                'shipment_parcels',
                'returns',
                'return_labels',
                'recurring_fees',
                'adhoc',
              ],
              description: 'The category of the charge.',
              examples: ['storage'],
            },
            date: {
              type: 'string',
              format: 'date-time',
              description: 'The date of the line item.',
              examples: ['2021-01-01T00:00:00Z'],
            },
            description: {
              type: 'string',
              description: 'The description of the line item.',
              examples: ['Storage Charge'],
            },
            order_id: {
              type: 'integer',
              description: 'The ID of the order associated with the line item.',
              examples: [1],
            },
            shipment_id: {
              type: 'integer',
              description:
                'The ID of the shipment associated with the line item.',
              examples: [1],
            },
            return_id: {
              type: 'integer',
              description:
                'The ID of the return associated with the line item.',
              examples: [1],
            },
            location_id: {
              type: 'integer',
              description:
                'The ID of the location associated with the line item.',
              examples: [1],
            },
            product_id: {
              type: 'integer',
              description:
                'The ID of the product associated with the line item.',
              examples: [1],
            },
            shipment_parcel_id: {
              type: 'integer',
              description:
                'The ID of the shipment parcel associated with the line item.',
              examples: [1],
            },
          },
        },
        description: 'The line items to create.',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            examples: [1],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the bill to create line items for.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostInboundShipments = {
  body: {
    type: 'object',
    required: ['warehouse_id'],
    properties: {
      warehouse_id: {
        type: 'integer',
        minimum: 1,
        description:
          'The ID of the warehouse associated with this inbound shipment.',
        examples: [12345],
      },
      client_id: {
        type: 'integer',
        minimum: 1,
        description:
          'The ID of the client associated with this inbound shipment. (Required for organization level keys)',
        examples: [12345],
      },
      reference_number: {
        type: 'string',
        description: 'An optional reference number for the inbound shipment.',
        examples: ['12345'],
      },
      expected_date: {
        type: 'string',
        format: 'date-time',
        description: 'The expected date of the inbound shipment.',
        examples: ['2021-01-01T00:00:00Z'],
      },
      ship_date: {
        type: 'string',
        format: 'date-time',
        description: 'The date the inbound shipment was shipped.',
        examples: ['2021-01-01T00:00:00Z'],
      },
      tracking_number: {
        type: 'string',
        description: 'The tracking number for the inbound shipment.',
        examples: ['12345'],
      },
      tracking_url: {
        type: 'string',
        description: 'The URL for the tracking of the inbound shipment.',
        examples: ['https://www.carrier.com/track?trackingNumber=12345'],
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            product_id: {
              type: 'integer',
              minimum: 1,
              description:
                'The ID of the product associated with this inbound shipment item.',
              examples: [12345],
            },
            ordered: {
              type: 'integer',
              minimum: 1,
              description: 'The number of items ordered.',
              examples: [1000],
            },
            sell_ahead: {
              type: 'integer',
              minimum: 1,
              description: 'The number of items to be sold ahead.',
              examples: [500],
            },
          },
        },
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the newly created inbound shipment.',
              examples: [12345],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostInventoryAdjust = {
  body: {
    type: 'object',
    required: ['product_id', 'quantity', 'location_id'],
    properties: {
      product_id: {
        type: 'integer',
        description: 'The ID of the product to adjust.',
        examples: [231185181649],
      },
      location_id: {
        type: 'integer',
        description: 'The ID of the location to adjust.',
        examples: [231185181649],
      },
      quantity: {
        type: 'integer',
        description:
          'The quantity to adjust. This can be a positive or negative integer.',
        examples: [10],
      },
      damaged: {
        type: 'boolean',
        description: 'Whether the inventory being adjusted is damaged.',
        examples: [false],
      },
      inventory_adjustment_reason_id: {
        type: 'integer',
        description: 'The ID of a pre-defined inventory adjustment reason.',
        examples: [1],
      },
      inventory_adjustment_reason: {
        type: 'string',
        description: 'The reason for the inventory adjustment.',
        examples: ['Initial Import'],
      },
      product_lot_id: {
        type: 'integer',
        description:
          'The ID of the product lot which the inventory is being adjusted for.',
        examples: [1],
      },
      note: {
        type: 'string',
        description: 'A note about the inventory adjustment.',
        examples: ['Initial Import'],
      },
    },
    description: 'An object containing the fields to adjust the inventory.',
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostOrderItemsIdCancel = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            examples: [12345],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the order item to cancel.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostOrders = {
  body: {
    type: 'object',
    required: [
      'store_id',
      'shipping_method_id',
      'warehouse_id',
      'shipping_address',
      'items',
    ],
    properties: {
      store_id: {
        type: 'integer',
        minimum: 1,
        description: 'The ID of the store associated with this order.',
        examples: [1],
      },
      shipping_method_id: {
        type: 'integer',
        minimum: 1,
        description: 'The ID of the shipping method for this order.',
        examples: [1],
      },
      warehouse_id: {
        type: 'integer',
        minimum: 1,
        description: 'The ID of the warehouse fulfilling this order.',
        examples: [1],
      },
      shipping_address: {
        type: 'object',
        properties: {
          first_name: {
            type: 'string',
            description: 'The first name associated with the address.\n',
            examples: ['John'],
          },
          last_name: {
            type: 'string',
            description: 'The last name associated with the address.\n',
            examples: ['Doe'],
          },
          company: {
            type: 'string',
            description: 'The company name associated with the address.\n',
            examples: ['Acme Inc.'],
          },
          street1: {
            type: 'string',
            description: 'The first line of the street address.\n',
            examples: ['123 Main St'],
          },
          street2: {
            type: 'string',
            description: 'The second line of the street address.\n',
            examples: ['Suite 100'],
          },
          city: {
            type: 'string',
            description: 'The city of the address.\n',
            examples: ['Anytown'],
          },
          state: {
            type: 'string',
            description: 'The state or province of the address.\n',
            examples: ['CA'],
          },
          postal_code: {
            type: 'string',
            description: 'The postal or ZIP code of the address.\n',
            examples: ['12345'],
          },
          country: {
            type: 'string',
            description: 'The full name of the country of the address.\n',
            examples: ['United States'],
          },
          country_code: {
            type: 'string',
            description: 'The two-letter country code of the address.\n',
            examples: ['US'],
          },
          phone: {
            type: 'string',
            description: 'The phone number associated with the address.\n',
            examples: ['555-123-4567'],
          },
          email: {
            type: 'string',
            description: 'The email address associated with the address.\n',
            examples: ['john.doe@example.com'],
          },
        },
      },
      order_number: {
        type: 'string',
        minLength: 1,
        description: 'An optional custom order number.',
        examples: ['ORD-12345'],
      },
      total: {
        type: 'number',
        format: 'float',
        description: 'The total amount of the order.',
        examples: [99.99],
        minimum: -3.402823669209385e38,
        maximum: 3.402823669209385e38,
      },
      hold_until_date: {
        type: 'string',
        format: 'date-time',
        description: 'The date and time until which to hold the order.',
        examples: ['2024-07-24T17:09:00-07:00'],
      },
      packing_note: {
        type: 'string',
        description: 'A note about the packing of the order.',
        examples: ['Packing note'],
      },
      gift_note: {
        type: 'string',
        description: 'A note about the gift of the order.',
        examples: ['Gift note'],
      },
      internal_note: {
        type: 'string',
        description: 'A note about the order for internal use.',
        examples: ['Internal note'],
      },
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: {
              type: 'integer',
              minimum: 1,
              description: 'The ID of the product in this order item.',
              examples: [1],
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'The quantity of the product in this order item.',
              examples: [2],
            },
          },
        },
      },
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'url', 'file_extension'],
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'The name of the attachment.',
              examples: ['Invoice'],
            },
            url: {
              type: 'string',
              minLength: 1,
              description: 'The URL of the attachment.',
              examples: ['https://example.com/attachments/invoice.pdf'],
            },
            file_extension: {
              type: 'string',
              minLength: 1,
              description: 'The file extension of the attachment.',
              examples: ['pdf'],
            },
          },
        },
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the newly created order.',
              examples: [12345],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostOrdersId = {
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            examples: [12345],
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the order to cancel.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostOrdersIdAttachments = {
  body: {
    type: 'object',
    required: ['attachments'],
    properties: {
      attachments: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'url', 'file_extension'],
          properties: {
            name: {
              type: 'string',
              description: 'The name of the attachment.',
              examples: ['Order Attachment'],
            },
            url: {
              type: 'string',
              description: 'The URL of the attachment.',
              examples: ['https://example.com/order-attachment.pdf'],
            },
            file_extension: {
              type: 'string',
              description: 'The file extension of the attachment.',
              examples: ['pdf'],
            },
          },
        },
        description: 'The attachments to create.',
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the order to create the attachments for.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostProducts = {
  body: {
    type: 'object',
    required: ['name', 'client_id', 'sku'],
    properties: {
      client_id: {
        type: 'integer',
        minimum: 1,
        description:
          'The ID of the client associated with this product. Only applicable for requests made by organization level API keys.',
        examples: [1],
      },
      name: {
        type: 'string',
        minLength: 1,
        description: 'The name of the product.',
        examples: ['White T Shirt'],
      },
      sku: {
        type: 'string',
        minLength: 1,
        description: 'The SKU (Stock Keeping Unit) of the product.',
        examples: ['WHITE'],
      },
      value: {
        type: 'number',
        format: 'float',
        description: 'The value of the product.',
        examples: [19.99],
        minimum: -3.402823669209385e38,
        maximum: 3.402823669209385e38,
      },
      barcode: {
        type: 'string',
        minLength: 1,
        description: 'The barcode of the product.',
        examples: ['1234567890'],
      },
      requires_product_lot: {
        type: 'boolean',
        description: 'Indicates whether the product requires lot tracking.',
        default: false,
        examples: [false],
      },
      replenishment_level: {
        type: 'integer',
        description:
          'The minimum quantity of the product to maintain in stock.',
        default: 0,
        examples: [10],
      },
      description: {
        type: 'string',
        description: 'A description of the product.',
        examples: ['A white T-shirt for casual wear.'],
      },
      weight: {
        type: 'number',
        format: 'float',
        description: 'The weight of the product in ounces.',
        default: 0,
        examples: [5],
        minimum: -3.402823669209385e38,
        maximum: 3.402823669209385e38,
      },
      length: {
        type: 'number',
        format: 'float',
        description: 'The length of the product in inches.',
        default: 0,
        examples: [10],
        minimum: -3.402823669209385e38,
        maximum: 3.402823669209385e38,
      },
      width: {
        type: 'number',
        format: 'float',
        description: 'The width of the product in inches.',
        default: 0,
        examples: [5],
        minimum: -3.402823669209385e38,
        maximum: 3.402823669209385e38,
      },
      height: {
        type: 'number',
        format: 'float',
        description: 'The height of the product in inches.',
        default: 0,
        examples: [5],
        minimum: -3.402823669209385e38,
        maximum: 3.402823669209385e38,
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          properties: {
            id: {
              type: 'integer',
              description: 'The ID of the newly created product.',
              examples: [12345],
            },
          },
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
const PostProductsIdComponents = {
  body: {
    type: 'object',
    required: ['components'],
    properties: {
      components: {
        type: 'array',
        items: {
          type: 'object',
          required: ['product_id', 'quantity'],
          properties: {
            product_id: {
              type: 'integer',
              description: 'The ID of the product to add to the bundle.',
              examples: [1255468531],
            },
            quantity: {
              type: 'integer',
              description:
                'The quantity of the component to add to the bundle.',
              examples: [1],
            },
          },
        },
        description: 'The components to add to the bundle.',
      },
      resync_unfulfilled_orders: {
        type: 'boolean',
        description:
          'Whether to resync unfulfilled orders for the bundle parent product.',
        examples: [false],
      },
    },
    $schema: 'http://json-schema.org/draft-04/schema#',
  },
  metadata: {
    allOf: [
      {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            minimum: 1,
            $schema: 'http://json-schema.org/draft-04/schema#',
            description: 'The ID of the product to add the component to.',
          },
        },
        required: ['id'],
      },
    ],
  },
  response: {
    '200': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
    '400': {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description:
            'Indicates the status of the request:\n* `success`: The request was processed successfully without any issues.\n* `partial_success`: The request was partially processed, but some issues or errors occurred.\n* `error`: The request failed to process due to errors.\n',
          examples: ['success'],
        },
        status_code: {
          type: 'integer',
          description:
            'The HTTP status code that indicates the outcome of the request:\n* `200`: The request was successful.\n* `400`: The request was malformed or contains invalid parameters.\n* `500`: An internal server error occurred while processing the request.\n',
          examples: [200],
        },
        request_id: {
          type: 'string',
          description:
            'A unique identifier for the request, used for tracking and troubleshooting purposes.\n',
          examples: ['7c82b8fc-a963-40f9-b7ee-f5565949ab15'],
        },
        data: {
          type: 'object',
          description: 'Contains the data related to the request.\n',
          additionalProperties: true,
        },
        errors: {
          type: 'array',
          description:
            'A list of error objects providing details about any errors that occurred during the request.\n',
          items: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description:
                  'A code representing the type of error. The possible values are:\n* `INVALID_API_KEY`: The provided API key is invalid.\n* `RATE_LIMIT_EXCEEDED`: The rate limit for requests has been exceeded.\n* `INTERNAL_ERROR`: An internal server error occurred.\n* `PERMISSION_DENIED`: The request is denied due to insufficient permissions.\n* `INVALID_REQUEST_FIELD`: The request contains invalid fields.\n',
                examples: ['INVALID_REQUEST_FIELD'],
              },
              message: {
                type: 'string',
                description: 'A message providing details about the error.\n',
                examples: ['order_by must be one of [asc desc]'],
              },
              suggestion: {
                type: 'string',
                description: 'A suggestion on how to resolve the error.\n',
                examples: [
                  'Ensure that all fields are a valid type, required fields are present, and values are within the correct range',
                ],
              },
              documentation_url: {
                type: 'string',
                description:
                  'A URL pointing to the documentation that provides more details about the error.\n',
              },
            },
          },
        },
      },
      $schema: 'http://json-schema.org/draft-04/schema#',
    },
  },
} as const;
export {
  GetAuthCheck,
  GetOrdersId,
  GetProductsId,
  ListBillLineItems,
  ListBillingProfiles,
  ListBills,
  ListClients,
  ListInboundShipments,
  ListLocations,
  ListOrders,
  ListProducts,
  ListShipments,
  ListShippingMethods,
  ListStores,
  ListUsers,
  ListWarehouses,
  PatchOrdersId,
  PatchOrdersIdShippingAddress,
  PatchShipmentParcelsId,
  PostBills,
  PostBillsIdLineItems,
  PostInboundShipments,
  PostInventoryAdjust,
  PostOrderItemsIdCancel,
  PostOrders,
  PostOrdersId,
  PostOrdersIdAttachments,
  PostProducts,
  PostProductsIdComponents,
};
