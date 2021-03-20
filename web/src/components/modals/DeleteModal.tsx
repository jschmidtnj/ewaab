import { FunctionComponent } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';
import { AiOutlineWarning } from 'react-icons/ai';
import { toast } from 'react-toastify';

interface ModalArgs {
  toggleModal: () => void;
  onSubmit: () => Promise<void>;
  title: string;
  infoMessage: string;
}

const DeleteModal: FunctionComponent<ModalArgs> = (args) => {
  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pb-52 text-center">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <OutsideClickHandler
          onOutsideClick={() => {
            args.toggleModal();
          }}
        >
          <div
            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-headline"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AiOutlineWarning className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-headline"
                  >
                    {args.title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{args.infoMessage}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={async (evt) => {
                  evt.preventDefault();
                  try {
                    await args.onSubmit();
                    args.toggleModal();
                  } catch (err) {
                    toast((err as Error).message, {
                      type: 'error',
                    });
                  }
                }}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={(evt) => {
                  evt.preventDefault();
                  args.toggleModal();
                }}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </OutsideClickHandler>
      </div>
    </div>
  );
};

export default DeleteModal;
