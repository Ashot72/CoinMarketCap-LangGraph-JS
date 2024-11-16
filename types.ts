
interface Status {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
}

interface CoinInfo {
    id: number;
    name: string;
    symbol: string;
    category: string;
    description: string;
    slug: string;
    logo: string;
    subreddit: string;
    notice?: string;
    tags: string[];
    tag_names: string[];
    tag_groups: string[];
    urls: CryptoURLs;
    platform?: Platform;
    date_added: string;
    twitter_username?: string;
    is_hidden: number;
}

interface CryptoURLs {
    website: string[];
    technical_doc: string[];
    twitter?: string[];
    reddit?: string[];
    message_board?: string[];
    announcement?: string[];
    chat?: string[];
    explorer: string[];
    source_code: string[];
}

interface Platform {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    token_address: string;
}

/* ---   CryptoInfo --- */

export interface CryptoInfo {
    status: Status;
    data: {
        [key: string]: CoinInfo;
    };
}

interface CryptocurrencyQuote {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    is_active: number;
    is_fiat: number;
    circulating_supply: number;
    total_supply: number;
    max_supply?: number;
    date_added: string;
    num_market_pairs: number;
    cmc_rank: number;
    last_updated: string;
    quote: {
        [currency: string]: QuoteDetails;
    };
}

interface QuoteDetails {
    price: number;
    volume_24h: number;
    volume_change_24h: number;
    percent_change_1h: number;
    percent_change_24h: number;
    percent_change_7d: number;
    percent_change_30d: number;
    percent_change_60d: number;
    percent_change_90d: number;
    market_cap: number;
    market_cap_dominance: number;
    fully_diluted_market_cap: number;
    last_updated: string;
}


/* ---   CryptoQuote --- */

export interface CryptoQuotes {
    status: Status;
    data: {
        [key: string]: CryptocurrencyQuote;
    };
}

interface ConversionData {
    id: number;
    symbol: string;
    name: string;
    amount: number;
    last_updated: string;
    quote: {
        [currency: string]: ConversionQuote;
    };
}

interface ConversionQuote {
    price: number;
    last_updated: string;
}

/* ---   CryptoPriceConversion --- */

export interface CryptoPriceConversion {
    status: Status;
    data: ConversionData;
}