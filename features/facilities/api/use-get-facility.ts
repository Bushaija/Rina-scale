import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono";

// Match actual API response structure
type ResponseType = {
    id: number;
    name: string;
    facilityType: "hospital" | "health_center";
    districtId: number;
};

export const useGetFacilityById = (id?: number, options: { enabled?: boolean } = {}) => {
    const query = useQuery<ResponseType, Error>({
        queryKey: ["facility", { id }],
        queryFn: async () => {
            const response = await honoClient.api.facilities[":id"].$get({
                param: {
                    id: id!,
                },
            });
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to fetch facility: ${response.status} ${error}`);
            }
            const result = await response.json();
            return result;
        },
        enabled: options.enabled !== false && !!id,
    });
    return query;
};