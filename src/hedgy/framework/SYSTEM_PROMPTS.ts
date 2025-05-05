/* eslint-disable @typescript-eslint/no-explicit-any */
import zodToJsonSchema from "zod-to-json-schema"
import { Action } from "./action"
import { ContextItem } from "./orchestrater"
import { createPrompt } from "./utils"
import { z } from "zod"


export const ENCODE_SYSTEM_PROMPT = (input: string, orchestratorDirective: string) => {

    const FUNCTION_NAME = "toExecutionTask"
    const FUNCTION_DESCRIPTION = "Convert the human request into an execution task."

    const MESSAGE = `
    <system-information>
    I am a assistant whose prime directive is: ${orchestratorDirective}. \n
    </system-information>
    <instructions>
    Based on the human request, determine a goal I can achieved that is alligned with my prime directive. \n 
    Also Determine a simple and straightfoward completion criteria which is not more than 5 words that I can evaluate my progress against and know when to stop executing. \n
    </instructions>
    <input>
    Here is what the human says:
    ${input}
    </input>
    `

    const prompt = createPrompt(
        {
            role: "system",
            content: MESSAGE,
            name: FUNCTION_NAME
        },
        {
            name: FUNCTION_NAME,
            description: FUNCTION_DESCRIPTION,
            parameters: zodToJsonSchema(
                z.object({
                    task: z.string(),
                    completionCriteria: z.string()
                })
            )
        },
        FUNCTION_NAME
    )

    return prompt
}


export const DECODE_SYSTEM_PROMPT = (result: any, initialRequest: { task: string, input: string }) => {

    const FUNCTION_NAME = "toHumanFriendlyResponse"
    const FUNCTION_DESCRIPTION = "Convert the result of the task into a human-friendly response."

    const MESSAGE = `
    Based on the result of the task and the initial request, convert the result into a human-friendly response.
    Here is the result of the task:
    ${JSON.stringify(result)}
    Here is the initial request:
    ${JSON.stringify(initialRequest)}
    `

    const prompt = createPrompt(
        {
            role: "system",
            content: MESSAGE,
            name: FUNCTION_NAME
        },
        {
            name: FUNCTION_NAME,
            description: FUNCTION_DESCRIPTION,
            parameters: zodToJsonSchema(
                z.object({
                    humanResponse: z.string(),
                    result: z.any(),
                })
            )
        },
        FUNCTION_NAME
    )

    return prompt
}




export const TASK_RESPONSE_FORMATTER_SYSTEM_PROMPT = (
    executor: Action,
    previousResult: any, 
    context: Array<ContextItem>
) => {

    const EXECUTION_STACK_SUMMARY = context.map(item => {
        return `-[TASK] ${item.task}: ${item.taskDescription}\n Result: ${item.taskResult}\n`
    })

    const FUNCTION_NAME = executor.Name
    const FUNCTION_DESCRIPTION = executor.Description;

    const MESSAGE = `
        <instruction>
        STRUCTURE THE RESULT INTO THE CORRECT FORMAT FOR THE NEXT ACTION, YOU CAN DRAW ON THE EXECUTION STACK FOR MORE CONTEXT.
        </instruction>

        <execution-stack>
        ${EXECUTION_STACK_SUMMARY.join("\n")}.
        </execution-stack> \n
        <previous-result>
        ${previousResult}.
        </previous-result>
    `

    const prompt = createPrompt(
        {
            role: "system",
            content: MESSAGE,
            name: FUNCTION_NAME
        },
        {
            name: FUNCTION_NAME,
            description: FUNCTION_DESCRIPTION,
            parameters: zodToJsonSchema(executor.InputSchema)
        },
        FUNCTION_NAME
    )

    return prompt

}