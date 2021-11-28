import { PostsDocument, useMeQuery, usePostsQuery } from "../generated/graphql";
import { addApolloState, initializeApollo } from "../lib/apolloClient";
import {
  Flex,
  Spinner,
  Stack,
  Box,
  Link,
  Heading,
  Text,
  Button,
} from "@chakra-ui/react";
import NextLink from "next/link";
import Layout from "../components/Layout";
import PostEditDeleteButton from "../components/PostEditDeleteButton";
import { NetworkStatus } from "@apollo/client";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import UpvoteSection from "../components/UpvoteSection";

export const limit = 3;

const Index = () => {
  const {data: meData} = useMeQuery()
  const { data, loading, fetchMore, networkStatus } = usePostsQuery({
    variables: {
      limit,
    },
    //component nào được render bởi postQuery, sẽ re-render component đó khi network status thay đổi, tức là fetchMore
    notifyOnNetworkStatusChange: true,
  });

  const loadingMorePosts = networkStatus === NetworkStatus.fetchMore;

  const loadMorePosts = () =>
    fetchMore({
      variables: {
        cursor: data?.posts?.cursor,
      },
    });

  return (
    <Layout>
      {loading && !loadingMorePosts ? (
        <Flex
          justifyContent="center"
          alignItems="center"
          maxW="800px"
          minH="100vh"
        >
          <Spinner />
        </Flex>
      ) : (
        <Stack>
          {console.log("re-render")}
          {data?.posts?.paginatedPosts?.map((post) => (
            <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
              <UpvoteSection post={post}/>
              <Box flex={1}>
                <NextLink href={`/post/${post.id}`}>
                  <Link>
                    <Heading fontSize="xl">{post.title}</Heading>
                  </Link>
                </NextLink>

                <Text>posted by {post.user.username}</Text>

                <Flex align="center">
                  <Text mt={4}>{post.textSnippet}</Text>
                  <Box ml="auto">
                    {meData?.me?.id === post.user.id && <PostEditDeleteButton postId={post.id} userId={post.user.id} />}
                  </Box>
                </Flex>
              </Box>
            </Flex>
          ))}
        </Stack>
      )}

      {data?.posts?.hasMore && (
        <Flex>
          <Button
            m="auto"
            my={8}
            isLoading={loadingMorePosts}
            onClick={loadMorePosts}
          >
            {loadingMorePosts ? "Loading..." : "Show more"}
          </Button>
        </Flex>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
  const apolloClient = initializeApollo({
    headers: context.req.headers
  });

  await apolloClient.query({
    query: PostsDocument,
    variables: {
      limit,
    },
  });

  return addApolloState(apolloClient, {
    props: {},
  });
};

export default Index;
