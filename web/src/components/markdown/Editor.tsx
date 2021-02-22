import SimpleMDE from 'react-simplemde-editor';
import { useState } from 'react';
import Markdown from './Markdown';

interface EditorArgs {
  onChange: (newVal: string) => void;
  value: string;
}

const Editor = (args: EditorArgs): JSX.Element => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  return (
    <div className="flex flex-col w-full">
      <nav className="flex flex-col sm:flex-row text-sm">
        <button
          className={
            (!showPreview
              ? 'text-blue-500 border-b-2 font-medium border-blue-500'
              : '') +
            'text-gray-600 py-3 px-4 block hover:text-blue-500 focus:outline-none'
          }
          onClick={(evt) => {
            evt.preventDefault();
            setShowPreview(false);
          }}
        >
          Edit
        </button>
        <button
          className={
            (showPreview
              ? 'text-blue-500 border-b-2 font-medium border-blue-500'
              : '') +
            'text-gray-600 py-3 px-4 block hover:text-blue-500 focus:outline-none'
          }
          onClick={(evt) => {
            evt.preventDefault();
            setShowPreview(true);
          }}
        >
          Preview
        </button>
      </nav>
      <div className="mt-1">
        {!showPreview ? (
          <SimpleMDE
            onChange={args.onChange}
            value={args.value}
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
