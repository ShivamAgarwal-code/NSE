"use client";
import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { UIBLOCK } from "../agent/actions";

const STORAGE_KEY = 'hedgy_messages';

interface Message {
    blocks: Array<UIBLOCK>,
    id: string
}

interface HedgyContext {
    currentPrompt: string | null,
    messages: Array<Message>,
    isLoading: boolean,
    setCurrentPrompt: (prompt: string | null) => void,
    addMessage: (message: Message) => void,
    setLoading: (loading: boolean) => void,
    clearMessages: () => void
}

const hedgyContext = createContext<HedgyContext>({
    addMessage(){},
    setCurrentPrompt() {},
    messages: [], 
    isLoading: false,
    setLoading(){},
    currentPrompt: null,
    clearMessages(){}
})

export function HedgyContextWrapper(props: {children: ReactNode}) {
    const [messages, setMessages] = useState<Array<Message>>([]);
    const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
    const [isLoading, setLoading] = useState(false);

    // Load messages from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                setMessages(parsedMessages);
            } catch (error) {
                console.error('Error loading messages from localStorage:', error);
            }
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    const addMessage = (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
    };

    const clearMessages = () => {
        setMessages([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <hedgyContext.Provider
            value={{
                addMessage,
                currentPrompt,
                isLoading,
                messages,
                setCurrentPrompt,
                setLoading,
                clearMessages
            }}
        >
            {props.children}
        </hedgyContext.Provider>
    )
} 

export function useHedgyState() { 
    const context = useContext(hedgyContext);
    return context;
}