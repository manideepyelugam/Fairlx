"use client";

import { useParams } from "next/navigation";

export const useSpaceId = () => {
  const params = useParams();
  return params.spaceId as string;
};
