"use client"

import { useHedgyState } from "../context"
import { PurchaseButton } from "./blocks/purchase-button"
import Summary from "./blocks/summary"
import { format } from "date-fns"

export default function Messages(){

    const { messages } = useHedgyState();

    return (
        <div className="flex-1 flex flex-col w-full p-4 gap-y-6 overflow-y-auto" > 
            {messages.map((message, i)=> {
                const timestamp = new Date(parseInt(message.id));
                const isUser = message.blocks.some(block => block.name === "USER_MESSAGE");
                const textBlocks = message.blocks.filter(block => 
                    block.name === "TEXT" || 
                    (block.props?.content && typeof block.props.content === "string")
                );
                
                return (
                    <div key={i} className={`w-full flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                        <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                                isUser 
                                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-none' 
                                    : 'bg-[var(--muted)] text-[var(--foreground)] rounded-bl-none'
                            }`}>
                                {isUser ? textBlocks.map((block, j) => (
                                    <div key={j} className="whitespace-pre-wrap">
                                        {block.props?.content}
                                    </div>
                                )) : null}
                                {message.blocks.map((block, j) => {
                                    if (block.name === "DISPLAY") {
                                        return <Summary key={j} content={block.props?.content ?? ""} />;
                                    }
                                    return null;
                                })}
                            </div>
                            {message.blocks.map((block, j) => {
                                if (block.name === "PURCHASE_BUTTON") {
                                    return (
                                        <PurchaseButton 
                                            key={j} 
                                            assetName={block.props?.assetName} 
                                            quantity={block.props?.quantity} 
                                        />
                                    );
                                }
                                return null;
                            })}
                            <span className="text-xs text-[var(--muted-foreground)] mt-1">
                                {format(timestamp, 'h:mm a')}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
