// src/app/(dashboard)/sales/pipeline/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PipelineBoard from "./PipelineBoard";

export default async function PipelinePage() {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  // Fetch all leads that aren't completely dead ("Not Interested" / "Not Eligible")
  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };
  const activeLeads = await prisma.lead.findMany({
    where: {
      ...branchCondition,
      caseStatus: "Stage 1 Under Process",
      feedbackStatus: {
        notIn: ["Not Interested", "Not Eligible"]
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Visual Sales Pipeline</h1>
        <p className="text-slate-500 text-sm mt-1">
          Drag and drop your active clients to update their status. Changes are saved automatically.
        </p>
      </div>

      {/* Mount the interactive Client component and pass it the data */}
      <PipelineBoard initialLeads={activeLeads} />
      
    </div>
  );
}