/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
// choose UI blocks to display

import { z } from "zod"
import { Action } from "../framework/action"
import { Effect } from "effect"
import { cons } from "effect/List"
import { createPrompt, sendToLLM } from "../framework/utils"
import zodToJsonSchema from "zod-to-json-schema"

const uiBlockSchema = z.object({
    name: z.string(),
    props: z.any(),
    description: z.string()
})

export type UIBLOCK = z.infer<typeof uiBlockSchema>

interface _UIBLOCK {
    name: string,
    props: Zod.ZodTypeAny,
    description: string
    type: "display" | "action"
}

const UI_BLOCKS: Array<_UIBLOCK> = [
    {
        name: "PURCHASE_BUTTON",
        props: z.object({
            assetName: z.string(),
            quantity: z.number()
        }),
        description: "A Button for purchasing an asset, use a default quantity of 100, if none is specified by the user",
        type: "action"
    },
    {
        name: "DISPLAY",
        props: z.object({
            content: z.string()
        }),
        description: "Display a user friendly and targeted response from the ai",
        type: "display"
    }
]

const parseInputSchema = z.object({
    response: z.string(),
    originalTask: z.string(),
    primeDirective: z.string(),
    context: z.string()
})

type ParseInputSchema = z.infer<typeof parseInputSchema>


// choose UI blocks then populate the props
export const CHOOSE_UI_BLOCK_ACTION = Action.define<ParseInputSchema, UIBLOCK[]>({
    name: "CHOOSE_UI_BLOCK",
    description: "Choose a UI block to display, and determine the props to pass to it, based on the result of the task. There can be multiple UI blocks, chosen especially if the user asks to buy an asset",
    outputSchema: z.object({
        uiBlocks: z.array(uiBlockSchema)
    }),
    inputSchema: parseInputSchema,
    action(args, goal, context) {
        console.log("Incoming UI Block Args::", args)
        const { originalTask, primeDirective, response: results } = args
        console.log("Results:: ", results)

        const COMPLETED_STEPS = context.map((step, i) => {
            return `
                BEGIN STEP ${i + 1}.
                ${step.task}.
                ${step.taskDescription}.
                ${typeof step.taskResult === "object" ? JSON.stringify(step.taskResult) : {}}.
                END STEP ${i + 1}.
            `
        }).join("\n")

        return Effect.tryPromise({
            try: async () => {
                const chooseUIBlockPrompt = createPrompt(
                    {
                        role: "system",
                        content: `
                        <instructions>
                        choose a single or multiple UI Blocks to correctly display, and provide interactions for the following content:
                        original task: ${goal.task}
                        prime directive: ${goal.directive}
                        </instructions>

                        <execution-stack>
                        ${COMPLETED_STEPS}
                        </execution-stack>

                        <previous-response>
                        ${results}
                        </previous-response>

                        Here are the available UI Blocks:
                        <options>
                        ${UI_BLOCKS.map(block => `<ui-block>- ${block.name}: ${block.description}</ui-block>`).join("\n")}
                        </options>

                        <requirements>
                        All responses must include a DISPLAY block
                        </requirements>
                        `,
                        name: "chooseUIBlocks"
                    },
                    {
                        name: "chooseUIBlocks",
                        description: "Choose UI Blocks to display",
                        parameters: zodToJsonSchema(z.object({
                            blocks: z.array(z.string())
                        }))
                    },
                    "chooseUIBlocks"
                )

                let response = await sendToLLM(chooseUIBlockPrompt)
                console.log("rrrr", response)
                const asJSON = JSON.parse(response)
                
                if(!asJSON?.blocks || asJSON.blocks.length == 0) return [];

                const chosenBlocks = UI_BLOCKS.filter(block => asJSON.blocks.includes(block.name))

                const serializedUIData = await Promise.all(chosenBlocks.map(async (block) => {
                        
                    const prompt = createPrompt(
                        {
                            role: "system",
                            content: `
                            <instructions>
                            Determine what props can be derived from this content for the UI Block ${block.name}: ${block.description} to be displayed to the user. 
                            Use data from the execution-stack or the previous-results

                            ${block.name == "DISPLAY" ? `
                                <requirements>
                                DO NOT INCLUDE THE TASK DETAILS IN THE CONTENT
                                DO NOT INCLUDE THE PRIME DIRECTIVE IN THE CONTENT
                                THE RESPONSE SHOULD BE SIMPLE AND COMPLETE AND STARIGHT TO THE POINT.
                                THE RESPONSE SHOULD BE ADDRESSED TO THE USER
                                DO NOT INCLUDE DETAILS ABOUT THE EXECUTION STACK
                                </requirements>
                                ` : ""}
                            </instructions>
                            <original-task>
                            ${goal.task}
                            </original-task>
                            <prime-directive>
                            prime directive: ${goal.directive}
                            </prime-directive>

                            <execution-stack>
                            ${COMPLETED_STEPS}
                            </execution-stack>

                            <previous-results>
                            ${results}
                            </previous-results>

                            
                            `,
                            name: "getUIBlockProps"
                        },
                        {
                            name: "getUIBlockProps",
                            description: "Get UI Block Props",
                            parameters: zodToJsonSchema(block.props)
                        }, 
                        "getUIBlockProps"
                    );

                    const result = await sendToLLM(prompt) 

                    console.log("Incoming prop results::", result)

                    const parsed = JSON.parse(result)

                    const parsedProps = block.props.safeParse(parsed)

                    console.log("Parsed propd ::", parsedProps)

                    if (parsedProps.success) {
                        return {
                            name: block.name,
                            props: parsedProps.data,
                            description: block.description
                        }
                    } else {
                        console.log("Failed to parse props", parsedProps.error)
                        return null
                    }


                }))

                console.log("Serialized UI Data", serializedUIData)

                const filteredUIBlocks = serializedUIData.filter((block) => block !== null) as UIBLOCK[]

                return filteredUIBlocks
            },
            catch(error) {
                console.log("Something went wrong", error)
                return error
            },
        })
    },
})