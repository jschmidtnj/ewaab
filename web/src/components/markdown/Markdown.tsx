import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/cjs/styles/hljs';

interface CodeArgs {
  language: string | null;
  value: string;
}

const CodeBlock = (args: CodeArgs): JSX.Element => {
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

const Markdown = (args: MarkdownArgs): JSX.Element => {
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
