import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { executionApiClient } from "./client";
import { CreateExecutionData } from "./types";

export const useCreateExecute = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (data: CreateExecutionData[]) => executionApiClient.createExecutionData(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["execution-data"] });
            toast.success("Execution data created successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create execution data");
        },
    });

    return mutation;
}