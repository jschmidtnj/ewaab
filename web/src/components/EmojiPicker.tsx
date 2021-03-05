import { Picker } from 'emoji-mart';
import { FunctionComponent, ReactNode } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';

interface EmojiPickerArgs {
  isVisible: boolean;
  toggleView: () => void;
  currentEmoji?: string;
  setEmoji: (emoji: string) => Promise<void>;
  children: ReactNode;
}

const EmojiPicker: FunctionComponent<EmojiPickerArgs> = (args) => {
  // https://dev.to/alexandprivate/build-your-own-react-tooltip-component-25bd
  // TODO - create component
  return (
    <div>
      {!args.isVisible ? null : (
        <OutsideClickHandler
          onOutsideClick={() => {
            console.log('clicked outside');
            args.toggleView();
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
      )}
      {args.children}
    </div>
  );
};

export default EmojiPicker;
