import { useCallback, useEffect, useMemo, useState } from 'react';
import isHotkey from 'is-hotkey';
import { Editable, withReact, useSlate, Slate } from 'slate-react';
import {
  Editor,
  Transforms,
  createEditor,
  Node,
  Element as SlateElement,
  Text,
} from 'slate';
import escapeHtml from 'escape-html';
import { withHistory } from 'slate-history';
import {
  AiOutlineBold,
  AiOutlineItalic,
  AiOutlineUnderline,
  AiOutlineCode,
} from 'react-icons/ai';
import {
  MdLooksOne,
  MdLooksTwo,
  MdFormatQuote,
  MdFormatListNumbered,
  MdFormatListBulleted,
} from 'react-icons/md';
import { jsx } from 'slate-hyperscript';
import { Converter } from 'showdown';
import sleep from 'shared/sleep';

const deserialize = (el: HTMLElement): any => {
  if (el.nodeType === 3) {
    return el.textContent;
  } else if (el.nodeType !== 1) {
    return null;
  }

  const children = Array.from(el.childNodes).map(deserialize);

  switch (el.nodeName) {
    case 'BODY':
      return jsx('fragment', {}, children);
    case 'BR':
      return '\n';
    case 'BLOCKQUOTE':
      return jsx('element', { type: 'quote' }, children);
    case 'P':
      return jsx('element', { type: 'paragraph' }, children);
    case 'A':
      return jsx(
        'element',
        { type: 'link', url: el.getAttribute('href') },
        children
      );
    case 'CODE':
      return jsx('element', { type: 'code' }, children)
    case 'CODE':
      return jsx('element', { type: 'code' }, children)
    default:
      return el.textContent;
  }
};

const serialize = (node: Node) => {
  if (Text.isText(node)) {
    return escapeHtml(node.text);
  }

  const children = node.children.map((n) => serialize(n)).join('');

  switch (node.type) {
    case 'underline':
      return `<u>${children}</u>`;
    case 'link':
      return `<a href="${escapeHtml(node.url as string)}">${children}</a>`;
    case 'italic':
      return `<i>${children}</i>`;
    case 'bold':
      return `<b>${children}</b>`;
    case 'block-quote':
      return `<blockquote><p>${children}</p></blockquote>`;
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'code':
      return `<code>${children}</code>`;
    case 'heading-one':
      return `<h1>${children}</h1>`;
    case 'heading-two':
      return `<h2>${children}</h2>`;
    case 'numbered-list':
      return `<ol>${children}</ol>`;
    case 'bulleted-list':
      return `<ul>${children}</ul>`;
    case 'list-item':
      return `<li>${children}</li>`;
    default:
      return children;
  }
};

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

interface EditorArgs {
  initialContent: string;
}

const RichTextExample = (args: EditorArgs) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [value, setValue] = useState<Node[]>([]);
  const renderElement = useCallback((props) => <Element {...props} />, []);
  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  const [showdown, setShowdown] = useState<Converter | undefined>(undefined);

  useEffect(() => {
    const converter = new Converter();
    setShowdown(converter);
    const htmlData = converter.makeHtml(args.initialContent);
    console.log(htmlData);
    const htmlDocument = new DOMParser().parseFromString(htmlData, 'text/html');
    const parsedData = deserialize(htmlDocument.body);
    console.log(parsedData);
    setValue(parsedData);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!showdown) {
      return;
    }
    const htmlData = value.map((val) => serialize(val)).join('');
    const markdown = showdown.makeMarkdown(htmlData);
    console.log(htmlData, markdown);
  }, [value]);

  return (
    <>
      {loading ? null : (
        <Slate
          editor={editor}
          value={value}
          onChange={(value) => setValue(value)}
        >
          <div>
            <MarkButton format="bold" Icon={AiOutlineBold} />
            <MarkButton format="italic" Icon={AiOutlineItalic} />
            <MarkButton format="underline" Icon={AiOutlineUnderline} />
            <MarkButton format="code" Icon={AiOutlineCode} />
            <BlockButton format="heading-one" Icon={MdLooksOne} />
            <BlockButton format="heading-two" Icon={MdLooksTwo} />
            <BlockButton format="block-quote" Icon={MdFormatQuote} />
            <BlockButton format="numbered-list" Icon={MdFormatListNumbered} />
            <BlockButton format="bulleted-list" Icon={MdFormatListBulleted} />
          </div>
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Enter some rich text…"
            spellCheck
            autoFocus
            className="markdown"
            onKeyDown={(event) => {
              for (const hotkey in HOTKEYS) {
                if (isHotkey(hotkey, event as any)) {
                  event.preventDefault();
                  const mark = HOTKEYS[hotkey];
                  toggleMark(editor, mark);
                }
              }
            }}
          />
        </Slate>
      )}
    </>
  );
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      LIST_TYPES.includes(
        // @ts-ignore
        !Editor.isEditor(n) && SlateElement.isElement(n) && n.type
      ),
    split: true,
  });
  const newProperties: Partial<SlateElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : format,
  };
  Transforms.setNodes(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor, format) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });

  return !!match;
};

const isMarkActive = (editor, format) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

const BlockButton = ({ format, Icon }) => {
  const editor = useSlate();
  return (
    <button
      className={isBlockActive(editor, format) ? 'bg-gray-500' : 'bg-gray-200'}
      onClick={(evt) => {
        evt.preventDefault();
        toggleBlock(editor, format);
      }}
    >
      <Icon />
    </button>
  );
};

const MarkButton = ({ format, Icon }) => {
  const editor = useSlate();
  return (
    <button
      className={isMarkActive(editor, format) ? 'bg-gray-500' : 'bg-gray-200'}
      onClick={(evt) => {
        evt.preventDefault();
        toggleMark(editor, format);
      }}
    >
      <Icon />
    </button>
  );
};

export default RichTextExample;
