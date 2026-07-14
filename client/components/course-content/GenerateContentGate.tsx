"use client";

import React from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { useGenerateContentMutation } from "@/lib/queries/course-content";

export default function GenerateContentGate({ moduleId }: { moduleId: string }) {
  const generateMutation = useGenerateContentMutation(moduleId);

  return (
    <>
      <div className="border border-hairline rounded-lg p-12 text-center bg-canvas flex flex-col items-center gap-4">
        {generateMutation.isError ? (
          <>
            <h3 className="heading-sm text-ink">Content generation failed</h3>
            <p className="body-sm text-body max-w-sm">
              Something went wrong while building this module. No content was saved — you can safely
              try again.
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="h-9 px-5 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} />
              Retry generation
            </button>
          </>
        ) : (
          <>
            <h3 className="heading-sm text-ink">No content yet</h3>
            <p className="body-sm text-body max-w-sm">
              This module doesn&apos;t have lessons or quiz questions yet. Generate them with AI —
              this can take a moment.
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="h-9 px-5 rounded-full bg-ink text-white hover:bg-ink-deep button-md flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              Generate content
            </button>
          </>
        )}
      </div>

      {generateMutation.isPending && (
        <div
          className="fixed inset-0 z-50 bg-canvas/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center px-6"
          role="alert"
          aria-busy="true"
        >
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ink"></div>
          <p className="heading-sm text-ink">Building your module</p>
          <p className="body-sm text-body max-w-sm">
            This can take a moment. Please don&apos;t navigate away.
          </p>
        </div>
      )}
    </>
  );
}
