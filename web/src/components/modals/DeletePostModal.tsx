import {
  DeletePostMutation,
  DeletePostMutationVariables,
  DeletePost,
} from 'lib/generated/datamodel';
import { FunctionComponent } from 'react';
import { toast } from 'react-toastify';
import { client } from 'utils/apollo';
import DeleteModal from './DeleteModal';

interface ModalArgs {
  toggleModal: () => void;
  onSubmit: () => Promise<void>;
  variables: DeletePostMutationVariables;
}

const DeletePostModal: FunctionComponent<ModalArgs> = (args) => {
  return (
    <DeleteModal
      title="Delete post"
      infoMessage="Are you sure you want to delete this post? This action
      cannot be undone."
      toggleModal={args.toggleModal}
      onSubmit={async () => {
        const deletePostRes = await client.mutate<
          DeletePostMutation,
          DeletePostMutationVariables
        >({
          mutation: DeletePost,
          variables: args.variables,
        });
        if (deletePostRes.errors) {
          throw new Error(deletePostRes.errors.join(', '));
        }
        toast('Deleted Post', {
          type: 'success',
        });
        await args.onSubmit();
      }}
    />
  );
};

export default DeletePostModal;
