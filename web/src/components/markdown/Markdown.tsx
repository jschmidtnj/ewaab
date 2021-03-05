import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';
import { FunctionComponent } from 'react';

interface CodeArgs {
  language: string | null;
  value: string;
}

const CodeBlock: FunctionComponent<CodeArgs> = (args) => {
  return (
    <SyntaxHighlighter
      language={args.language ? args.language : null}
      style={docco}
    >
      {args.value}
    </SyntaxHighlighter>
  );
};

interface MarkdownArgs {
  content: string;
}

const Markdown: FunctionComponent<MarkdownArgs> = (args) => {
  return (
    <ReactMarkdown
      className="markdown"
      renderers={{
        code: CodeBlock,
      }}
      plugins={[gfm]}
    >
      {args.content}
    </ReactMarkdown>
  );
};

export default Markdown;
