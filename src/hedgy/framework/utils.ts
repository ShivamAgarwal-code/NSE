import "dotenv/config"
import {OpenAI} from "openai"



const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})


export async function sendToLLM(prompt: {
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    _function: OpenAI.Chat.ChatCompletionCreateParams.Function,
    functionName: string
}) {
    const { messages, functionName, _function: fun } = prompt

    console.log(`
    <request>
    ${JSON.stringify(messages)}
    </request>
    `)
    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages, 
        tools: [
            {
                function: {
                    name: functionName,
                    description: fun.description,
                    parameters: fun.parameters,
                    strict: true
                },
                type: 'function'
            }
        ],
    })

    const function_res = response.choices[0].message.tool_calls?.at(0)
    console.log("Response from LLM: ", function_res, response.choices[0].message?.content)

    return function_res ? function_res.function.arguments : "{}"
}

export function createPrompt(
    message: OpenAI.Chat.ChatCompletionMessageParam,
    function_: OpenAI.Chat.ChatCompletionCreateParams.Function,
    functionName: string
) {
    return {
        messages: [message],
        _function: function_,
        functionName
    }
}

export function formatToJSON(dataStr: string){
    // format the data to be in the format that the next task needs
    return JSON.parse(dataStr.trim())
}
