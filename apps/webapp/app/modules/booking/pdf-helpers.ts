import type {
  Asset,
  Location,
  Category,
  Organization,
  Prisma,
  Kit,
  OrganizationRoles,
} from "@prisma/client";
import { db } from "~/database/db.server";
import { validateBookingOwnership } from "~/utils/booking-authorization.server";
import { calculateTotalValueOfAssets } from "~/utils/bookings";
import { getClientHint } from "~/utils/client-hints";
import { ShelfError } from "~/utils/error";
import { groupAndSortAssetsByKit } from "./helpers";
import { getBooking } from "./service.server";
import { getQrCodeMaps } from "../qr/service.server";
import { TAG_WITH_COLOR_SELECT } from "../tag/constants";

export interface SortParams {
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

export interface PdfDbResult {
  booking: Prisma.BookingGetPayload<{
    include: {
      custodianTeamMember: true;
      custodianUser: true;
      tags: typeof TAG_WITH_COLOR_SELECT;
    };
  }>;
  assets: (Asset & {
    category: Pick<Category, "name"> | null;
    location: Pick<Location, "name"> | null;
    kit: Pick<
      Kit,
      "name" | "minimizeInPdf" | "image" | "imageExpiration" | "description"
    > | null;
  })[];
  totalValue: string;
  organization: Pick<
    Organization,
    "id" | "name" | "imageId" | "currency" | "updatedAt"
  >;
  assetIdToQrCodeMap: Record<string, string>;
  kitIdToQrCodeMap: Record<string, string>;
  from?: string;
  to?: string;
  originalFrom?: string;
  originalTo?: string;
}

export async function fetchAllPdfRelatedData(
  bookingId: string,
  organizationId: string,
  userId: string,
  role: OrganizationRoles | undefined,
  request: Request,
  sortParams?: SortParams
): Promise<PdfDbResult> {
  try {
    const booking = await getBooking({
      id: bookingId,
      organizationId,
      request,
      extraInclude: { tags: TAG_WITH_COLOR_SELECT },
    });

    if (role) {
      validateBookingOwnership({
        booking,
        userId,
        role,
        action: "view",
        checkCustodianOnly: true,
      });
    }

    // Get sort params
    const orderBy = sortParams?.orderBy || "status";
    const orderDirection = sortParams?.orderDirection || "desc";

    const [assets, organization] = await Promise.all([
      db.asset.findMany({
        where: {
          id: { in: booking?.assets.map((a) => a.id) || [] },
        },
        include: {
          category: {
            select: {
              name: true,
            },
          },
          qrCodes: true,
          location: {
            select: {
              name: true,
            },
          },
          kit: {
            select: {
              id: true,
              name: true,
              minimizeInPdf: true,
              image: true,
              imageExpiration: true,
              description: true,
            },
          },
        },
      }),
      db.organization.findUnique({
        where: { id: organizationId },
        select: {
          imageId: true,
          name: true,
          id: true,
          currency: true,
          updatedAt: true,
        },
      }),
    ]);

    if (!organization) {
      throw new ShelfError({
        cause: null,
        message: "Organization not found",
        status: 404,
        label: "Organization",
      });
    }

    // Group by kit and sort - this ensures kit assets stay together
    const sortedAssets = groupAndSortAssetsByKit(
      assets,
      orderBy,
      orderDirection
    );

    const assetIdToQrCodeMap = await getQrCodeMaps({
      assets: sortedAssets,
      userId,
      organizationId,
      size: "small",
    });

    // Extract unique kits from sorted assets
    const kitsMap = new Map<
      string,
      { id: string; name: string; qrCodes: any[] }
    >();
    for (const asset of sortedAssets) {
      if (asset.kit && asset.kitId && !kitsMap.has(asset.kitId)) {
        // Fetch kit with qrCodes to generate QR code map
        const kitWithQr = await db.kit.findUnique({
          where: { id: asset.kitId },
          select: { id: true, name: true, qrCodes: true },
        });
        if (kitWithQr) {
          kitsMap.set(asset.kitId, kitWithQr);
        }
      }
    }

    // Generate QR codes for kits (using similar logic as assets)
    const kitIdToQrCodeMap: Record<string, string> = {};
    const kits = Array.from(kitsMap.values());

    const { generateCode } = await import("../qr/utils.server");
    const kitQrPromises = kits.map(async (kit) => {
      try {
        const qr = kit.qrCodes[0];
        if (qr) {
          const qrCode = await generateCode({
            version: qr.version as any,
            errorCorrection: qr.errorCorrection as any,
            size: "small",
            qr,
          });
          if (qrCode?.code?.src) {
            kitIdToQrCodeMap[kit.id] = qrCode.code.src;
          }
        }
      } catch (error) {
        console.error(`Error processing kit QR with id ${kit.id}:`, error);
      }
    });
    await Promise.all(kitQrPromises);

    return {
      booking,
      assets: sortedAssets,
      totalValue: calculateTotalValueOfAssets({
        assets: booking.assets,
        currency: organization.currency,
        locale: getClientHint(request).locale,
      }),
      organization,
      assetIdToQrCodeMap,
      kitIdToQrCodeMap,
    };
  } catch (cause) {
    throw new ShelfError({
      cause,
      message: "Error fetching booking data for PDF",
      status: 500,
      label: "Booking",
    });
  }
}
