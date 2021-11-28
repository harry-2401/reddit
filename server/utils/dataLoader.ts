import { User } from "../entities/User";
import DataLoader from "dataloader";
import { Upvote } from "../entities/Upvote";

interface VoteTypeConditions {
  postId: number;
  userId: number;
}

const batchGetUser = async (userIds: number[]) => {
  const user = await User.findByIds(userIds);
  return userIds.map((userid) => user.find((user) => user.id === userid));
};

const batchGetVoteType = async (voteTypeConditions: VoteTypeConditions[]) => {
  const voteTypes = await Upvote.findByIds(voteTypeConditions);

  return voteTypeConditions.map((voteTypeCondition) =>
    voteTypes.find(
      (voteType) =>
        voteType.postId === voteTypeCondition.postId &&
        voteType.userId === voteTypeCondition.userId
    )
  );
};

export const buildDataLoaders = () => ({
  userLoader: new DataLoader<number, User | undefined>((userIds) =>
    batchGetUser(userIds as number[])
  ),
  voteTypeLoader: new DataLoader<VoteTypeConditions, Upvote | undefined>(
    (voteTypeConditions) =>
      batchGetVoteType(voteTypeConditions as VoteTypeConditions[])
  ),
});
