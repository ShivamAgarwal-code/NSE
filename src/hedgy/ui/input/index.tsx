/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Controller, useForm, FieldErrors } from "react-hook-form"
import { useHedgyState } from "../context"
import {z} from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { SendIcon, Loader2 } from "lucide-react"
import { getCompletion } from "@/hedgy/agent/access-functions"
import { ModelOutput } from "@/hedgy/v2/model"

const promptSchema = z.object({
    prompt: z.string().min(1, "Please enter a message")
})

type PromptSchema = z.infer<typeof promptSchema>

export default function MessageInput(){
    const { addMessage, setLoading, isLoading, messages } = useHedgyState()

    const form = useForm<PromptSchema>({
        resolver: zodResolver(promptSchema),
        defaultValues: {
            prompt: ""
        }
    })

    const handleSubmit = async (values: PromptSchema )=> {
        if (!values.prompt.trim()) return;
    
       
    
        setLoading(true);
        
        // Add user message immediately
        addMessage({
            blocks: [
                {
                    name: "USER_MESSAGE",
                    description: "User's message",
                    props: { content: values.prompt }
                }
            ],
            id: Date.now().toString()
        });

         // Reset form immediately
        form.reset({ prompt: "" });
    
        try {
            const valid_messages = messages?.map((message) => message.blocks)?.flat()?.filter((m) => m.name !== "PURCHASE_BUTTON")

            const prepareMessageHistory = valid_messages.map((message) => {
                return {
                    answer: message.props.content ?? "",
                    role: message.name == "USER_MESSAGE" ? "user" : "assistant",
                } as ModelOutput
            })
            const results = await getCompletion({
                prompt: values.prompt
            }, prepareMessageHistory ?? []);
    
            addMessage({
                blocks: results as any,
                id: Date.now().toString()
            });
        }
        catch (e) {
            console.error("Something went wrong", e);
            addMessage({
                blocks: [{
                    name: "TEXT",
                    description: "Error message",
                    props: { content: "Sorry, something went wrong. Please try again." }
                }],
                id: Date.now().toString()
            });
        }
        finally {
            setLoading(false);
        }
    };
    

    const handleError = (errors: FieldErrors<PromptSchema>) => {
        console.error("Form errors:", errors);
    }

    return (
        <div className="flex flex-row w-full border border-[var(--border-color)] rounded-md bg-[var(--background)]" >
            <Controller
                control={form.control}
                name="prompt"
                render={({field})=> {
                    return (            
                    <div className="w-full p-2 rounded-md flex flex-row items-center gap-x-2" >
                        <textarea 
                            placeholder="Ask Hedgy about NSE..."
                            className="flex flex-row w-full bg-transparent placeholder:text-gray-300 text-[var(--foreground)] border-none min-h-10 max-h-20 resize-none focus:outline-none" 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    form.handleSubmit(handleSubmit, handleError)();
                                }
                            }}
                            disabled={isLoading}
                            {...field} 
                        />
                        <button
                            onClick={form.handleSubmit(handleSubmit, handleError)}  
                            disabled={isLoading}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors duration-200 border border-[var(--border-color)] ${
                                isLoading 
                                    ? 'bg-[var(--muted)] cursor-not-allowed' 
                                    : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
                                    <span className="text-sm text-[var(--muted-foreground)]">Asking...</span>
                                </>
                            ) : (
                                <SendIcon className="text-[var(--primary-foreground)] h-5 w-5" />
                            )}
                        </button>
                    </div>
                    )
                }}
            />
        </div>
    )
}