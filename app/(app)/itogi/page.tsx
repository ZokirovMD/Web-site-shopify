import { ModuleStub } from "@/components/shell/ModuleStub";
import { moduleMetadata } from "@/lib/metadata";

export const generateMetadata = () => moduleMetadata("itogi");

export default function Page() {
  return <ModuleStub module="itogi" />;
}
