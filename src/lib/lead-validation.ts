interface LeadContactPhoneFields {
  phone?: string;
  mobile?: string;
  mobileNumber?: string;
}

interface LeadPhoneCheckInput {
  mobileNumber?: string;
  phone?: string;
  contactInfo?: LeadContactPhoneFields[];
}

export const LEAD_PHONE_OR_MOBILE_REQUIRED_MESSAGE =
  "Please add a phone or mobile number before converting to customer.";

export function leadHasPhoneOrMobile(lead: LeadPhoneCheckInput): boolean {
  const mobile = String(lead.mobileNumber || "").trim();
  const phone = String(lead.phone || "").trim();
  if (mobile || phone) return true;

  const contacts = Array.isArray(lead.contactInfo) ? lead.contactInfo : [];
  return contacts.some((contact) => {
    const contactPhone = String(contact.phone || "").trim();
    const contactMobile = String(contact.mobile || contact.mobileNumber || "").trim();
    return Boolean(contactPhone || contactMobile);
  });
}

export function leadCanConvertToCustomer(
  lead: LeadPhoneCheckInput,
  convertMobileNumber = ""
): boolean {
  return leadHasPhoneOrMobile({
    ...lead,
    mobileNumber: convertMobileNumber.trim() || lead.mobileNumber,
  });
}
