import { useQueryState, parseAsString } from "nuqs";

export const useProgramId = () => {
  return useQueryState("programId", parseAsString);
};
