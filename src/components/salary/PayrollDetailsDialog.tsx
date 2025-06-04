
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, Clock, User, Building2, FileText } from "lucide-react";
import { Payroll } from "@/types/database";
import { format } from "date-fns";

interface PayrollDetailsDialogProps {
  payroll: Payroll | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const PayrollDetailsDialog = ({ payroll, isOpen, onClose, onRefresh }: PayrollDetailsDialogProps) => {
  if (!payroll) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Payroll Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{(payroll as any).profiles?.full_name}</h3>
                <p className="text-sm text-gray-600">{(payroll as any).profiles?.email}</p>
              </div>
            </div>
            <Badge className={getStatusColor(payroll.status)}>
              {payroll.status}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Period</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{format(new Date(payroll.pay_period_start), 'MMM dd, yyyy')} - {format(new Date(payroll.pay_period_end), 'MMM dd, yyyy')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Hours Worked</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>{payroll.total_hours} hours</p>
                {payroll.overtime_hours > 0 && (
                  <p className="text-orange-600">{payroll.overtime_hours} overtime hours</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Earnings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Gross Pay:</span>
                  <span>${payroll.gross_pay.toFixed(2)}</span>
                </div>
                {payroll.overtime_pay > 0 && (
                  <div className="flex justify-between">
                    <span>Overtime Pay:</span>
                    <span>${payroll.overtime_pay.toFixed(2)}</span>
                  </div>
                )}
                {payroll.bonus > 0 && (
                  <div className="flex justify-between">
                    <span>Bonus:</span>
                    <span>${payroll.bonus.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Deductions</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>-${payroll.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Superannuation:</span>
                  <span>-${payroll.superannuation.toFixed(2)}</span>
                </div>
                {payroll.other_deductions > 0 && (
                  <div className="flex justify-between">
                    <span>Other:</span>
                    <span>-${payroll.other_deductions.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Net Pay</span>
              </div>
              <span className="text-2xl font-bold text-blue-900">
                ${payroll.net_pay.toFixed(2)}
              </span>
            </div>
          </div>

          {(payroll as any).bank_accounts && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Bank Account</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{(payroll as any).bank_accounts.bank_name}</p>
                  <p>****{(payroll as any).bank_accounts.account_number.slice(-4)}</p>
                </div>
              </div>
            </>
          )}

          {payroll.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Notes</h4>
                <p className="text-sm text-gray-600">{payroll.notes}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
