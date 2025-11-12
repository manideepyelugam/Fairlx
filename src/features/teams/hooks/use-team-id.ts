import { useQueryState, parseAsString } from "nuqs";

export const useTeamId = () => {
  return useQueryState("teamId", parseAsString);
};
