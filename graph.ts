import * as path from 'path';
import * as fs from "fs"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import {
    Annotation,
    END,
    START,
    StateGraph,
    NodeInterrupt,
    MessagesAnnotation,
    MemorySaver
} from "@langchain/langgraph"
import { type AIMessage } from "@langchain/core/messages"
import { ChatOpenAI } from "@langchain/openai"
import { ALL_TOOLS, priceConversion } from "./tools"
import { CryptoPriceConversion } from "./types"

const GraphAnnotatopn = Annotation.Root({
    ...MessagesAnnotation.spec,
    requestedCryptoPurchaseDetails: Annotation<priceConversion>,
    purchaseConfirmed: Annotation<boolean | undefined>
})

const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0
})

const toolNode = new ToolNode(ALL_TOOLS)

const callModel = async (state: typeof GraphAnnotatopn.State) => {
    const { messages } = state

    const systemMessage = {
        role: "system",
        content: `You are an expert cryptocurrency analyst, tasked with answering the users questions
        about given cryptocurrency or cryptocurrencies. You do not have up to date infromation about the
        cryptocurrency, so you much call tools when answering users questions.
        All cryptocurrncy data tools require a crypto symbol to be passed as a parameter.
        If you do not know the symbol, you should use the web search tool to find it and return just the symbol.
        `
    }

    const llmWithTools = llm.bindTools(ALL_TOOLS)
    const result = await llmWithTools.invoke([systemMessage, ...messages])
    return { messages: result }
}

const shouldContinue = (state: typeof GraphAnnotatopn.State) => {
    const { messages, requestedCryptoPurchaseDetails } = state

    const lastMessage = messages[messages.length - 1] as AIMessage

    if (lastMessage._getType() !== "ai" || !lastMessage.tool_calls?.length) {
        return END
    }

    if (requestedCryptoPurchaseDetails) {
        return "execute_purchase"
    }

    const { tool_calls } = lastMessage

    return tool_calls.map((tc) => {
        if (tc.name === "cryptocurrency_price_conversion") {
            return "prepare_purchase_details"
        }
        return "tools"
    })
}

const preparePurchaseDetails = async (state: typeof GraphAnnotatopn.State) => {
    const { messages } = state
    const lastMessage = messages[messages.length - 1] as AIMessage

    if (lastMessage._getType() !== "ai") {
        throw new Error("Expected the last message to be an AI message")
    }

    const priceConversion = lastMessage.tool_calls?.find(tc => tc.name === "cryptocurrency_price_conversion")

    if (!priceConversion) {
        throw new Error("Expected the last AI message to have a cryptocurrency_price_conversion tool call")
    }

    let { symbol, convert, amount } = priceConversion.args

    return {
        requestedCryptoPurchaseDetails: {
            symbol,
            amount,
            convert
        }
    }
}

const executePurchase = async (state: typeof GraphAnnotatopn.State) => {
    const { purchaseConfirmed, requestedCryptoPurchaseDetails } = state

    if (!requestedCryptoPurchaseDetails) {
        throw new Error("Expected requestedCryptoPurchaseDetails to be present")
    }

    if (!purchaseConfirmed) {
        throw new NodeInterrupt("Please confirm the purchase before executing.")
    }

    const { symbol, convert, amount } = requestedCryptoPurchaseDetails

    const priceconversionTool = await ALL_TOOLS.find(t => t.name === "cryptocurrency_price_conversion")!.invoke(requestedCryptoPurchaseDetails)
    const priceconversionToolParsed: CryptoPriceConversion = JSON.parse(priceconversionTool)
    const price = priceconversionToolParsed.data.quote[convert].price

    return {
        messages: [
            {
                role: "assistant",
                content: `Successfully purchased ${amount} of ${symbol} in ${convert} at a price of ${price.toFixed(2)}`
            }
        ]
    }
}

const workflow = new StateGraph(GraphAnnotatopn)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addNode("prepare_purchase_details", preparePurchaseDetails)
    .addNode("execute_purchase", executePurchase)
    .addEdge(START, "agent")
    .addEdge("prepare_purchase_details", "execute_purchase")
    .addEdge("tools", "agent")
    .addEdge("execute_purchase", END)
    .addConditionalEdges("agent", shouldContinue, [
        "tools",
        "prepare_purchase_details",
        "execute_purchase",
        END
    ])

export const graph = workflow.compile({
    checkpointer: new MemorySaver()
})

export const generateImage = async () => {
    const image = await graph.getGraph().drawMermaidPng();
    const arrayBuffer = await image.arrayBuffer();
    await fs.writeFileSync(path.join(__dirname, '/public/CoinMarketCap_graph.png'), new Uint8Array(arrayBuffer))
}
