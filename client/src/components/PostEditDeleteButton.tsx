import { Reference } from "@apollo/client";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Box, IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import {
  PaginatedPosts,
  useDeletePostMutation,
  useMeQuery,
} from "../generated/graphql";

interface PostEditDeleteButtonsProps {
  postId: string;
  userId: string | number;
}

const PostEditDeleteButton = ({
  postId,
  userId,
}: PostEditDeleteButtonsProps) => {
  const router = useRouter();
  const [deletePost, _] = useDeletePostMutation();
  const { data: meData } = useMeQuery();

  if (meData?.me?.id !== userId.toString()) {
    return null;
  }

  const onPostDelete = async (postId: string) => {
    await deletePost({
      variables: {
        id: postId,
      },
      update(cache, { data }) {
        if (data?.deletePost.success) {
          cache.modify({
            fields: {
              posts(
                existing: Pick<
                  PaginatedPosts,
                  "__typename" | "cursor" | "hasMore" | "totalCount"
                > & { paginatedPosts: Reference[] }
              ) {
                const newPostsAfterDeletion = {
                  ...existing,
                  totalCount: existing.totalCount - 1,
                  paginatedPosts: existing.paginatedPosts.filter(
                    (postRefObject) => postRefObject.__ref !== `Post:${postId}`
                  ),
                };

                return newPostsAfterDeletion;
              },
            },
          });
        }
      },
    });

    if (router.route !== "/") router.push("/");
  };

  return (
    <Box>
      <NextLink href={`/post/edit/${postId}`}>
        <IconButton icon={<EditIcon />} aria-label="edit" mr={4} />
      </NextLink>
      <IconButton
        onClick={onPostDelete.bind(this, postId)}
        icon={<DeleteIcon />}
        aria-label="delete"
        mr={4}
        colorScheme="red"
      />
    </Box>
  );
};

export default PostEditDeleteButton;
