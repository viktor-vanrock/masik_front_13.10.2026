import { CreateContent } from "./ui/CreateContent";
import { useApp } from "@/hooks/useApp";

export const CreateBenchmark = () => {
  const { user } = useApp();
  return (
    <CreateContent key={user?.id} />
  );
}
