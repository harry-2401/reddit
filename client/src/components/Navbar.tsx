import { Box, Flex, Heading, Link, Button } from "@chakra-ui/react";
import NextLink from "next/link";
import {
  MeDocument,
  MeQuery,
  useLogoutMutation,
  useMeQuery,
} from "../generated/graphql";

const Navbar = () => {
  const { loading, data } = useMeQuery();
  const [logout, { loading: useLogoutMutationLoading }] = useLogoutMutation();

  const logoutUser = async () => {
    await logout({
      update(cache, { data }) {
        if (data?.logout) {
          cache.writeQuery<MeQuery>({ query: MeDocument, data: { me: null } });
        }
      },
    });
  };

  let body;

  if (loading) {
    body = null;
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login" passHref>
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href="/register" passHref>
          <Link>Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <>
        <Flex>
          <NextLink href='/create-post'>
            <Button mr={4}>Create post</Button>
          </NextLink>
          <Button onClick={logoutUser} isLoading={useLogoutMutationLoading}>
            Logout
          </Button>
        </Flex>
      </>
    );
  }

  return (
    <Box p={4} bg="tan">
      <Flex maxW={800} justifyContent="space-between" align="center" m="auto">
        <NextLink href="/">
          <Heading>Reddit</Heading>
        </NextLink>
        <Box>{body}</Box>
      </Flex>
    </Box>
  );
};

export default Navbar;
