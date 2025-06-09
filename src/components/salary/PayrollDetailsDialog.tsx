import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, DollarSign, Calendar, User, Building, Clock, FileText } from "lucide-react";
import { Payroll, Profile, BankAccount, WorkingHour } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PayrollDetailsDialogProps {
  payroll: Payroll | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayrollDetailsDialog = ({ 
  payroll, 
  isOpen, 
  onClose
}: PayrollDetailsDialogProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [paymentBankAccount, setPaymentBankAccount] = useState<BankAccount | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (payroll && isOpen) {
      fetchPayrollDetails();
    }
  }, [payroll, isOpen]);

  const fetchPayrollDetails = async () => {
    if (!payroll) return;
    
    setLoading(true);
    try {
      // Fetch profile details
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', payroll.profile_id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch primary bank account for the profile
      const { data: bankData, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('profile_id', payroll.profile_id)
        .eq('is_primary', true)
        .single();

      if (!bankError && bankData) {
        setBankAccount(bankData);
      }

      // Fetch payment bank account if payroll has been paid
      if (payroll.bank_account_id && payroll.status === 'paid') {
        const { data: paymentBankData, error: paymentBankError } = await supabase
          .from('bank_accounts')
          .select('*')
          .eq('id', payroll.bank_account_id)
          .single();

        if (!paymentBankError && paymentBankData) {
          setPaymentBankAccount(paymentBankData);
        }
      }

      // Fetch working hours linked to this specific payroll via payroll_working_hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('payroll_working_hours')
        .select(`
          working_hours:working_hours_id (
            *,
            clients!working_hours_client_id_fkey (id, name, company),
            projects!working_hours_project_id_fkey (id, name)
          )
        `)
        .eq('payroll_id', payroll.id);

      if (hoursError) throw hoursError;
      
      // Extract working hours from the junction table response
      const linkedWorkingHours = (hoursData || [])
        .map(link => link.working_hours)
        .filter(wh => wh !== null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setWorkingHours(linkedWorkingHours as WorkingHour[]);

    } catch (error) {
      console.error('Error fetching payroll details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payroll details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
    a.download = `payslip-${profile?.full_name?.replace(/\s+/g, '-')}-${payroll?.pay_period_start}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Payslip downloaded successfully"
    });
  };

  const generatePayrollContent = () => {
    if (!payroll || !profile) return '';
    
    return `
PAYSLIP
=======

Company: Your Company Name
Pay Period: ${new Date(payroll.pay_period_start).toLocaleDateString()} - ${new Date(payroll.pay_period_end).toLocaleDateString()}
Pay Date: ${new Date().toLocaleDateString()}
Payslip ID: ${payroll.id}

EMPLOYEE INFORMATION
--------------------
Name: ${profile.full_name}
Email: ${profile.email}
Role: ${profile.role}
Employment Type: ${profile.employment_type}
${profile.phone ? `Phone: ${profile.phone}` : ''}
${profile.full_address ? `Address: ${profile.full_address}` : ''}

PAYMENT DETAILS
---------------
Total Hours: ${payroll.total_hours}
Hourly Rate: $${payroll.hourly_rate.toFixed(2)}
Gross Pay: $${payroll.gross_pay.toFixed(2)}
Deductions: $${payroll.deductions.toFixed(2)}
Net Pay: $${payroll.net_pay.toFixed(2)}

BANK ACCOUNT INFORMATION
------------------------
${bankAccount ? `
Bank Name: ${bankAccount.bank_name}
Account Number: ${bankAccount.account_number}
Account Holder: ${bankAccount.account_holder_name}
${bankAccount.bsb_code ? `BSB Code: ${bankAccount.bsb_code}` : ''}
${bankAccount.swift_code ? `SWIFT Code: ${bankAccount.swift_code}` : ''}
` : 'No bank account information available'}

${paymentBankAccount && payroll.status === 'paid' ? `
PAYMENT BANK ACCOUNT
--------------------
Bank Name: ${paymentBankAccount.bank_name}
Account Number: ${paymentBankAccount.account_number}
Account Holder: ${paymentBankAccount.account_holder_name}
${paymentBankAccount.bsb_code ? `BSB Code: ${paymentBankAccount.bsb_code}` : ''}
${paymentBankAccount.swift_code ? `SWIFT Code: ${paymentBankAccount.swift_code}` : ''}
Note: This payment was processed from this company bank account.
` : ''}

WORKING HOURS BREAKDOWN
-----------------------
${workingHours.map(wh => `
Date: ${new Date(wh.date).toLocaleDateString()}
Client: ${wh.clients?.company || 'N/A'}
Project: ${wh.projects?.name || 'N/A'}
Hours: ${wh.total_hours}h
Rate: $${wh.hourly_rate}/hr
Amount: $${(wh.total_hours * (wh.hourly_rate || 0)).toFixed(2)}
${wh.notes ? `Notes: ${wh.notes}` : ''}
`).join('\n')}

Status: ${payroll.status.toUpperCase()}
Generated: ${new Date().toLocaleDateString()}

---
This is an automatically generated payslip.
`;
  };

  if (!payroll) {
    return null;
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex justify-center items-center h-32">
            <div className="text-lg">Loading payroll details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payslip - {profile?.full_name}
            </DialogTitle>
            <div className="flex gap-2 print:hidden">
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

        <div className="space-y-6 print:space-y-4" id="payroll-content">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 print:pb-2">
            <h1 className="text-3xl font-bold text-gray-800 print:text-2xl">PAYSLIP</h1>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
              <div>Pay Period: {new Date(payroll.pay_period_start).toLocaleDateString()} - {new Date(payroll.pay_period_end).toLocaleDateString()}</div>
              <div>Pay Date: {new Date().toLocaleDateString()}</div>
              <div>Payslip ID: {payroll.id.slice(0, 8)}</div>
            </div>
          </div>

          {/* Employee Information */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="print:pb-2">
              <CardTitle className="flex items-center gap-2 text-lg print:text-base">
                <User className="h-5 w-5" />
                Employee Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
              <div>
                <div className="text-sm text-gray-600">Full Name</div>
                <div className="font-medium">{profile?.full_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Email</div>
                <div className="font-medium">{profile?.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Role</div>
                <div className="font-medium capitalize">{profile?.role}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Employment Type</div>
                <div className="font-medium capitalize">{profile?.employment_type}</div>
              </div>
              {profile?.phone && (
                <div>
                  <div className="text-sm text-gray-600">Phone</div>
                  <div className="font-medium">{profile.phone}</div>
                </div>
              )}
              {profile?.full_address && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-600">Address</div>
                  <div className="font-medium">{profile.full_address}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="print:shadow-none print:border">
            <CardHeader className="print:pb-2">
              <CardTitle className="flex items-center gap-2 text-lg print:text-base">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-2 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded print:bg-gray-50">
                  <div className="text-sm text-gray-600">Total Hours</div>
                  <div className="text-xl font-bold text-blue-600">{payroll.total_hours}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded print:bg-gray-50">
                  <div className="text-sm text-gray-600">Hourly Rate</div>
                  <div className="text-xl font-bold text-green-600">${payroll.hourly_rate.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded print:bg-gray-50">
                  <div className="text-sm text-gray-600">Gross Pay</div>
                  <div className="text-xl font-bold text-purple-600">${payroll.gross_pay.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded print:bg-gray-50">
                  <div className="text-sm text-gray-600">Net Pay</div>
                  <div className="text-xl font-bold text-orange-600">${payroll.net_pay.toFixed(2)}</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Pay</span>
                  <span className="font-medium">${payroll.gross_pay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Total Deductions</span>
                  <span className="font-medium">-${payroll.deductions.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Pay</span>
                  <span className="text-green-600">${payroll.net_pay.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Information */}
          {bankAccount && (
            <Card className="print:shadow-none print:border">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg print:text-base">
                  <Building className="h-5 w-5" />
                  Bank Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
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

          {/* Payment Bank Account Information */}
          {paymentBankAccount && payroll.status === 'paid' && (
            <Card className="print:shadow-none print:border">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg print:text-base">
                  <Building className="h-5 w-5" />
                  Payment Bank Account
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm text-gray-600">Bank Name</div>
                  <div className="font-medium">{paymentBankAccount.bank_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Account Number</div>
                  <div className="font-medium">{paymentBankAccount.account_number}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Account Holder</div>
                  <div className="font-medium">{paymentBankAccount.account_holder_name}</div>
                </div>
                {paymentBankAccount.bsb_code && (
                  <div>
                    <div className="text-sm text-gray-600">BSB Code</div>
                    <div className="font-medium">{paymentBankAccount.bsb_code}</div>
                  </div>
                )}
                {paymentBankAccount.swift_code && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">SWIFT Code</div>
                    <div className="font-medium">{paymentBankAccount.swift_code}</div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-green-800">
                      This payment was processed from this company bank account.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Working Hours Breakdown - Now showing only linked working hours */}
          {workingHours.length > 0 && (
            <Card className="print:shadow-none print:border">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg print:text-base">
                  <Clock className="h-5 w-5" />
                  Linked Working Hours ({workingHours.length} entries)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Date</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Client</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-600">Project</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Hours</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Rate</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-600">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workingHours.map((wh) => (
                        <tr key={wh.id} className="border-b border-gray-100">
                          <td className="py-2 px-2">{new Date(wh.date).toLocaleDateString()}</td>
                          <td className="py-2 px-2">{wh.clients?.company || 'N/A'}</td>
                          <td className="py-2 px-2">{wh.projects?.name || 'N/A'}</td>
                          <td className="py-2 px-2 text-right">{wh.total_hours}h</td>
                          <td className="py-2 px-2 text-right">${(wh.hourly_rate || 0).toFixed(2)}</td>
                          <td className="py-2 px-2 text-right font-medium">${(wh.total_hours * (wh.hourly_rate || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-300 font-bold">
                        <td colSpan={3} className="py-2 px-2 text-right">TOTALS:</td>
                        <td className="py-2 px-2 text-right">{workingHours.reduce((sum, wh) => sum + wh.total_hours, 0)}h</td>
                        <td className="py-2 px-2 text-right">-</td>
                        <td className="py-2 px-2 text-right">${workingHours.reduce((sum, wh) => sum + (wh.total_hours * (wh.hourly_rate || 0)), 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {workingHours.length === 0 && (
            <Card className="print:shadow-none print:border">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg print:text-base">
                  <Clock className="h-5 w-5" />
                  Linked Working Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  No working hours linked to this payroll record.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status and Footer */}
          <Card className="print:shadow-none print:border">
            <CardContent className="pt-6 print:pt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-gray-600">Payment Status</div>
                  <div className={`text-lg font-bold capitalize ${
                    payroll.status === 'paid' 
                      ? 'text-green-600' 
                      : payroll.status === 'approved'
                      ? 'text-blue-600'
                      : 'text-yellow-600'
                  }`}>
                    {payroll.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Generated On</div>
                  <div className="font-medium">{new Date(payroll.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="mt-4 text-center text-xs text-gray-500">
                <p>This is a computer-generated payslip. Please verify all details and contact HR for any discrepancies.</p>
                <p className="mt-1">Employee copy - retain for your records</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <style>{`
          @media print {
            body { margin: 0; }
            .dialog-content {
              box-shadow: none !important;
              border: none !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0.5rem !important;
            }
            
            button, .print\\:hidden {
              display: none !important;
            }
            
            .dialog-header {
              border-bottom: 1px solid #ccc;
              padding-bottom: 0.5rem;
              margin-bottom: 1rem;
            }
            
            .text-3xl { font-size: 1.5rem !important; }
            .text-xl { font-size: 1.1rem !important; }
            .text-lg { font-size: 1rem !important; }
            
            .space-y-6 > * + * { margin-top: 1rem !important; }
            .space-y-4 > * + * { margin-top: 0.75rem !important; }
            
            .bg-blue-50, .bg-green-50, .bg-purple-50, .bg-orange-50 {
              background-color: #f9f9f9 !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};
