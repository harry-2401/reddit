import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useMeQuery } from "../generated/graphql";

//custom hook
export const useCheckAuth = () => {
  const router = useRouter();
  const { data, loading, error } = useMeQuery();
  useMutation;

  useEffect(() => {
    if (
      !loading &&
      data?.me &&
      (router.route === "/login" ||
        router.route === "/register" ||
        router.route === "/forgot-password" ||
        router.route === "/change-password") &&
      !error
    ) {
      router.replace("/");
    }
  }, [data, loading, router]);

  return { data, loading, error };
};
