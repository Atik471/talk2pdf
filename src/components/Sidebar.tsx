"use client";

import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  File,
  FolderPlus,
  Loader2,
  LogIn,
  MonitorCog,
  Moon,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
// Next auth
// import { signOut } from "next-auth/react";
import { useSession, getSession } from "next-auth/react";
import UserInfo from "./UserInfo";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [chats, setChats] = React.useState<any[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Add mounting check and fetch chats
  React.useEffect(() => {
    setMounted(true);
    if (status === "authenticated") {
      fetchRecentChats();
    }
  }, [status]);

  const fetchRecentChats = async () => {
    const { data } = await supabase
      .from("chats")
      .select("id, pdf_name, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setChats(data);
  };

  const handleNewChat = () => {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }

    setIsUploading(true);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        setIsUploading(false);
        return;
      }

      try {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("pdfs")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        const ingestResponse = await fetch("/api/pdf-rag-ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pdfUrl: publicUrl,
            pdfName: file.name,
            // @ts-ignore
            userId: session?.user?.id
          }),
        });

        if (!ingestResponse.ok) throw new Error("Ingestion failed");

        const ingestData = await ingestResponse.json();

        await fetchRecentChats();
        router.push(`/chat/${ingestData.chatId}`);
        if (onClose) onClose();
      } catch (err) {
        console.error("Upload error in sidebar:", err);
        alert("Failed to upload PDF. Please try again.");
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const deleteChat = async (id: string) => {
    const { error } = await supabase.from("chats").delete().eq("id", id);
    if (!error) {
      setChats(prev => prev.filter(c => c.id !== id));
      if (window.location.pathname.includes(id)) {
        router.push("/");
      }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 h-screen bg-white dark:bg-[#171717] text-gray-900 dark:text-gray-100 flex flex-col border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo and Theme Toggle */}
        <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tight">Talk2PDF</span>
          </Link>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-gray-200 dark:border-gray-800"
                >
                  {mounted &&
                    (theme === "system" ? (
                      <MonitorCog className="h-[1.2rem] w-[1.2rem]" />
                    ) : theme === "dark" ? (
                      <Moon className="h-[1.2rem] w-[1.2rem]" />
                    ) : (
                      <Sun className="h-[1.2rem] w-[1.2rem]" />
                    ))}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-gray-200 dark:border-gray-800"
              >
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <MonitorCog className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden h-8 w-8"
              aria-label="Close Sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20"
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            <span>New Chat</span>
          </Button>
        </div>

        {/* Recent Chats List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-2">
            Recent Chats
          </h3>
          <ul className="space-y-1">
            {chats.length > 0 ? (
              chats.map((chat) => (
                <li
                  key={chat.id}
                  className="group flex justify-between items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(`/chat/${chat.id}`);
                    if (onClose) onClose();
                  }}
                >
                  <div className="flex items-center min-w-0">
                    <File className="mr-2 h-4 w-4 text-violet-500 shrink-0" />
                    <span className="truncate text-sm">{chat.pdf_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic px-2">
                {status === "authenticated" ? "No chats yet" : "Sign in to see your chats"}
              </div>
            )}
          </ul>
        </div>

        {/* User info and login Section */}
        {status === "authenticated" ? (
          <div className="p-2 border-t border-gray-200 dark:border-gray-800">
            <UserInfo />
          </div>
        ) : (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-xs text-center text-gray-500 mb-4 px-2">
              Sign in to save your PDF chat history
            </h2>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full border-violet-200 dark:border-violet-900/30 hover:bg-violet-50 dark:hover:bg-violet-900/10">
                <LogIn className="mr-2 h-4 w-4 text-violet-600" />
                <span>Login</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
