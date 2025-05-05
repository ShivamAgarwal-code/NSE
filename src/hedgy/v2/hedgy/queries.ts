/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from "zod"
import axios from "axios"
import { PromptBuilder } from "../builder"
import { ModelOutput } from "../model"
import router from "./router"
import { Effect, Either } from "effect"
const BASE_DOCS_SITE = "https://raw.githubusercontent.com/hedgehog-project/hedge-hog-docs/refs/heads/main/"

const MAIN_DOCS_DATA_SOURCES = [
    "frequently-asked-questions.md",
    "README.md",
    "architecture/overview.md",
    "architecture/price-oracle.md",
    "architecture/issuer.md",
    "architecture/lender.md"
]

const getAssetPrice = (asset: string) => {
    return 100
}

const assetNameSchema =  z.enum(["ABSA", "EQTY", "BAMB", "CO-OP", "EABL", "EQUITY", "KCB", "KQ", "SAFARICOM", "KENYA AIRWAYS"])

async function constructCompleteDocs() {
    let DOCS_COMPILATION = "";

    for (const doc_source of MAIN_DOCS_DATA_SOURCES) {
        const source_url = `${BASE_DOCS_SITE}${doc_source}`

        const response = await axios.get(source_url)

        if (!response.data) continue;

        const text = await response.data;

        DOCS_COMPILATION = DOCS_COMPILATION + "\n\n" + (text ?? "")
    }

    return DOCS_COMPILATION
}

export async function getPressReleaseQ(assetName: z.infer<typeof assetNameSchema>){
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
    const response = await axios.get(url)
    const text = await response.data

    return text
}

export async function getAllPressReleasesQ() {
    const ALL_ASSETS: Array<z.infer<typeof assetNameSchema>> = [
        "ABSA",
        "EQTY",
        "BAMB",
        "CO-OP",
        "EABL",
        "KCB",
        "SAFARICOM",
        "KENYA AIRWAYS"
    ];

    try {
        // Fetch press releases for all assets in parallel
        const pressReleases = await Promise.all(
            ALL_ASSETS.map(async (asset) => {
                try {
                    const result = await getPressReleaseQ(asset);
                    return {
                        asset,
                        date: new Date().toLocaleDateString(), // You might want to extract this from the content
                        content: result
                    };
                } catch (error) {
                    console.error(`Failed to fetch press release for ${asset}:`, error);
                    return {
                        asset,
                        date: new Date().toLocaleDateString(),
                        content: "Press release unavailable at this time."
                    };
                }
            })
        );

        let content = ""

        for (const pressRelease of pressReleases) {
            content += pressRelease
        }
        
        return content
    } catch (error) {
        console.error("Error fetching all press releases:", error);
        throw new Error("Failed to compile press releases");
    }
}

export async function getAnswerFromDocsQ(question: string) {
    const docs_data = await constructCompleteDocs()

    const prompt = new PromptBuilder<ModelOutput>(router, 3, true)

    prompt.input({
        promptLevel: `1`,
        instruction: `
    Your name is Hedgy, you are an agent, you know everything about the Hedgehog Protocol, which is a onchain lending protocol that enables users to use their tokenised assets from the Nairobi Stock Exchange as collateral.
    You are also familiar with different kinds of stocks that have been tokenised on the Hedgehog Protocol.
    You have been provided with the full documentation on the protocol, your job is to come up with an answer to the question provided.
    Your summary should be complete and answer the provided question.
    <documentation>
    ${docs_data}
    </documentation>
        `,
    })

    const build = prompt.build(question)
    
    const response = await Effect.runPromise(
        Effect.either(
            build
        )
    )

    return Either.match(response, {
        onLeft(left){
            console.log("Something went wrong ::", left)
            return "Unable to retrieve answer from documentation"
        },
        onRight(right) {
            return right.answer ?? "Unable to retrieve answer from documentation"
        },
    })
}

export async function getAssetPricesQ(assetName?: z.infer<typeof assetNameSchema>){
    const ALL_ASSETS: Array<z.infer<typeof assetNameSchema>> = [
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

    let assetPriceSummary = ""

    for (const price of prices){
        assetPriceSummary += `
        |ASSET: ${price.assetName} :: PRICE: ${price.price} |
        -----
        `
    }

    return assetPriceSummary
}