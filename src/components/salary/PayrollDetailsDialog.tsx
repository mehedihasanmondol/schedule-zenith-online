
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, DollarSign, Calendar, User, Building } from "lucide-react";
import { Payroll, Profile, BankAccount } from "@/types/database";

interface PayrollDetailsDialogProps {
  payroll: Payroll | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  profile?: Profile | null;
  bankAccount?: BankAccount | null;
}

export const PayrollDetailsDialog = ({ 
  payroll, 
  open, 
  onOpenChange, 
  onRefresh,
  profile, 
  bankAccount 
}: PayrollDetailsDialogProps) => {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const handleDownload = () => {
    const content = generatePayrollContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${profile?.full_name?.replace(/\s+/g, '-')}-${payroll?.pay_period_start}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generatePayrollContent = () => {
    if (!payroll || !profile) return '';
    
    return `
PAYROLL STATEMENT
=================

Employee Information:
Name: ${profile.full_name}
Email: ${profile.email}
Role: ${profile.role}
Employment Type: ${profile.employment_type}

Pay Period:
Start Date: ${new Date(payroll.pay_period_start).toLocaleDateString()}
End Date: ${new Date(payroll.pay_period_end).toLocaleDateString()}

Payment Details:
Total Hours: ${payroll.total_hours}
Hourly Rate: $${payroll.hourly_rate.toFixed(2)}
Gross Pay: $${payroll.gross_pay.toFixed(2)}
Deductions: $${payroll.deductions.toFixed(2)}
Net Pay: $${payroll.net_pay.toFixed(2)}

Bank Account Information:
${bankAccount ? `
Bank Name: ${bankAccount.bank_name}
Account Number: ${bankAccount.account_number}
Account Holder: ${bankAccount.account_holder_name}
${bankAccount.bsb_code ? `BSB Code: ${bankAccount.bsb_code}` : ''}
${bankAccount.swift_code ? `SWIFT Code: ${bankAccount.swift_code}` : ''}
` : 'No bank account information available'}

Status: ${payroll.status.toUpperCase()}
Generated: ${new Date(payroll.created_at).toLocaleDateString()}

---
This is an automatically generated payroll statement.
`;
  };

  if (!payroll || !profile) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Details - {profile.full_name}
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                {isPrinting ? 'Preparing...' : 'Print'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6" id="payroll-content">
          {/* Employee Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Full Name</div>
                <div className="font-medium">{profile.full_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-medium">{profile.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Role</div>
                <div className="font-medium capitalize">{profile.role}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Employment Type</div>
                <div className="font-medium capitalize">{profile.employment_type}</div>
              </div>
              {profile.phone && (
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{profile.phone}</div>
                </div>
              )}
              {profile.full_address && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium">{profile.full_address}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pay Period Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Pay Period Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Start Date</div>
                <div className="font-medium">{new Date(payroll.pay_period_start).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">End Date</div>
                <div className="font-medium">{new Date(payroll.pay_period_end).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`font-medium capitalize ${
                  payroll.status === 'paid' 
                    ? 'text-green-600' 
                    : payroll.status === 'pending'
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`}>
                  {payroll.status}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Calculation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Payment Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Hours</div>
                    <div className="text-xl font-bold">{payroll.total_hours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Hourly Rate</div>
                    <div className="text-xl font-bold">${payroll.hourly_rate.toFixed(2)}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Pay</span>
                    <span className="font-medium">${payroll.gross_pay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Deductions</span>
                    <span className="font-medium">-${payroll.deductions.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Net Pay</span>
                    <span className="font-bold text-green-600">${payroll.net_pay.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Information */}
          {bankAccount && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5" />
                  Bank Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Bank Name</div>
                  <div className="font-medium">{bankAccount.bank_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Account Number</div>
                  <div className="font-medium">{bankAccount.account_number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Account Holder</div>
                  <div className="font-medium">{bankAccount.account_holder_name}</div>
                </div>
                {bankAccount.bsb_code && (
                  <div>
                    <div className="text-sm text-gray-600">BSB Code</div>
                    <div className="font-medium">{bankAccount.bsb_code}</div>
                  </div>
                )}
                {bankAccount.swift_code && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">SWIFT Code</div>
                    <div className="font-medium">{bankAccount.swift_code}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-sm text-gray-500">
                <p>This payroll statement was generated on {new Date(payroll.created_at).toLocaleDateString()}</p>
                <p className="mt-1">Payroll ID: {payroll.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <style>{`
          @media print {
            .dialog-content {
              box-shadow: none !important;
              border: none !important;
            }
            
            button {
              display: none !important;
            }
            
            .dialog-header {
              border-bottom: 1px solid #ccc;
              padding-bottom: 1rem;
              margin-bottom: 1rem;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};
