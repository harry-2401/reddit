//import { useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Link,
  Spinner,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import {
  LoginInput,
  MeDocument,
  MeQuery,
  useLoginMutation,
} from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useCheckAuth } from "../utils/useCheckAuth";
import NextLink from 'next/link'
import { initializeApollo } from "../lib/apolloClient";
//import { registerMutation } from "../graphql-client/mutation/mutation";

// interface UserMutationResponse {
//   code: number;
//   success: boolean;
//   message: string;
//   user: string;
//   errors: string;
// }

// interface NewUserInput {
//   username: string;
//   email: string;
//   password: string;
// }

const login = () => {
  // const [registerUser, { data, error }] = useMutation<
  //   { register: UserMutationResponse },
  //   { registerInput: NewUserInput }
  // >(registerMutation);
  const router = useRouter();
  const toast = useToast();

  const { loading: authLoading, data: authData } = useCheckAuth();

  const [loginUser, { data: _data, error, loading: _registerUserLoading }] =
    useLoginMutation();

  const onLoginSubmit = async (
    values: LoginInput,
    { setErrors }: FormikHelpers<LoginInput>
  ) => {
    const response = await loginUser({
      variables: {
        loginInput: values,
      },
      update(cache, { data }) {
        // console.log("DATA", data)
        // const meData = cache.readQuery({query: MeDocument})
        // console.log("MEDATA", meData)
        if (data?.login.success) {
          cache.writeQuery<MeQuery>({
            query: MeDocument,
            data: { me: data.login.user },
          });
        }
      },
    });
    if (response.data?.login.errors) {
      setErrors(mapFieldErrors(response.data.login.errors));
    } else if (response.data?.login.success) {
      toast({
        title: "Welcome",
        description: "Logged is successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      const apolloClient = initializeApollo()
      apolloClient.resetStore() 

      router.push("/");
    }
  };

  const initialValues: LoginInput = {
    usernameOrEmail: "",
    password: "",
  };

  return (
    <>
      {authLoading || authData?.me ? (
        <Flex alignItems="center" justifyContent="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <Wrapper size="small">
          {error && <p>Faild to login. Internal server error</p>}

          <Formik initialValues={initialValues} onSubmit={onLoginSubmit}>
            {({ isSubmitting }) => (
              <Form>
                {console.log("re-render")}
                <InputField
                  name="usernameOrEmail"
                  placeholder="User name or email"
                  label="Username or email"
                  type="text"
                />
                <Box mt={4}>
                  <InputField
                    name="password"
                    placeholder="Password"
                    label="Password"
                    type="password"
                  />
                </Box>
                <Flex mt={2}>
                  <NextLink href="/forgot-password" passHref>
                    <Link ml='auto'>Forgot Password</Link>
                  </NextLink>
                </Flex>
                <Button
                  type="submit"
                  colorScheme="teal"
                  mt={4}
                  isLoading={isSubmitting}
                >
                  Login
                </Button>
              </Form>
            )}
          </Formik>
        </Wrapper>
      )}
    </>
  );
};

export default login;
