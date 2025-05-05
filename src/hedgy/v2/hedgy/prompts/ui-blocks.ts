import { z } from "zod";
import { PromptBuilder } from "../../builder";
import router from "../router";
import zodToJsonSchema from "zod-to-json-schema";
import { ModelOutput } from "../../model";

const assetNameSchema =  z.enum(["ABSA", "EQTY", "BAMB", "CO-OP", "EABL", "EQUITY", "KCB", "KQ", "SAFARICOM", "KENYA AIRWAYS"])
const displaySummary = z.object({
    content: z.string()
})

const displayButton = z.object({
    assetName:assetNameSchema,
    quantity: z.number(),
    action: z.enum(['BUY', "SELL"])
})


const uiBlockPrompt = new PromptBuilder<ModelOutput>(router, 3, true);

uiBlockPrompt
.input({
    instruction: `
    Your name is Hedgy, you are a UI decision agent, your job is to select UI blocks needed to display the outputs from other agents.
    You can select one or many UI blocks to use, you can also determine what props need to be passed to those UI blocks based on the
    provided information.
    `,
    tools: [
        {
            name: "displaySummary",
            description: "Displays a summary UI block, which contains a summary of the input",
            args: zodToJsonSchema(displaySummary)
        },
        {
            name: "displayButton",
            description: "Displays a button for a user to interact with, the button requires props for assetName, quantitiy, and action",
            args: zodToJsonSchema(displayButton)
        }
    ]
})
.onStepComplete((artifact)=>{
    if(artifact.executor == "prompt"){
        console.log(`[${artifact.output?.role ?? "assistant"}] ::`, artifact?.output?.answer, " ::: \n\n", artifact?.output?.toolResponses)
    }
})

export default uiBlockPrompt