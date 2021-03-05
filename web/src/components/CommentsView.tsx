import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'state';
import Avatar from 'components/Avatar';
import { avatarWidth } from 'shared/variables';

interface CommentsViewArgs {
  post: string;
}

const CommentsView: FunctionComponent<CommentsViewArgs> = (_args) => {
  const avatar = useSelector<RootState, string | undefined>(
    (state) => state.authReducer.user.avatar
  );
  return (
    <div className="py-2">
      <Avatar avatar={avatar} avatarWidth={avatarWidth} />
    </div>
  );
};

export default CommentsView;
