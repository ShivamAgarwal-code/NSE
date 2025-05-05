/* eslint-disable prefer-const */
import { z } from "zod";
import { PromptBuilder } from "../../builder";
import router from "../router";
import zodToJsonSchema from "zod-to-json-schema";
import { Effect } from "effect";
import { ModelOutput } from "../../model";
import { getAllPressReleasesQ, getAnswerFromDocsQ, getAssetPricesQ, getPressReleaseQ } from "../queries"

const resourcePrompt = new PromptBuilder<ModelOutput>(router, 5, true)

const assetNameSchema =  z.enum(["ABSA", "EQTY", "BAMB", "CO-OP", "EABL", "EQUITY", "KCB", "KQ", "SAFARICOM", "KENYA AIRWAYS"])

const getLatestPressRelease = z.object({
    asset: assetNameSchema
})
const getLatestPressReleases = z.object({
    question: z.string()
})

const getLatestAssetPrice = z.object({
    asset: assetNameSchema
})

const getAnswerFromDocs = z.object({
    query: z.string()
})

resourcePrompt
.input({
    promptLevel: `1`,
    instruction: `
    Your name is Hedgy, you are an agent, you know everything about the Hedgehog Protocol, which is a onchain lending protocol that enables users to use their tokenised assets from the Nairobi Stock Exchange as collateral.
    You are also familiar with different kinds of stocks that have been tokenised on the Hedgehog Protocol.
    Your job is to select a single or multiple tools, that can be used to successfully fetch resources necessary for answering a user inquiry.
    You are presentend with a couple of tools and need to choose which ones you can use to answer the user correctly and completely.
    Your tools include: 
    **getLatestPressRelease** - Use this tool to retrieve the latest press release for a single asset mentioned in the user's inquiry
    **getLatestPressReleases** - Use this tool to retrieve the latest press releases for all assets
    **getLatestAssetPrice** - Use this to get the latest price of an asset that the user has inquired about
    **getAnswerFromDocs** - If a user makes a query about the Hedgehog Protocol, you can use this function to retrieve detailed information from the documentation.
    `,
    tools: [
        {
            name: "getLatestPressRelease", 
            description: "Get the latest press release for a single asset",
            args: zodToJsonSchema(getLatestPressRelease)
        },
        {
            name: "getLatestPressReleases",
            description: "Get the latest press releases for all the assets on Hedgehog",
            args: zodToJsonSchema(getLatestPressReleases)
        },
        {
            name: "getLatestAssetPrice",
            description: "Gets the latest price for an asset on Hedgehog in KES",
            args: zodToJsonSchema(getLatestAssetPrice)
        },
        {
            name: "getAnswerFromDocs",
            description: "Get the complete answer for an inquiry about how hedgehog works from the official documentation",
            args: zodToJsonSchema(getAnswerFromDocs)
        }
    ]
})
.parse<ModelOutput>((input)=> {
    return Effect.tryPromise(async ()=>{
        const responses = input.toolResponses
        if(!responses || responses.length == 0) throw new Error("No responses were found");

        let outputs: Array<string> = []

        for (const response of responses){
            console.log("Response::", response)
            switch(response.name){
                case "getLatestPressRelease": {
                    const parsed = getLatestPressRelease.safeParse(response.args)
                    if(!parsed.success) throw new Error("Unable to  latest release");
                    const resp = await getPressReleaseQ(parsed.data.asset)
                    outputs.push(resp)
                    break;
                };
                case "getLatestPressReleases": {
                    const resp = await getAllPressReleasesQ()
                    outputs.push(resp)
                    break;
                };
                case "getLatestAssetPrice": {
                    const parsed = getLatestAssetPrice.safeParse(response.args)
                    if(!parsed.success) throw new Error("Unable to get latest price");
                    const resp = await getAssetPricesQ(parsed.data.asset)
                    outputs.push(resp)
                    break;
                }; 
                case "getAnswerFromDocs": {
                    const parsed = getAnswerFromDocs.safeParse(response.args)
                    if(!parsed.success) throw new Error("Unable to parde latest docs");
                    const resp = await getAnswerFromDocsQ(parsed.data.query)
                    outputs.push(resp)
                    break;
                }
                default: {
                    throw new Error("No valid response was chosen")
                }
            }
        }

        return outputs.join("\n\n")
    })
})
.input({
    promptLevel: `1`,
    instruction: `
    Summarise the input, so that it's clear, concise and complete.
    `
})
.parse<ModelOutput>((input)=> Effect.try(()=>{
    if(!input.answer || input.answer.trim().length == 0) throw new Error("Invalid output");

    return input
}))
.onStepComplete((artifact)=>{
    if(artifact.executor == "prompt"){
        console.log(`[${artifact.output?.role ?? "assistant"}] ::`, artifact?.output?.answer, " ::: \n\n", artifact?.output?.toolResponses)
    }
})



export default resourcePrompt