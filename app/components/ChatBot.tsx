"use client"
import React, { useState } from "react";
import { Message as MessageType } from "../types";
import Message from "./Message";



const ChatBot = () => {
    const [messages, setMessages] = useState<MessageType[]>([
        {
            role: "assistant",
            content: "Hi I'm the SupportAI assistant. How can I help you today?"
        }
    ]);
    const [message, setMessage] = useState("");

    // Change event for input elements
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);
    };

    // Form submit event for handling message send
    const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (message.trim() !== "") {
            setMessages([...messages, { role: "user", content: message }]);
            setMessage("");
        }
    };

    const sendMessage = async (message: string) => {
        setMessage('');
        setMessages([...messages, { role: "user", content: message }, { role: "assistant", content: "" }]);
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify([...messages, { role: "user", content: message }]),
        });

        const reader = response.body?.getReader();
        if (!reader) {
            console.error("Failed to get reader from response");
            return;
        }

        const decoder = new TextDecoder();

        const processText = async ({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> => {
            if (done) {
                return;
            }
            const text = decoder.decode(value, { stream: true });
            setMessages((messages: MessageType[]) => {
                const lastMessage = messages[messages.length - 1];
                const otherMessages = messages.slice(0, messages.length - 1);
                return [...otherMessages, { ...lastMessage, content: lastMessage.content + text }];
            });
            try {
                const result = await reader.read();
                return processText(result);
            } catch (error) {
                console.error("Error reading from stream:", error);
            }
        };

        try {
            const initialResult = await reader.read();
            await processText(initialResult);
        } catch (error) {
            console.error("Error initiating stream read:", error);
        }
    };


    return (
        <div className="flex justify-center items-center min-h-fit bg-Base py-24 md:py-0">
            <div
                style={{ boxShadow: "0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgb(0 0 0 / 0.05)" }}
                className="bg-white p-6 my-24 rounded-lg border border-[#e5e7eb] w-4/5 sm:w-4/5 md:w-1/3 h-[634px] flex flex-col overflow-hidden"
            >
                <div className="flex-grow overflow-y-auto">
                    {/* Heading */}
                    <div className="flex flex-col justify-center items-center space-y-1.5 pb-6">
                        <h1 className="font-semibold text-lg tracking-tight">SupportAI</h1>
                    </div>

                    {/* Chat Container */}
                    <div className="pr-4 h-[474px]" style={{ minWidth: "100%", display: "table" }}>
                        {messages.map((message, index) => (
                            <Message key={index} message={message} />
                        ))}
                    </div>
                </div>

                {/* Input box */}
                <div className="flex items-center pt-0">
                    <form className="flex items-center justify-center w-full space-x-2" onSubmit={handleSend}>
                        <input
                            className="flex h-10 w-full rounded-md border border-[#e5e7eb] px-3 py-2 text-sm placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#9ca3af] disabled:cursor-not-allowed disabled:opacity-50 text-[#030712] focus-visible:ring-offset-2"
                            placeholder="Type your message"
                            value={message}
                            onChange={handleInputChange}
                        />
                        <button
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium text-[#f9fafb] disabled:pointer-events-none disabled:opacity-50 bg-black hover:bg-[#111827E6] h-10 px-4 py-2"
                            onClick={() => sendMessage(message)}
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
