import { Picker } from 'emoji-mart';
import { FunctionComponent, HTMLAttributes, ReactNode } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import sleep from 'shared/sleep';

interface EmojiPickerArgs {
  isVisible: boolean;
  toggleView: () => void;
  currentEmoji?: string;
  setEmoji: (emoji: string) => Promise<void>;
  children: ReactNode;
  className?: HTMLAttributes<HTMLDivElement>['className'];
}

const EmojiPicker: FunctionComponent<EmojiPickerArgs> = (args) => {
  return (
    <div className={args.className}>
      {!args.isVisible ? null : (
        <div className="absolute mt-8 flex items-center z-20">
          <OutsideClickHandler
            onOutsideClick={async () => {
              await sleep(50);
              if (args.isVisible) {
                args.toggleView();
              }
            }}
          >
            <Picker
              showPreview={false}
              showSkinTones={false}
              emoji={args.currentEmoji}
              onSelect={async (emoji) => {
                await args.setEmoji(emoji.id!);
                args.toggleView();
              }}
            />
          </OutsideClickHandler>
        </div>
      )}
      {args.children}
    </div>
  );
};

export default EmojiPicker;
