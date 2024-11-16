import { TavilySearchResults } from "@langchain/community/tools/tavily_search"
import { tool } from "@langchain/core/tools"
import { z } from "zod"
import { CryptoInfo, CryptoPriceConversion, CryptoQuotes } from "./types"

export async function callCoinMarketCapAPI<Output extends Record<string, any> = Record<string, any>>(
    fields: { endpoint: string, params: Record<string, string> }): Promise<Output> {

    if (!process.env.COINMARKETCAP_API_KEY) {
        throw new Error("COINMARKETCAP_API_KEY is not set")
    }

    const baseURL = "https://pro-api.coinmarketcap.com/v1"
    const queryParams = new URLSearchParams(fields.params).toString()
    const url = `${baseURL}${fields.endpoint}?${queryParams}`
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "X-CMC_PRO_API_KEY": process.env.COINMARKETCAP_API_KEY
        }
    })

    if (!response.ok) {
        let res: string
        try {
            res = JSON.stringify(await response.json(), null, 2)
        } catch (_) {
            try {
                res = await response.text()
            } catch (_) {
                res = response.statusText
            }
        }
        throw new Error(
            `Failed to fetch data from ${fields.endpoint}.\nResponse: ${res}`
        )
    }
    const data = await response.json()
    return data
}

const cryptoInfo = tool(async (input) => {
    console.log("*** cryptocurrencyInfo ***")
    try {
        const data = await callCoinMarketCapAPI<CryptoInfo>({
            endpoint: "/cryptocurrency/info",
            params: {
                symbol: input.symbol
            }
        })
        return JSON.stringify(data, null)
    } catch (e: any) {
        console.warn("Error fetching cryptocurrency info", e.message)
        return `An error occured while fetching cryptocurrency info, ${e.message}`
    }
}, {
    name: "cryptocurrency_info",
    description: `Fetches all static metadata available for the current cryptocurrency. This information
       includes details like logo, description, official website URL, social links, and links 
       to a cryptocurrency's technical documentation
    `,
    schema: z.object({
        symbol: z
            .string()
            .describe("Cryptocurrency symbol. For example 'BTC'")
    })
})

const cryptoQuotes = tool(async (input) => {
    console.log("*** cryptocurrencyQuotes ***")
    try {
        const data = await callCoinMarketCapAPI<CryptoQuotes>({
            endpoint: "/cryptocurrency/quotes/latest",
            params: {
                symbol: input.symbol,
                convert: input.convert
            }
        })
        return JSON.stringify(data, null)
    } catch (e: any) {
        console.warn("Error fetching cryptocurrency quotes", e.message)
        return `An error occured while fetching cryptocurrency quotes, ${e.message}`
    }
}, {
    name: "cryptocurrency_quotes",
    description: `Fetches the latest market quotes for specified cryptocurrencies. It provides detailed metrics like current price, 24-hour 
                  trading volume, market cap, and percentage price changes over various time frames. Use the "convert" option to return market value in the same call.`,
    schema: z.object({
        symbol: z
            .string()
            .describe("Cryptocurrency symbol. For example 'BTC'"),
        convert: z
            .string()
            .describe("Target currency to return the quote data. For example 'USD'")
    }),

})

const cryptoPriceConversionSchema = z.object({
    symbol: z
        .string()
        .describe("Cryptocurrency symbol. For example 'BTC'"),
    convert: z
        .string()
        .describe("Trget currency to return the quote data. For example 'USD'"),
    amount: z
        .string()
        .describe("Amount of currency to convert. For Example: 10.43")
})

export type priceConversion = z.infer<typeof cryptoPriceConversionSchema>

const cryptoPriceConversion = tool(async (input) => {
    console.log("*** cryptocurrencyPriceConversion ***")
    try {
        const data = await callCoinMarketCapAPI<CryptoPriceConversion>({
            endpoint: "/tools/price-conversion",
            params: {
                symbol: input.symbol,
                convert: input.convert,
                amount: input.amount
            }
        })
        return JSON.stringify(data, null)
    } catch (e: any) {
        console.warn("Error fetching cryptocurrency price conversion", e.message)
        return `An error occured while fetching cryptocurrency price conversion, ${e.message}`
    }
}, {
    name: "cryptocurrency_price_conversion",
    description: "Converts an amount of one cryptocurrency or fiat currency into one or more different currencies utilizing the latest market rate for each currency",
    schema: cryptoPriceConversionSchema,
})

export const webSearchTool = new TavilySearchResults({
    maxResults: 2
})

export const ALL_TOOLS = [
    cryptoInfo,
    cryptoQuotes,
    cryptoPriceConversion,
    webSearchTool
]