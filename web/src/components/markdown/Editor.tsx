import SimpleMDE from 'react-simplemde-editor';
import { FunctionComponent, useState } from 'react';
import Markdown from './Markdown';
import type { Editor as SimpleMDEEditor } from 'codemirror';
import type { KeyboardEvent } from 'react';

interface EditorArgs {
  onChange: (newVal: string) => void;
  value: string;
  onSubmit?: () => void;
}

const Editor: FunctionComponent<EditorArgs> = (args) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  return (
    <div className="flex flex-col w-full">
      <nav className="flex flex-row text-sm">
        <button
          className={
            (!showPreview
              ? 'text-blue-500 border-b-2 font-medium border-blue-500'
              : '') + 'text-gray-600 py-3 px-4 block hover:text-blue-500'
          }
          onClick={(evt) => {
            evt.preventDefault();
            setShowPreview(false);
          }}
          tabIndex={-1}
        >
          Edit
        </button>
        <button
          className={
            (showPreview
              ? 'text-blue-500 border-b-2 font-medium border-blue-500'
              : '') + 'text-gray-600 py-3 px-4 block hover:text-blue-500'
          }
          onClick={(evt) => {
            evt.preventDefault();
            setShowPreview(true);
          }}
          tabIndex={-1}
        >
          Preview
        </button>
      </nav>
      <div className="mt-1">
        {!showPreview ? (
          <SimpleMDE
            onChange={args.onChange}
            value={args.value}
            events={{
              // @ts-ignore
              keydown: (
                _instance: SimpleMDEEditor,
                evt: KeyboardEvent<HTMLDivElement>
              ) => {
                if (evt.key === 'Enter' && evt.ctrlKey && args.onSubmit) {
                  setTimeout(() => {
                    args.onSubmit();
                  }, 0);
                }
              },
            }}
            options={{
              toolbar: [
                'bold',
                'italic',
                'strikethrough',
                '|',
                'heading-3',
                'quote',
                '|',
                'unordered-list',
                'ordered-list',
                '|',
                'link',
                'guide',
              ],
            }}
          />
        ) : (
          <div className="rounded-md border-2 border-gray-200 px-4 py-10 w-auto">
            <Markdown content={args.value} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
