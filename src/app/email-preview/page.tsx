import { emailTemplates } from "@/lib/email-templates";

export const metadata = {
  title: "Email Previews",
};

export default function EmailPreviewPage() {
  const previews = [
    {
      id: "enquiryToTeam",
      name: "Enquiry to Team",
      content: emailTemplates.enquiryToTeam({ name: "John Doe", phone: "+91 9876543210", email: "john@example.com" })
    },
    {
      id: "enquiryAcknowledgement",
      name: "Enquiry Acknowledgement",
      content: emailTemplates.enquiryAcknowledgement({ name: "John Doe" })
    },
    {
      id: "seatAvailable",
      name: "Seat Available",
      content: emailTemplates.seatAvailable({ name: "John Doe", seatLabel: "A12" })
    },
    {
      id: "admissionInvoice",
      name: "Admission Invoice",
      content: emailTemplates.admissionInvoice({ 
        name: "John Doe", 
        invoiceId: "INV-12345", 
        registration: 400, 
        caution: 300, 
        monthly: 1500, 
        total: 2200, 
        dueDate: "2024-05-10" 
      })
    },
    {
      id: "credentials",
      name: "Credentials",
      content: emailTemplates.credentials({ name: "John Doe", email: "john@example.com", password: "securepassword" })
    },
    {
      id: "monthlyDue",
      name: "Monthly Due",
      content: emailTemplates.monthlyDue({ name: "John Doe", amount: 1500, monthLabel: "May 2024" })
    },
    {
      id: "paymentVerified",
      name: "Payment Verified",
      content: emailTemplates.paymentVerified({ name: "John Doe", invoiceId: "INV-12345", amountApplied: 2200, nextDueDate: "2024-06-10" })
    },
    {
      id: "examAlert",
      name: "Exam Alert",
      content: emailTemplates.examAlert({ title: "UPSC Prelims Notification Out", category: "UPSC", summary: "The official notification for the 2024 UPSC Prelims has been released. Click below to view the details.", link: "https://bodhieduhub.com" })
    }
  ];

  return (
    <main className="p-4 md:p-8 space-y-8 md:space-y-12 bg-[#f9f8f6] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-serif text-[#1b3022] mb-4">Email Previews</h1>
        <p className="text-[#405042] mb-8">
          This page allows you to preview how your HTML emails will look. 
          The templates have been updated to be fully responsive. Try resizing your browser window or viewing this page on your phone to see the text and spacing scale down beautifully.
        </p>
        
        <div className="space-y-12">
          {previews.map((preview) => (
            <div key={preview.id} className="border border-[#e5e7eb] rounded-2xl overflow-hidden bg-white shadow-sm">
              <div className="bg-[#f3f4f6] px-6 py-4 border-b border-[#e5e7eb]">
                <h2 className="text-lg font-bold text-[#1f2937]">{preview.name}</h2>
                <p className="text-sm text-[#4b5563] mt-1 font-mono">Subject: {preview.content.subject}</p>
              </div>
              <div className="bg-gray-100 p-2 md:p-6 flex justify-center">
                {/* 
                  Using an iframe is the most accurate way to preview email HTML 
                  since it prevents the app's global CSS from leaking in.
                */}
                <iframe 
                  srcDoc={preview.content.html} 
                  className="w-full max-w-[800px] h-[600px] border border-gray-200 rounded-xl shadow-md bg-white resize-x overflow-auto" 
                  title={preview.name}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
