import { NextResponse } from "next/server";
import { getDAOGovernance } from "@/lib/contracts";

export async function GET() {
      try {
            const gov = getDAOGovernance();
            const [baseReward, consistencyBonus, dataCompletenessBonus, postDonationFeedbackBonus] =
                  await gov.getIncentiveParameters();

            return NextResponse.json({
                  baseReward: baseReward.toString(),
                  consistencyBonus: consistencyBonus.toString(),
                  dataCompletenessBonus: dataCompletenessBonus.toString(),
                  postDonationFeedbackBonus: postDonationFeedbackBonus.toString(),
            });
      } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "failed";
            return NextResponse.json({ error: message }, { status: 500 });
      }
}


