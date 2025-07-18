import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";

// Explicit response type definition
type ResponseType = {
  facilityId: number;
};

export const useGetFacilityByName = (
    facilityName: string,
    options: { enabled?: boolean } = {}
) => {
    
    const query = useQuery<ResponseType, Error>({
        queryKey: ["facility", "by-name", facilityName],
        queryFn: async () => {
            const response = await honoClient.api.facilities["by-name"].$get({
                query: {
                    facilityName,
                },
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to fetch facility: ${response.status} ${error}`);
            }
            const result = await response.json();
            return result;
        },
        enabled: 
            options.enabled !== false &&
            !!facilityName,
    });
    return query;
};