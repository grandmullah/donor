import { NextRequest, NextResponse } from "next/server";
import { getBloodDonorSystem } from "@/lib/contracts";

export async function GET(req: NextRequest) {
      try {
            const { searchParams } = new URL(req.url);
            const address = searchParams.get("address");
            const saltParam = searchParams.get("salt") || "0";
            if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

            const salt = BigInt(saltParam);
            const sys = getBloodDonorSystem();
            const anonId = await sys.generateAnonymousId(address, salt);

            // Get donor information
            const donor = await sys.donors(anonId);
            const historyLen = await sys.getDonationHistoryLength(anonId);
            const availableRewards = await sys.getAvailableRewards(anonId);
            const consents = await sys.getResearchConsents(anonId);

            return NextResponse.json({
                  anonymousId: anonId,
                  donor: {
                        bloodType: donor.bloodType,
                        donationCount: Number(donor.donationCount),
                        donorTier: Number(donor.donorTier),
                        consistencyScore: Number(donor.consistencyScore),
                        hasCompleteResearchProfile: donor.hasCompleteResearchProfile,
                        isRegistered: donor.isRegistered,
                        totalRewardsEarned: donor.totalRewardsEarned.toString(),
                        rewardsRedeemed: donor.rewardsRedeemed.toString(),
                        firstDonationDate: Number(donor.firstDonationDate),
                        lastDonationDate: Number(donor.lastDonationDate),
                  },
                  historyLength: Number(historyLen),
                  availableRewards: availableRewards.toString(),
                  consents: consents.map((consent: unknown) => {
                        const c = consent as {
                              researchInstitution: string;
                              grantedDate: bigint;
                              revokedDate: bigint;
                              isActive: boolean;
                              researchPurpose: string;
                        };
                        return {
                              researchInstitution: c.researchInstitution,
                              grantedDate: Number(c.grantedDate),
                              revokedDate: Number(c.revokedDate),
                              isActive: c.isActive,
                              researchPurpose: c.researchPurpose,
                        };
                  }),
            });
      } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "failed";
            return NextResponse.json({ error: message }, { status: 500 });
      }
}


