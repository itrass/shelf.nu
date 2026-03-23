import { Text } from "@react-email/components";
import type { BookingForEmail } from "../types";

/** Footer used when sending normal user emails */
export const UserFooter = ({ booking }: { booking: BookingForEmail }) => (
  <>
    <Text style={{ fontSize: "14px", color: "#344054" }}>
      Cet email a été envoyé à {booking.custodianUser!.email} parce qu'il fait partie
      de l'espace de travail{" "}
      <span style={{ color: "#101828", fontWeight: "600" }}>
        "{booking.organization.name}"
      </span>
      . <br /> Si vous pensez que vous n'auriez pas dû recevoir cet email, merci de contacter le propriétaire ({booking.organization.owner.email}) de l'espace de travail.
    </Text>
    <Text style={{ marginBottom: "32px", fontSize: "14px", color: "#344054" }}>
      {" "}
      © {new Date().getFullYear()} Shelf.nu
    </Text>
  </>
);

/** Footer used when sending admin user emails */
export const AdminFooter = ({ booking }: { booking: BookingForEmail }) => (
  <>
    <Text style={{ fontSize: "14px", color: "#344054" }}>
      Cet email vous a été envoyé parce que vous êtes le propriétaire ou l'administrateur de l'espace de travail{" "}
      <span style={{ color: "#101828", fontWeight: "600" }}>
        "{booking.organization.name}"
      </span>
      . <br /> Si vous pensez que vous n'auriez pas dû recevoir cet email, merci de contacter le support.
    </Text>
    <Text style={{ marginBottom: "32px", fontSize: "14px", color: "#344054" }}>
      {" "}
      © {new Date().getFullYear()} Shelf.nu
    </Text>
  </>
);
