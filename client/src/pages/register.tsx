//import { useMutation } from "@apollo/client";
import { Button, FormControl, Flex, Spinner, useToast } from "@chakra-ui/react";
import { Form, Formik, FormikHelpers } from "formik";
import { useRouter } from "next/router";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import {
  MeDocument,
  MeQuery,
  RegisterInput,
  useRegisterMutation,
} from "../generated/graphql";
import { mapFieldErrors } from "../helpers/mapFieldErrors";
import { useCheckAuth } from "../utils/useCheckAuth";
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

const register = () => {
  // const [registerUser, { data, error }] = useMutation<
  //   { register: UserMutationResponse },
  //   { registerInput: NewUserInput }
  // >(registerMutation);
  const router = useRouter();
  const { loading: authLoading, data: authData } = useCheckAuth();
  const toast = useToast()

  const [registerUser, { data, error, loading: _registerUserLoading }] =
    useRegisterMutation();

  const onRegisterSubmit = async (
    values: RegisterInput,
    { setErrors }: FormikHelpers<RegisterInput>
  ) => {
    const response = await registerUser({
      variables: {
        registerInput: values,
      },
      update(cache, { data }) {
        if (data?.register.success) {
          cache.writeQuery<MeQuery>({
            query: MeDocument,
            data: { me: data.register.user },
          });
        }
      },
    });
    if (response.data?.register.errors) {
      setErrors(mapFieldErrors(response.data.register.errors));
    } else if (response.data?.register.success) {
      toast({
        title: "Welcome",
        description: "Logged is successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/");
    }
  };

  const initialValues: RegisterInput = {
    username: "",
    email: "",
    password: "",
  };

  return (
    <>
      {authLoading || authData?.me ? (
        <Flex alignItems="center" justifyContent="center" minH="100vh">
          <Spinner />
        </Flex>
      ) : (
        <Wrapper>
          {error && <p>Faild to register. Internal server error</p>}
          {data && data.register.success && (
            <p>Register successfully {JSON.stringify(data)}</p>
          )}
          <Formik initialValues={initialValues} onSubmit={onRegisterSubmit}>
            {({ isSubmitting }) => (
              <Form>
                <FormControl>
                  <InputField
                    name="username"
                    placeholder="Username"
                    label="Username"
                    type="text"
                  />
                  <InputField
                    name="email"
                    placeholder="Email"
                    label="Email"
                    type="text"
                  />
                  <InputField
                    name="password"
                    placeholder="Password"
                    label="Password"
                    type="password"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="teal"
                  mt={4}
                  isLoading={isSubmitting}
                >
                  Register
                </Button>
              </Form>
            )}
          </Formik>
        </Wrapper>
      )}
    </>
  );
};

export default register;
