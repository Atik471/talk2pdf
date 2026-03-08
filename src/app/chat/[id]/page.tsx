import { Chat } from "@/components/chat";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: chatId } = await params;

    return (
        <section className="relative container flex min-h-screen flex-col">
            <div className="flex flex-1 py-4">
                <div className="w-full">
                    <Chat chatId={chatId} />
                </div>
            </div>
        </section>
    );
}
