import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// The assistant's replies: markdown with tables, styled to match the app
// (no typography plugin in this project, so elements are styled here).
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed [&_strong]:font-semibold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          h1: ({ children }) => <h3 className="text-base font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 className="text-base font-semibold">{children}</h3>,
          h3: ({ children }) => <h4 className="font-semibold">{children}</h4>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4">{children}</a>,
          code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>,
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm tabular-nums">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60 text-left">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-1.5 font-medium">{children}</th>,
          td: ({ children }) => <td className="border-t px-3 py-1.5">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
