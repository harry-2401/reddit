import { Form, Formik, FormikHelpers } from "formik";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import {
  Button,
  Flex,
  Box,
  Link,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/react";
import {
  ChangePasswordInput,
  MeDocument,
  MeQuery,
  useChangePassMutation,
} from "../generated/graphql";
import router, { useRouter } from "next/router";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useState } from "react";
import NextLink from "next/link";
import { useCheckAuth } from "../utils/useCheckAuth";

const ChangePassword = () => {
  const { loading: authLoading, data: authData } = useCheckAuth();

  const {
    query: { userId, token },
  } = useRouter();
  const initialValues = { newPassword: "" };
  const [changePassword, { loading }] = useChangePassMutation();

  const [tokenError, setTokenError] = useState("");

  const onChangePasswordSubmit = async (
    values: ChangePasswordInput,
    { setErrors }: FormikHelpers<ChangePasswordInput>
  ) => {
    if (token && userId) {
      const response = await changePassword({
        variables: {
          userId: userId as string,
          token: token as string,
          changePasswordInput: values,
        },
        update(cache, { data }) {
          // console.log("DATA", data)
          // const meData = cache.readQuery({query: MeDocument})
          // console.log("MEDATA", meData)
          if (data?.changePassword.success) {
            cache.writeQuery<MeQuery>({
              query: MeDocument,
              data: { me: data.changePassword.user },
            });
          }
        },
      });

      if (response.data?.changePassword.errors) {
        const filedsError = mapFieldErrors(
          response.data?.changePassword.errors
        );
        console.log(filedsError);

        if ("token" in filedsError) {
          setTokenError(filedsError.token);
        }
        setErrors(filedsError);
      } else if (response.data?.changePassword.user) {
        router.push("/");
      }
    }
  };

  if (authLoading || authData?.me) {
    return (
      <Flex alignItems="center" justifyContent="center" minH="100vh">
        <Spinner />
      </Flex>
    );
  } else if (!userId || !token) {
    return (
      <Wrapper size="small">
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Invalid password change request</AlertTitle>
        </Alert>

        <Flex mt={2}>
          <NextLink href="/login" passHref>
            <Link ml="auto">Back to login</Link>
          </NextLink>
        </Flex>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Formik initialValues={initialValues} onSubmit={onChangePasswordSubmit}>
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassword"
              placeholder="New password"
              label="New Password"
              type="password"
            />
            {tokenError && (
              <Flex>
                <Box color="red" mr={2}>
                  {tokenError}
                </Box>
                <Box>
                  <NextLink href="/forgot-password" passHref>
                    <Link>Go back to Forgot password</Link>
                  </NextLink>
                </Box>
              </Flex>
            )}

            <Button
              type="submit"
              colorScheme="teal"
              mt={4}
              isLoading={isSubmitting}
            >
              Change Password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

export default ChangePassword;
