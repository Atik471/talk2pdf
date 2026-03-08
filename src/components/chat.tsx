"use client";
import { initialMessages, scrollToBottom } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { ChatLine } from "./chat-line";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";


// Message Type
export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface ChatProps {
    chatId: string;
}

export function Chat({ chatId }: ChatProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Local State for Chat
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pdfName, setPdfName] = useState<string>("");

    // Load initial data
    useEffect(() => {
        const fetchChatData = async () => {
            // 1. Fetch Chat Metadata (PDF Name, etc)
            const { data: chatData } = await supabase
                .from("chats")
                .select("pdf_name")
                .eq("id", chatId)
                .single();

            if (chatData) {
                setPdfName(chatData.pdf_name);
            }

            // 2. Fetch Message History
            const { data: history } = await supabase
                .from("messages")
                .select("*")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: true });

            if (history && history.length > 0) {
                setMessages(history.map(m => ({
                    id: m.id,
                    role: m.role as "user" | "assistant",
                    content: m.content
                })));
            } else {
                setMessages(initialMessages);
            }
        };

        fetchChatData();
    }, [chatId]);

    // Scroll to Bottom Effect
    useEffect(() => {
        setTimeout(() => scrollToBottom(containerRef), 100);
    }, [messages]);

    // Send Message to AI Model
    const fetchAIResponse = async (userMessage: string) => {
        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage,
                    chatId: chatId // Pass chatId so backend can get context
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || "Failed to get AI response");
            }

            const data = await response.json();
            return data.reply || "Sorry, I am unable to process that.";
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Error processing your request.";
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userContent = input;
        setInput("");
        setIsLoading(true);

        // 1. Save User Message to Supabase
        const { data: userMsgData } = await supabase
            .from("messages")
            .insert([
                {
                    chat_id: chatId,
                    role: "user",
                    content: userContent
                }
            ])
            .select()
            .single();

        if (userMsgData) {
            setMessages((prev) => [...prev, {
                id: userMsgData.id,
                role: "user",
                content: userContent
            }]);
        }

        // 2. Get AI Response
        const aiResponse = await fetchAIResponse(userContent);

        // 3. Update UI (Backend already saved the AI message)
        setMessages((prev) => [...prev, {
            id: Date.now().toString(), // Temporary ID for UI
            role: "assistant",
            content: aiResponse
        }]);

        setIsLoading(false);
    };


    return (
        <div className="rounded-2xl border h-[95vh] flex flex-col justify-between bg-white dark:bg-[#171717]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-2xl">
                <h2 className="font-semibold truncate max-w-[70%]">{pdfName || "Chatting with PDF"}</h2>
                <span className="text-xs text-gray-500">ID: {chatId.slice(0, 8)}...</span>
            </div>

            <div className="p-6 overflow-auto" ref={containerRef}>
                {messages.map(({ id, role, content }: Message) => (
                    <ChatLine
                        key={id}
                        role={role}
                        content={content}
                        sources={[]}
                    />
                ))}
                {isLoading && (
                    <div className="flex justify-center p-4">
                        <Spinner />
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="p-4 flex clear-both border-t">
                <Input
                    value={input}
                    placeholder="Type to chat with AI..."
                    onChange={(e) => setInput(e.target.value)}
                    className="mr-2"
                />

                <Button type="submit" className="w-24 bg-violet-600 hover:bg-violet-700 text-white" disabled={isLoading}>
                    {isLoading ? <Spinner /> : "Ask"}
                </Button>
            </form>
        </div>
    );
}
