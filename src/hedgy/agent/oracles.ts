/* eslint-disable @typescript-eslint/no-unused-vars */
// Oracles:
// GET PRESS RELEASES
// GET ASSET PRICES
// GET DOCS AND EXPLANATIONS ON THE PLATFORM

import { symbol, z } from "zod";
import { Oracle } from "../framework/oracle";
import { Effect } from "effect";
import { createPrompt, sendToLLM } from "../framework/utils";
import zodToJsonSchema from "zod-to-json-schema";
import { assets } from "@/data/marketData";

const assetNameSchema =  z.enum(["ABSA", "EQTY", "BAMB", "CO-OP", "EABL", "EQUITY", "KCB", "KQ", "SAFARICOM", "KENYA AIRWAYS"])
type ASSET_NAME_SCHEMA = z.infer<typeof assetNameSchema>

const BASE_DOCS_SITE = "https://raw.githubusercontent.com/hedgehog-project/hedge-hog-docs/refs/heads/main/"

const MAIN_DOCS_DATA_SOURCES = [
    "frequently-asked-questions.md",
    "README.md",
    "architecture/overview.md",
    "architecture/price-oracle.md",
    "architecture/issuer.md",
    "architecture/lender.md"
]

async function constructCompleteDocs() {
    let DOCS_COMPILATION = "";

    for (const doc_source of MAIN_DOCS_DATA_SOURCES) {
        const source_url = `${BASE_DOCS_SITE}${doc_source}`

        const response = await fetch(source_url)

        if (!response.ok) continue;

        const text = await response.text();

        DOCS_COMPILATION = DOCS_COMPILATION + "\n\n" + (text ?? "")
    }

    return DOCS_COMPILATION
}


async function getAnswerFromDocs(question: string) {
    const docs_data = await constructCompleteDocs()

    const prompt = createPrompt(
        {
            role: "system",
            content: `
            <instructions>
            BASED ON THIS DOCUMENTATION ABOUT THE HEDGEHOG LENDING PROTOCOL.
            GENERATE A RESPONSE FOR THE QUERY.
            IF YOU ARE UNABLE TO FIND A REASONABLE ANSWER TO THE USER'S PROMPT REPLY WITH, 
                <example>
                    My sources aren't clear on that, perhaps rephrase the question.
                </example>

            You are alloed to summarise already documented sources, but not come up with answers on your own.
            </instructions>

            <documentation>
            ${docs_data}
            </documentation>

            <question>
            ${question}
            </question>

            <condition-for-answer-validity>
            All answers should come directly from the documentation and no other sources.
            </condition-for-answer-validity>
            `
        },
        {
            name: "queryDocs",
            description: "Query the documentation to determine an answer to a user's question.",
            parameters: zodToJsonSchema(z.object({
                response: z.string()
            }))
        },
        "queryDocs"
    )

    const response = await sendToLLM(prompt)

    try {
        const asJSON = JSON.parse(response)
        return asJSON?.response ?? "Unable to reach documentation at this time, please try again in a few";
    } catch (e) {
        console.log("Something went wrong making the request ::", e)
        return "Unable to reach documentation at this time, please try again in a few"
    }
}

async function getPressRelease(assetName: PRESS_RELEASE_QUERY_SCHEMA["assetName"]){
    const BASE_PRESS_RELEASE_PATH = `https://raw.githubusercontent.com/hedgehog-project/dummy-press-releases/refs/heads/main/{{ASSET_NAME}}.md`
                // absa.md
                const locator = (()=>{
                    switch(assetName){
                        case "ABSA":{
                            return "absa" 
                        };
                        case "BAMB": {
                            return "bamburi" 
                        };
                        case "CO-OP": {
                            return "cooperative-bank"
                        };
                        case "EABL": {
                            return "eabl"
                        };
                        case "EQTY": {
                            return "equity"
                        };
                        case "EQUITY": {
                            return "equity"
                        };
                        case "KCB": {
                            return "kcb"
                        };
                        case "KENYA AIRWAYS": {
                            return "kenya-airways"
                        };
                        case "KQ": {
                            return "kenya-airways"
                        };
                        case "SAFARICOM": {
                            return "safaricom"
                        } 
                        default: { 
                            return null 
                        }
                    }
                })();

    if(!locator) throw new Error("Invalid asset name");

    const url = BASE_PRESS_RELEASE_PATH.replace("{{ASSET_NAME}}", locator)
    const response = await fetch(url)
    if(!response.ok) throw new Error("Failed to fetch press release")
    const text = await response.text()

                return {
                    content: text
                }
}


