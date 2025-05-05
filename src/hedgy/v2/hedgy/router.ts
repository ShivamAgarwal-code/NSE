import OpenAI from "openai";
import { Router } from "../router";
import { Model } from "../model";
import { Effect } from "effect";


const router = new Router()

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

router.register(
    Model.define({
        promptLevel: `1`,
        name: "gpt-4o",
        Asker: (input, history = []) => {
            
            const messages = history?.map((output) => {
                const toolMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =[]

                
                if((output.toolResponses?.length ?? 0) > 0) {
                    toolMessages.push({
                        role: "assistant",
                        content: null,
                        tool_calls: output.toolResponses?.map((tool)=>{
                         return {
                            function: {
                                arguments: JSON.stringify(tool.args),
                                name: tool.name,
                    
                            },
                            id: tool.id ?? "",
                            type: "function"
                         }
                        })
                    })

                    for (const tool of (output.toolResponses ?? [])) {
                        toolMessages.push({
                            role: "tool",
                            content: JSON.stringify(tool.args),
                            tool_call_id: tool.id ?? ""
                        })
                    }
                    
                    return toolMessages
                }
                return [{
                    role: output.role ?? "assistant" as const,
                    content: output.answer ?? "",
                }]
            })?.flat()?.filter(a=> a !== undefined);

            return Effect.tryPromise({
                try: async () => {

                    const response = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            ...messages,
                            {
                                role: "assistant",
                                name: input.toolName,
                                content: input.question,
                            }
                        ],
                        tools: input.tools?.map((tool) => ({
                            function: {
                                description: tool.description,
                                name: tool.name,
                                parameters: tool.args
                            },
                            type: "function"
                        })),
                    })

                    const message_content = response.choices?.[0]?.message?.content ?? ""
                    const function_res = response.choices[0].message.tool_calls?.map((res)=>{
                        return {
                            name: res.function.name,
                            args: JSON.parse(res.function.arguments),
                            id: res.id
                        }
                    })

                    return {
                        answer: message_content,
                        toolResponses: function_res
                    }
                },
                catch: (error) => {
                    console.log(`Error in model: ${error}`)
                    return error
                }
            })
        }
    })
)

export default router