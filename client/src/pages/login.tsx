//import { useMutation } from "@apollo/client";
import { Box, Button, FormControl } from "@chakra-ui/react";
import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import {
  LoginInput,
  MeDocument,
  MeQuery, useLoginMutation
} from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
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

  const [loginUser, { data, error, loading: _registerUserLoading }] =
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
      router.push("/");
    }
  };

  const initialValues: LoginInput = {
    usernameOrEmail: "",
    password: "",
  };

  return (
    <Wrapper>
      {error && <p>Faild to login. Internal server error</p>}
      {data && data.login.success && (
        <p>Login successfully {JSON.stringify(data)}</p>
      )}
      <Formik initialValues={initialValues} onSubmit={onLoginSubmit}>
        {({ isSubmitting }) => (
          <Form>
            <FormControl>
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
            </FormControl>
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
  );
};

export default login;