const pressReleaseQuerySchema = z.object({
    assetName: assetNameSchema
})

type PRESS_RELEASE_QUERY_SCHEMA = z.infer<typeof pressReleaseQuerySchema>

const pressReleaseResponseSchema = z.object({
    content: z.string()
})

type PRESS_RELEASE_RESPONSE_SCHEMA = z.infer<typeof pressReleaseResponseSchema>

export const PRESS_RELEASE_ORACLE_SPECIFIC = Oracle.define<PRESS_RELEASE_QUERY_SCHEMA, PRESS_RELEASE_RESPONSE_SCHEMA>({
    name: "getSpecificPressRelease",
    description: "Get the press release of a specific company",
    querySchema: pressReleaseQuerySchema,
    responseSchema: pressReleaseResponseSchema,
    reader(args) {
        return  Effect.tryPromise({ 
            try: async () => {
                return getPressRelease(args.assetName)
            },
            catch(e){
                console.log("Something went wrong ::", e)
                return e 
            }
        })
    },
})


const pressReleaseQuerySchemaGeneral = z.object({
    input: z.string()
})

type PRESS_RELEASE_QUERY_SCHEMA_GENERAL = z.infer<typeof pressReleaseQuerySchemaGeneral>

const pressReleaseResponseSchemaGeneral = z.object({
    content: z.string()
})

type PRESS_RELEASE_RESPONSE_SCHEMA_GENERAL = z.infer<typeof pressReleaseResponseSchemaGeneral>

export const PRESS_RELEASE_ORACLE_GENERAL = Oracle.define<PRESS_RELEASE_QUERY_SCHEMA_GENERAL, PRESS_RELEASE_RESPONSE_SCHEMA_GENERAL>({
    name: "getAllPressReleases",
    description: "Get's the press releases of all companies whose tokenized shares are traded on the platform",
    querySchema: pressReleaseQuerySchemaGeneral,
    responseSchema: pressReleaseResponseSchemaGeneral,
    reader(args){
        return Effect.tryPromise({
            try: async () => {
                const ALL_ASSETS: Array<PRESS_RELEASE_QUERY_SCHEMA["assetName"]> = [
                    "ABSA",
                    "EQTY",
                    "BAMB",
                    "CO-OP",
                    "EABL",
                    "KCB",
                    "SAFARICOM",
                    "KENYA AIRWAYS"
                ]

                const content = await Promise.all(ALL_ASSETS.map(async (asset) => {
                    return getPressRelease(asset)
                }))

                const GENERAL_PRESS_RELEASE = content?.filter((item) => item?.content !== null)?.map((c)=>c.content)?.join("\n\n")

                if(!GENERAL_PRESS_RELEASE) throw new Error("No press releases found");

                return {
                    content: GENERAL_PRESS_RELEASE
                }
            },
            catch(error) {
                console.log("Something went wrong", error)
                return error
            },
        })
     }
})

const docReadOracleInputSchema = z.object({
    query: z.string()
})

type DOCS_READ_ORACLE_INPUT = z.infer<typeof docReadOracleInputSchema>

const docsReadOracleOutputSchema = z.object({
    response: z.string()
})

type DOCS_READ_ORACLE_OUTPUT = z.infer<typeof docsReadOracleOutputSchema>

export const DOCS_READ_ORACLE = Oracle.define<DOCS_READ_ORACLE_INPUT, DOCS_READ_ORACLE_OUTPUT>({
    name: "getAnswerFromDocs",
    description: "Get an answer straight from the main documentation site, for anything regarding the protocol and how it's structured, or anything that needs an explanation.  Input should be structured like a question that needs an answer.",
    querySchema: docReadOracleInputSchema,
    responseSchema: docsReadOracleOutputSchema,
    reader(args) {
        const { query } = args
        return Effect.tryPromise({
            try: async () => {
                const docsAnswer = await getAnswerFromDocs(query)

                return {
                    response: docsAnswer
                }
            },
            catch(e) {
                console.log("Something went wrong", e)
                return e
            }
        })
    },
})

