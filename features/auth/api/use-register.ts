import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

import { honoClient } from "@/lib/hono";

type ResponseType = InferResponseType<typeof honoClient.api.users.$post>;
type RequestType = InferRequestType<typeof honoClient.api.users.$post>["json"];

export const useRegister = () => {
  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await honoClient.api.users.$post({ json });
      if (!response.ok) {
        throw new Error("Failed to register");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Registration successful! Please check your email to verify your account.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
}; 