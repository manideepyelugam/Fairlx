import { useParams } from "next/navigation";

export const useProgramId = () => {
  const params = useParams();
  return params.programId as string;
};