const getAssetPriceQuerySchema = z.object({
     assetName: assetNameSchema
})

type GET_ASSET_PRICE_QUERY_SCHEMA = z.infer<typeof getAssetPriceQuerySchema>

const getAssetPriceOutputSchema = z.object({
    price: z.number()
})

type GET_ASSET_PRICE_OUTPUT_SCHEMA = z.infer<typeof getAssetPriceOutputSchema>


const getAssetPrice = async (assetName: ASSET_NAME_SCHEMA) => { 
    return 100
}

export const GET_ASSET_PRICE_ORACLE = Oracle.define<GET_ASSET_PRICE_QUERY_SCHEMA, GET_ASSET_PRICE_OUTPUT_SCHEMA>({
    name: "getAssetPrice",
    description: "Get the price of a specific asset",
    querySchema: getAssetPriceQuerySchema,
    responseSchema: getAssetPriceOutputSchema,
    reader(args){
        return Effect.tryPromise({
            try: async () => {  
                const currentPrice = await getAssetPrice(args.assetName)
                
                return {
                    price: currentPrice
                }
            },
            catch(error){
                console.log("Something went wrong ::", error)
                return error
            }
        })
    }
})

const getAssetsPriceQuerySchema = z.object({
    input: z.string()
}) 

type GET_ASSETS_PRICE_QUERY_SCHEMA = z.infer<typeof getAssetsPriceQuerySchema>

const getAssetsPriceOutputSchema = z.object({
    results: z.array(z.object({ 
        assetName: assetNameSchema,
        price: z.number()
    }))
})

type GET_ASSETS_PRICE_OUTPUT_SCHEMA = z.infer<typeof getAssetsPriceOutputSchema>

export const GET_ASSET_PRICES = Oracle.define<GET_ASSETS_PRICE_QUERY_SCHEMA, GET_ASSETS_PRICE_OUTPUT_SCHEMA>({
    name: "getAssetPrices",
    description: "Get the prices of all assets on the platform", 
    querySchema: getAssetsPriceQuerySchema,
    responseSchema: getAssetsPriceOutputSchema,
    reader(args) {
         return Effect.tryPromise({
            try: async () => {
                const ALL_ASSETS: Array<GET_ASSET_PRICE_QUERY_SCHEMA["assetName"]> = [
                    "ABSA",
                    "EQTY",
                    "BAMB",
                    "CO-OP",
                    "EABL",
                    "KCB",
                    "SAFARICOM",
                    "KENYA AIRWAYS"
                ]

                const prices = await Promise.all(ALL_ASSETS.map(async (asset) => {
                    const currentPrice = await getAssetPrice(asset)
                    return {
                        assetName: asset,
                        price: currentPrice
                    }
                }))

                return {
                    results: prices
                }
            },
            catch(error) {
                console.log("Something went wrong ", error) 
                return error
            },
         })
    }, 
})

const getListedAssetsSchema = z.object({
    empty_input: z.string()
})

type getListedAssetsSchemaInput = z.infer<typeof getListedAssetsSchema>

const getListedAssetsResponse = z.object({
    listedAssets: z.array(z.object({
        name: z.string(),
        description: z.string(),
        token_symbol: z.string()
    }))
})

type getListedAssetsSchemaOutput = z.infer<typeof getListedAssetsResponse>

export const LISTED_ASSETS_ORACLE = Oracle.define<getListedAssetsSchemaInput, getListedAssetsSchemaOutput>({
    name: "getListedAssets",
    description: "Get all the tokens currently listed and being actively traded on hedgehog",
    querySchema: getListedAssetsSchema,
    responseSchema: getListedAssetsResponse,
    reader(args) {
        return Effect.tryPromise({
            try: async () => {
                const listedAssets = assets.map((asset) => {
                    return {
                        name: asset.name,
                        description: asset.description,
                        token_symbol: asset.tokenizedSymbol
                    }
                })

                return {
                    listedAssets
                }
            },
            catch(error) {
                console.log("Something went wrong ::", error)
            },
        })
    },
})

