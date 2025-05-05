/* eslint-disable @typescript-eslint/no-explicit-any */
import { Goal, OrchestraterRequest } from "./orchestrater";
import { DECODE_SYSTEM_PROMPT, ENCODE_SYSTEM_PROMPT } from "./SYSTEM_PROMPTS";
import { formatToJSON, sendToLLM } from "./utils";



export async function encodeHumanRequestToExecutionTask(humanRequest: string, directive: string) {
    const question = ENCODE_SYSTEM_PROMPT(humanRequest, directive)
    const response = await sendToLLM(question)
    const data = formatToJSON(response)
    return data as Goal
}

export async function decodeExecutionTaskToHumanResponse(result: any, initialRequest: OrchestraterRequest){
    const question = DECODE_SYSTEM_PROMPT(result, initialRequest)
    const response = await sendToLLM(question)
    const data = formatToJSON(response)
    return data
}