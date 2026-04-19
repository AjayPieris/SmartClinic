

namespace SmartClinic.API.Data.Models;

public enum VerificationStatus
{
    Pending  = 0,   // Doctor registered, awaiting admin review
    Approved = 1,   // Admin approved — doctor gets verified badge
    Rejected = 2,   // Admin rejected — doctor can resubmit documents
}
