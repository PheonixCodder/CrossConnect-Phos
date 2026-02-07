export type ListStore = {
    [x: string]: unknown;
    id?: number | undefined;
    name?: string | undefined;
    marketplace?:
        | {
        [x: string]: unknown;
        id?: number | undefined;
        name?: string | undefined;
        thumbnail_url?: string | undefined;
    }
        | undefined;
    client?:
        | {
        [x: string]: unknown;
        id?: number | undefined;
        name?: string | undefined;
    }
        | undefined;
};


export interface TikTokAuthorizedShop {
    /**
     * The critical encrypted token required for query parameters in
     * all subsequent TikTok API calls (e.g., ?shop_cipher=...).
     */
    cipher: string;

    /** The public Shop Code visible in the TikTok Seller Center. */
    code: string;

    /** Internal unique identifier for the shop. */
    id: string;

    /** Display name of the TikTok Shop. */
    name: string;

    /** The geographic region (e.g., 'US', 'GB', 'ID'). */
    region: string;

    /**
     * The type of seller account.
     * CROSS_BORDER: Multiple shops in different countries.
     * LOCAL: Single shop in a specific region.
     */
    sellerType: 'CROSS_BORDER' | 'LOCAL' | string;
}

/**
 * The expected structure of the shop list stored in your Database/State.
 */
export interface TikTokShopsState {
    shops: TikTokAuthorizedShop[];
}
