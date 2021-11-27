import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

//custom hook
export const useCheckAuth = () => {
  const router = useRouter();
  const { data, loading } = useMeQuery();

  useEffect(() => {
    if (!loading) {
      if (
        data?.me &&
        (router.route === "/login" ||
          router.route === "/register" ||
          router.route === "/forgot-password" ||
          router.route === "/change-password")
      ) {
        router.replace("/");
      } else if (
        !data?.me &&
        router.route !== "/login" &&
        router.route !== "/register"
      ) {
        router.replace("/login");
      }
    }
    console.log("usecheckAuth");
    console.log({ router }, loading, data);
  }, [data, loading, router]);

  return { data, loading };
};
