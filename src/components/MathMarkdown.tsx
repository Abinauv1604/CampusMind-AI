import React from 'react';
import katex from 'katex';
import { Copy, Check } from 'lucide-react';

interface MathMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Safely renders LaTeX mathematical formulas with KaTeX
 */
function renderKatex(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml'
    });
  } catch (err) {
    console.warn('[MathMarkdown] KaTeX parse warning:', err);
    // Fallback: safe escaped string
    return `<span class="katex-error text-amber-300 font-mono">${escapeHtml(math)}</span>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parses inline formatting including inline LaTeX formulas ($...$ and \(...\)),
 * bold, italic, inline code, and links.
 */
function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex patterns:
  // 1. \( ... \) inline math
  // 2. $ ... $ inline math (ensuring not \$ or currency like $50 or $100)
  // 3. `...` inline code
  // 4. **...** bold
  // 5. *...* italic
  // 6. [text](url) link
  const inlineRegex = /(\\\(([\s\S]+?)\\\))|((?<!\\)\$(?!\s|\d)(.+?)(?<!\s|\\)\$)|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))/;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      nodes.push(remaining);
      break;
    }

    // Text before match
    if (match.index > 0) {
      nodes.push(remaining.slice(0, match.index));
    }

    const [
      fullMatch,
      parenMathMatch,
      parenMathContent,
      dollarMathMatch,
      dollarMathContent,
      codeMatch,
      codeContent,
      boldMatch,
      boldContent,
      italicMatch,
      italicContent,
      linkMatch,
      linkText,
      linkUrl
    ] = match;

    if (parenMathMatch) {
      const html = renderKatex(parenMathContent, false);
      nodes.push(
        <span
          key={`m-p-${keyIdx++}`}
          className="inline-block align-middle px-0.5 text-cyan-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (dollarMathMatch) {
      const html = renderKatex(dollarMathContent, false);
      nodes.push(
        <span
          key={`m-d-${keyIdx++}`}
          className="inline-block align-middle px-0.5 text-cyan-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (codeMatch) {
      nodes.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700/80 text-cyan-300 font-mono text-[12px]"
        >
          {codeContent}
        </code>
      );
    } else if (boldMatch) {
      nodes.push(
        <strong key={`b-${keyIdx++}`} className="font-bold text-white">
          {parseInline(boldContent)}
        </strong>
      );
    } else if (italicMatch) {
      nodes.push(
        <em key={`i-${keyIdx++}`} className="italic text-slate-200">
          {parseInline(italicContent)}
        </em>
      );
    } else if (linkMatch) {
      nodes.push(
        <a
          key={`a-${keyIdx++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline font-medium"
        >
          {linkText}
        </a>
      );
    } else {
      nodes.push(fullMatch);
    }

    remaining = remaining.slice(match.index + fullMatch.length);
  }

  return nodes;
}

/**
 * Code block with copy action
 */
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
      <div className="px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[13px] font-mono text-cyan-200 leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Main MathMarkdown component:
 * Safely parses and renders Markdown with full LaTeX support (KaTeX)
 */
export const MathMarkdown: React.FC<MathMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content into blocks: code blocks, display math blocks, and regular markdown paragraphs
  // 1. Display math: $$...$$ or \[...\]
  // 2. Fenced code: ```...```
  const blockRegex = /(```(\w*)\n([\s\S]*?)```)|(\$\$([\s\S]+?)\$\$)|(\\\[([\s\S]+?)\\\])/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockKey = 0;

  const renderTextBlocks = (text: string) => {
    // Split into lines or paragraphs
    const paragraphs = text.split(/\n{2,}/);

    paragraphs.forEach((para, pIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return;

      // Check headings
      const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        if (level === 1) {
          elements.push(
            <h1 key={`h1-${blockKey++}`} className="text-lg font-bold text-white mt-4 mb-2 tracking-tight">
              {parseInline(text)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${blockKey++}`} className="text-base font-bold text-white mt-3.5 mb-1.5 tracking-tight">
              {parseInline(text)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={`h3-${blockKey++}`} className="text-sm font-bold text-cyan-300 mt-3 mb-1 tracking-tight">
              {parseInline(text)}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={`h4-${blockKey++}`} className="text-xs font-semibold text-slate-200 mt-2 mb-1">
              {parseInline(text)}
            </h4>
          );
        }
        return;
      }

      // Check horizontal rule
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
        elements.push(
          <hr key={`hr-${blockKey++}`} className="my-3 border-t border-slate-700/80" />
        );
        return;
      }

      // Check blockquote
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/gm, '');
        elements.push(
          <blockquote
            key={`bq-${blockKey++}`}
            className="my-2.5 pl-3.5 border-l-2 border-cyan-500/60 text-slate-300 italic text-sm"
          >
            {parseInline(quoteText)}
          </blockquote>
        );
        return;
      }

      // Check bullet / numbered list
      const lines = trimmed.split('\n');
      const isList = lines.every((l) => /^\s*([-*+]|\d+\.)\s+/.test(l));

      if (isList) {
        const isNumbered = /^\s*\d+\.\s+/.test(lines[0]);
        if (isNumbered) {
          elements.push(
            <ol key={`ol-${blockKey++}`} className="my-2 pl-5 list-decimal space-y-1 text-sm text-slate-200">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>
                  {parseInline(l.replace(/^\s*\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${blockKey++}`} className="my-2 pl-5 list-disc space-y-1 text-sm text-slate-200">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>
                  {parseInline(l.replace(/^\s*[-*+]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }
        return;
      }

      // Regular paragraph (preserving single linebreaks within paragraph)
      elements.push(
        <div key={`p-${blockKey++}`} className="my-1.5 leading-relaxed text-sm text-slate-200">
          {lines.map((line, lineIdx) => (
            <React.Fragment key={lineIdx}>
              {parseInline(line)}
              {lineIdx < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
      );
    });
  };

  while ((match = blockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      renderTextBlocks(content.slice(lastIndex, match.index));
    }

    const [
      ,
      codeBlockMatch,
      codeLang,
      codeContent,
      dollarDisplayMatch,
      dollarDisplayMath,
      bracketDisplayMatch,
      bracketDisplayMath
    ] = match;

    if (codeBlockMatch) {
      elements.push(
        <CodeBlock
          key={`code-block-${blockKey++}`}
          code={codeContent.replace(/\n$/, '')}
          language={codeLang}
        />
      );
    } else if (dollarDisplayMatch) {
      const html = renderKatex(dollarDisplayMath, true);
      elements.push(
        <div
          key={`disp-dollar-${blockKey++}`}
          className="my-3 py-1.5 px-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-cyan-200 overflow-x-auto shadow-inner"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (bracketDisplayMatch) {
      const html = renderKatex(bracketDisplayMath, true);
      elements.push(
        <div
          key={`disp-bracket-${blockKey++}`}
          className="my-3 py-1.5 px-3 bg-slate-900/60 rounded-xl border border-slate-800 text-center text-cyan-200 overflow-x-auto shadow-inner"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    renderTextBlocks(content.slice(lastIndex));
  }

  return (
    <div className={`space-y-1 text-slate-100 ${className}`}>
      {elements}
    </div>
  );
};
