import { useParams } from "next/navigation";

export const useProgramIdParam = () => {
  const params = useParams();
  return params.programId as string;
};
