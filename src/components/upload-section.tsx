"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { UploadCloud } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSession, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UploadSection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle file drop
  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
  });

  // Function to upload files to Supabase Storage
  const uploadFiles = async () => {
    const currentSession = await getSession();
    if (!currentSession?.user) {
      setError("Please sign in to upload and chat with PDFs.");
      return;
    }

    setUploading(true);
    setError(null);

    for (const file of files) {
      const fileName = `${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(fileName, file, {
          cacheControl: "3600"
        });

      if (uploadError) {
        console.error("Supabase Upload Error:", uploadError);
        setError(`Failed to upload ${file.name}: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      try {
        const ingestResponse = await fetch("/api/pdf-rag-ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdfUrl: publicUrl,
            pdfName: file.name,
            // @ts-ignore
            userId: currentSession.user.id
          }),
        });

        if (!ingestResponse.ok) {
          throw new Error("Failed to process PDF with RAG");
        }

        const ingestData = await ingestResponse.json();

        // Redirect to the new chat page
        router.push(`/chat/${ingestData.chatId}`);

      } catch (err) {
        setError("Error processing your PDF for chat. Please try again.");
        console.error(err);
        setUploading(false);
        return;
      }
    }

    setFiles([]);
    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl p-6 border-2 border-dashed rounded-lg bg-white shadow-md">
      {/* Drag & Drop Area */}
      <div
        {...getRootProps()}
        className={`w-full p-10 text-center cursor-pointer rounded-md ${isDragActive ? "border-blue-500 bg-blue-100" : "border-gray-300"
          } border-2 border-dashed transition`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto mb-4 h-10 w-10 text-gray-500" />
        {isDragActive ? (
          <p className="text-blue-600">Drop the PDF here...</p>
        ) : (
          <p className="text-gray-500">
            Drag & drop a PDF here, or click to select one
          </p>
        )}
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <ul className="mt-4 w-full text-left">
          {files.map((file, index) => (
            <li key={index} className="p-2 bg-gray-700 rounded-md my-2 text-sm">
              {file.name}
            </li>
          ))}
        </ul>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <Button
          className="mt-4 w-full"
          onClick={uploadFiles}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload PDFs"}
        </Button>
      )}

      {/* Error Message */}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
