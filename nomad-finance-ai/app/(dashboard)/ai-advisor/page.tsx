import type { Metadata } from "next";
import { AiAdvisor } from "@/components/dashboard/ai-advisor";

export const metadata: Metadata = {
  title: "AI Advisor",
};

export default function AIAdvisorPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">AI Financial Advisor</h1>
      <AiAdvisor />
    </div>
  );
}
